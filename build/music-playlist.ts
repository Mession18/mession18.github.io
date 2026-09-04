import { createHash } from 'node:crypto'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'
import { parseFile, selectCover } from 'music-metadata'
import type { Plugin } from 'vite'

/** 虚拟清单只保存文字和 URL，封面不再以 Base64 塞进首页 JavaScript。 */
const moduleId = 'virtual:island-music-playlist'
const resolvedId = `\0${moduleId}`
const coverRoute = '/__island_music_cover/'
const audioExtensions = new Set(['.mp3', '.wav', '.m4a', '.mp4', '.mpeg', '.aac', '.ogg', '.flac'])
const coverExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'])
type Cover = { data: Uint8Array; format: string } | null

/** 文件名采用“歌手 - 歌名”；只拆第一个分隔符，保留歌名内部的连字符。 */
export function splitTrackName(stem: string) {
  const spaced = stem.indexOf(' - ')
  const separator = spaced >= 0 ? spaced : stem.indexOf('-')
  if (separator < 0) return { title: stem.trim(), artist: '未知歌手' }
  return {
    artist: stem.slice(0, separator).trim() || '未知歌手',
    title: stem.slice(separator + (spaced >= 0 ? 3 : 1)).trim() || stem.trim(),
  }
}

/** 外部封面只做完整文件名或完整歌名匹配，避免相近歌曲意外共用封面。 */
const normalizeName = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
const hash = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex').slice(0, 24)

/** 开发时按需提取当前歌曲封面；构建时输出独立、按内容去重的图片文件。 */
export function musicPlaylistPlugin(): Plugin {
  const directory = join(process.cwd(), 'public', 'music')
  const coversDirectory = join(directory, 'covers')
  const files = new Map<string, string>()
  const cache = new Map<string, Promise<Cover>>()
  let building = false

  /** 修改时间与文件大小参与 key；同一封面的并发请求共用一次读取，改歌后自动失效。 */
  const readCover = (id: string, path: string) => {
    if (!cache.has(id))
      cache.set(
        id,
        parseFile(path, { skipCovers: false, duration: false })
          .then((metadata) => selectCover(metadata.common.picture) ?? null)
          .catch(() => {
            console.warn(`没有可读取的内嵌封面：${basename(path)}`)
            return null
          }),
      )
    return cache.get(id)!
  }

  return {
    name: 'island-music-playlist',
    configResolved(config) {
      building = config.command === 'build'
    },
    resolveId(id) {
      return id === moduleId ? resolvedId : undefined
    },
    async load(id) {
      if (id !== resolvedId) return
      if (!existsSync(directory)) return 'export default []'
      const covers = existsSync(coversDirectory)
        ? readdirSync(coversDirectory).filter((name) =>
            coverExtensions.has(extname(name).toLowerCase()),
          )
        : []
      const songs = readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && audioExtensions.has(extname(entry.name).toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }))
      const playlist: Array<{ title: string; artist: string; src: string; cover: string | null }> =
        []
      const emitted = new Set<string>()
      const liveIds = new Set<string>()

      // 顺序读取限制大批音频的峰值内存；开发环境这里只读目录与 stat，不解析音频。
      for (const { name } of songs) {
        const stem = basename(name, extname(name))
        const { title, artist } = splitTrackName(stem)
        const external =
          covers.find(
            (name) => normalizeName(basename(name, extname(name))) === normalizeName(stem),
          ) ??
          covers.find(
            (name) => normalizeName(basename(name, extname(name))) === normalizeName(title),
          )
        const path = join(directory, name)
        const stat = statSync(path)
        const key = hash(`${name}:${stat.size}:${stat.mtimeMs}`)
        files.set(key, path)
        liveIds.add(key)
        let cover: string | null = external
          ? `/music/covers/${encodeURIComponent(external)}`
          : `${coverRoute}${key}`
        if (building && !external) {
          const picture = await readCover(key, path)
          cover = null
          if (picture) {
            const extension = picture.format.includes('png')
              ? 'png'
              : picture.format.includes('webp')
                ? 'webp'
                : picture.format.includes('gif')
                  ? 'gif'
                  : 'jpg'
            const fileName = `assets/music-covers/${hash(picture.data)}.${extension}`
            if (!emitted.has(fileName))
              this.emitFile({ type: 'asset', fileName, source: picture.data })
            emitted.add(fileName)
            cover = `/${fileName}`
          }
        }
        playlist.push({ title, artist, src: `/music/${encodeURIComponent(name)}`, cover })
      }
      // 删除歌曲或替换文件后释放旧封面缓存，避免长时间开发时持续占用内存。
      for (const key of files.keys())
        if (!liveIds.has(key)) {
          files.delete(key)
          cache.delete(key)
        }
      return `export default ${JSON.stringify(playlist)}`
    },
    configureServer(server) {
      server.middlewares.use(coverRoute, async (request, response, next) => {
        const key = (request.url ?? '').split('?')[0].slice(1)
        const path = files.get(key)
        if (!path) {
          next()
          return
        }
        const picture = await readCover(key, path)
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        response.setHeader('Content-Type', picture?.format ?? 'image/svg+xml')
        response.end(
          picture
            ? Buffer.from(picture.data)
            : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#b9e4cf"/><text x="40" y="56" text-anchor="middle" font-size="48" fill="#38735c">♪</text></svg>',
        )
      })

      // 批量拷贝音乐时只刷新一次；关闭开发服务器同时解除监听和待执行任务。
      server.watcher.add(directory)
      let timer: ReturnType<typeof setTimeout> | undefined
      const reload = (file: string) => {
        const local = relative(directory, file)
        if (local === '..' || local.startsWith(`..${sep}`)) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          const module = server.moduleGraph.getModuleById(resolvedId)
          if (module) server.moduleGraph.invalidateModule(module)
          server.ws.send({ type: 'full-reload' })
        }, 400)
      }
      for (const event of ['add', 'unlink', 'change'] as const) server.watcher.on(event, reload)
      server.httpServer?.once('close', () => {
        clearTimeout(timer)
        for (const event of ['add', 'unlink', 'change'] as const) server.watcher.off(event, reload)
      })
    },
  }
}
