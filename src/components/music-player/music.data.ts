import generatedPlaylist from 'virtual:island-music-playlist'

/** 播放器需要的单曲字段：标题、歌手、音频地址及可选封面。 */
export type PlaylistTrack = {
  title: string
  artist: string
  src: string
  cover: string | null
}

// 此列表由 Vite 扫描 public/music 自动生成，无需手动维护。
export const islandPlaylist: PlaylistTrack[] = generatedPlaylist
