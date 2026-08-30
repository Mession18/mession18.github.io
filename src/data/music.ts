export type PlaylistTrack = {
  title: string
  artist: string
  src: string
}

// 固定歌单入口：后续只需要替换这里的曲目信息和音频地址。
export const islandPlaylist: PlaylistTrack[] = [
  {
    title: 'Blue Archive Symphony',
    artist: 'Orchestral Cover Album',
    src: '/music/Blue Archive Symphony (Blue Archive OST Orchestral Cover Album) - 未知歌手.m4a',
  },
  {
    title: 'Constant Moderato',
    artist: 'Mitsukiyo, KARUT, Nor',
    src: '/music/Mitsukiyo, KARUT, Nor - Blue Archive Symphony - 01 Constant Moderato - 未知歌手.wav',
  },
  {
    title: 'One More Light',
    artist: 'Linkin Park',
    src: '/music/One More Light - Linkin Park.mp3',
  },
]
