import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { standAssetsPlugin } from './build/stand-assets.ts'
import { musicPlaylistPlugin } from './build/music-playlist.ts'
import pageDefaults from './src/shared/site-settings.defaults.json'

// 素材扫描独立维护；音乐清单只包含地址，封面作为独立资源按需加载。
export default defineConfig({
  plugins: [
    musicPlaylistPlugin(),
    standAssetsPlugin(),
    react(),
    {
      name: 'page-settings-defaults',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'site-settings.defaults.json',
          source: JSON.stringify(pageDefaults),
        })
      },
    },
  ],
  base: '/',
  build: {
    assetsInlineLimit: (filePath) => (/\.(?:woff2?|ttf|otf)$/i.test(filePath) ? false : undefined),
  },
})
