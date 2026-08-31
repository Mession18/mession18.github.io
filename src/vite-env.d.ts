/// <reference types="vite/client" />

declare module 'animal-island-ui/style'

declare module 'virtual:island-music-playlist' {
  const playlist: Array<{
    title: string
    artist: string
    src: string
    cover: string | null
  }>
  export default playlist
}
