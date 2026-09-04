import { standAssetsPlugin } from './build/stand-assets.ts'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readdirSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'
import { parseFile, selectCover } from 'music-metadata'

// 音乐虚拟模块与允许的音频、封面格式；与底图插件一样由文件夹生成清单。
const virtualMusicId = 'virtual:island-music-playlist'
const resolvedVirtualMusicId = `\0${virtualMusicId}`
const audioExtensions = new Set(['.mp3', '.wav', '.m4a', '.mp4', '.mpeg', '.aac', '.ogg', '.flac'])
const coverExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'])

/** 统一大小写、全半角和标点，用于宽松匹配歌曲与封面文件名。 */
function normalizeName(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

/** 按最后一个分隔符拆出“歌名 - 歌手”；未带歌手时使用默认名称。 */
function splitTrackName(stem: string) {
  const spacedSeparator = stem.lastIndexOf(' - ')
  const separator = spacedSeparator >= 0 ? spacedSeparator : stem.lastIndexOf('-')
  if (separator < 0) return { title: stem.trim(), artist: '未知歌手' }
  const separatorLength = spacedSeparator >= 0 ? 3 : 1
  return {
    title: stem.slice(0, separator).trim() || stem.trim(),
    artist: stem.slice(separator + separatorLength).trim() || '未知歌手',
  }
}

/** 自动扫描音频及封面，生成播放器需要的模块；仅运行于开发服务器和构建阶段。 */
function musicPlaylistPlugin(): Plugin {
  const musicDirectory = join(process.cwd(), 'public', 'music')
  const coversDirectory = join(musicDirectory, 'covers')

  // 缺少音乐目录时返回空列表；有外部封面优先使用，否则读取音频内嵌封面。
  const createPlaylist = async () => {
    if (!existsSync(musicDirectory)) return []
    const covers = existsSync(coversDirectory)
      ? readdirSync(coversDirectory, { withFileTypes: true })
          .filter((item) => item.isFile() && coverExtensions.has(extname(item.name).toLowerCase()))
          .map((item) => ({
            name: item.name,
            stem: basename(item.name, extname(item.name)),
            normalized: normalizeName(basename(item.name, extname(item.name))),
          }))
      : []

    // 各曲目的元数据读取互不依赖，合并执行后按扫描顺序返回。
    return Promise.all(
      readdirSync(musicDirectory, { withFileTypes: true })
        .filter((item) => item.isFile() && audioExtensions.has(extname(item.name).toLowerCase()))
        .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN', { numeric: true }))
        .map(async (item) => {
          const stem = basename(item.name, extname(item.name))
          const { title, artist } = splitTrackName(stem)
          const normalizedStem = normalizeName(stem)
          const normalizedTitle = normalizeName(title)
          const cover =
            covers.find((item) => item.normalized === normalizedStem) ??
            covers.find((item) => item.normalized === normalizedTitle) ??
            covers.find(
              (item) =>
                item.normalized.length >= 4 &&
                (normalizedTitle.includes(item.normalized) ||
                  item.normalized.includes(normalizedTitle)),
            )
          // 外部封面未匹配时再读内嵌图片；单曲元数据异常不会中断整个歌单生成。
          let embeddedCover: string | null = null
          if (!cover) {
            try {
              const metadata = await parseFile(join(musicDirectory, item.name), {
                skipCovers: false,
              })
              const picture = selectCover(metadata.common.picture)
              if (picture) {
                embeddedCover = `data:${picture.format};base64,${picture.data.toString('base64')}`
              }
            } catch (error) {
              console.warn(`无法读取音频元数据：${item.name}`, error)
            }
          }
          return {
            title,
            artist,
            src: `/music/${item.name}`,
            cover: cover ? `/music/covers/${cover.name}` : embeddedCover,
          }
        }),
    )
  }

  return {
    name: 'island-music-playlist',
    // 将公共虚拟模块名转换为 Vite 内部 ID。
    resolveId(id) {
      return id === virtualMusicId ? resolvedVirtualMusicId : undefined
    },
    // 将当前歌单序列化成 JavaScript 模块供页面导入。
    async load(id) {
      if (id !== resolvedVirtualMusicId) return undefined
      return `export default ${JSON.stringify(await createPlaylist())}`
    },
    // 音乐或封面变化后清理清单缓存，刷新开发页面。
    configureServer(server) {
      server.watcher.add(musicDirectory)
      const reloadPlaylist = (file: string) => {
        const localPath = relative(musicDirectory, file)
        if (localPath.startsWith('..' + sep) || localPath === '..') return
        const module = server.moduleGraph.getModuleById(resolvedVirtualMusicId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reloadPlaylist)
      server.watcher.on('unlink', reloadPlaylist)
      server.watcher.on('change', reloadPlaylist)
    },
  }
}

// 注册实际构建插件；base 是站点部署根路径，固定素材地址也要与它匹配。
export default defineConfig({
  plugins: [musicPlaylistPlugin(), standAssetsPlugin(), react()],
  base: '/',
})
