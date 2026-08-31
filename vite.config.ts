import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readdirSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'

const virtualMusicId = 'virtual:island-music-playlist'
const resolvedVirtualMusicId = `\0${virtualMusicId}`
const audioExtensions = new Set(['.mp3', '.wav', '.m4a', '.mp4', '.mpeg', '.aac', '.ogg', '.flac'])
const coverExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'])

function normalizeName(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

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

function musicPlaylistPlugin(): Plugin {
  const musicDirectory = join(process.cwd(), 'public', 'music')
  const coversDirectory = join(musicDirectory, 'covers')

  const createPlaylist = () => {
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

    return readdirSync(musicDirectory, { withFileTypes: true })
      .filter((item) => item.isFile() && audioExtensions.has(extname(item.name).toLowerCase()))
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN', { numeric: true }))
      .map((item) => {
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
        return {
          title,
          artist,
          src: `/music/${item.name}`,
          cover: cover ? `/music/covers/${cover.name}` : null,
        }
      })
  }

  return {
    name: 'island-music-playlist',
    resolveId(id) {
      return id === virtualMusicId ? resolvedVirtualMusicId : undefined
    },
    load(id) {
      if (id !== resolvedVirtualMusicId) return undefined
      return `export default ${JSON.stringify(createPlaylist())}`
    },
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

export default defineConfig({ plugins: [musicPlaylistPlugin(), react()], base: '/' })
