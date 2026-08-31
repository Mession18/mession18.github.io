import generatedPlaylist from 'virtual:island-music-playlist'

export type PlaylistTrack = {
  title: string
  artist: string
  src: string
  cover: string | null
}

// 此列表由 Vite 扫描 public/music 自动生成，无需手动维护。
export const islandPlaylist: PlaylistTrack[] = generatedPlaylist
