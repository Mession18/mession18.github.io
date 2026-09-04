/// <reference types="vite/client" />

// 组件库样式入口没有额外类型导出，只声明其可被导入。
declare module 'animal-island-ui/style'

// 音乐插件输出的字段类型；实际清单由 build/music-playlist.ts 生成。
declare module 'virtual:island-music-playlist' {
  const playlist: Array<{
    title: string
    artist: string
    src: string
    cover: string | null
  }>
  export default playlist
}

// 底图插件输出的栏目键与素材类型；新增自动扫描栏目时同步扩展这里。
declare module 'virtual:island-stand-pools' {
  const pools: Record<
    'crafts' | 'museum' | 'recipes' | 'planting' | 'travel' | 'posts',
    Array<{
      id: string
      image: string
      layout: string
    }>
  >
  export default pools
}
