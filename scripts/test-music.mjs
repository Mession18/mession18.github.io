import assert from 'node:assert/strict'
import { createServer } from 'vite'

// 只启动 Vite 转换器，不监听端口；直接检查开发清单与构建输出资产。
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
})
try {
  const { splitTrackName, musicPlaylistPlugin } = await server.ssrLoadModule(
    '/build/music-playlist.ts',
  )
  assert.deepEqual(splitTrackName('Geoff Knorr - Elizabeth Peace - England'), {
    artist: 'Geoff Knorr',
    title: 'Elizabeth Peace - England',
  })
  assert.deepEqual(splitTrackName('歌手-歌名'), { artist: '歌手', title: '歌名' })
  assert.deepEqual(splitTrackName('纯音乐'), { artist: '未知歌手', title: '纯音乐' })
  const plugin = musicPlaylistPlugin()
  const id = plugin.resolveId('virtual:island-music-playlist')
  const dev = await plugin.load(id)
  const songs = JSON.parse(dev.slice('export default '.length))
  assert(!dev.includes('base64'))
  assert(songs.every((song) => !song.src.includes(' ') && !song.src.includes('#')))
  assert.equal(new Set(songs.map((song) => song.src)).size, songs.length)

  // 构建返回独立图片 URL；同一封面只输出一次，缺封面歌曲允许 null。
  plugin.configResolved({ command: 'build' })
  const assets = new Map()
  const built = await plugin.load.call(
    {
      emitFile(asset) {
        assert(!assets.has(asset.fileName), '同一封面不能重复输出')
        assets.set(asset.fileName, asset.source)
      },
    },
    id,
  )
  const production = JSON.parse(built.slice('export default '.length))
  assert.equal(production.length, songs.length)
  for (const song of production) {
    assert(!song.cover?.includes('base64'))
    if (song.cover?.startsWith('/assets/')) assert(assets.has(song.cover.slice(1)))
  }
  console.log(
    `音乐检查通过：${songs.length} 首，清单 ${Buffer.byteLength(built)} 字节，${assets.size} 张去重内嵌封面。`,
  )
} finally {
  await server.close()
}
