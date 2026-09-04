import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { standAssetsPlugin } from './build/stand-assets.ts'
import { musicPlaylistPlugin } from './build/music-playlist.ts'

// 素材扫描独立维护；音乐清单只包含地址，封面作为独立资源按需加载。
export default defineConfig({
  plugins: [musicPlaylistPlugin(), standAssetsPlugin(), react()],
  base: '/',
})
