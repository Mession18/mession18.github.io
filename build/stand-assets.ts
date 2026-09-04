import { existsSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import type { Plugin } from 'vite'

/** 每个栏目只能读取自己的素材目录；路径相对于 public。 */
export const standDirectories = {
  crafts: 'images/crafts/workbenches',
  museum: 'images/museum/pedestals',
  recipes: 'images/recipes/plates',
  planting: 'images/planting/pots',
  travel: 'images/travel/postcards',
  posts: 'images/posts/backgrounds',
} as const

// 图片格式白名单；先转小写再判断，说明文档等非图片文件不会进入随机池。
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg'])
// 浏览器导入的虚拟模块名与 Vite 内部 ID；清单由本插件生成，不是磁盘上的 TS 文件。
const virtualId = 'virtual:island-stand-pools'
const resolvedId = `\0${virtualId}`

// 扫描输出的最小素材结构；页面可以在读取后补充自己的 layout 映射。
type StandAsset = { id: string; image: string; layout: string }

/** 只扫描指定文件夹的直接图片文件，不混入其他栏目、子文件夹或非图片文件。 */
export function scanStandPools(publicDirectory: string) {
  return Object.fromEntries(
    Object.entries(standDirectories).map(([section, directory]) => {
      const folder = join(publicDirectory, directory)
      // 只读直属文件并稳定排序，再对文件名编码形成可用于浏览器的 URL。
      const images = existsSync(folder)
        ? readdirSync(folder, { withFileTypes: true })
            .filter(
              (entry) => entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase()),
            )
            .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }))
            .map((entry) => ({
              id: `${section}-${entry.name}`,
              image: `/${directory}/${encodeURIComponent(entry.name)}`,
              layout: 'default',
            }))
        : []
      return [section, images]
    }),
  ) as Record<keyof typeof standDirectories, StandAsset[]>
}

/** 注册素材虚拟模块：构建时生成清单，开发时监听文件变化并刷新页面。 */
export function standAssetsPlugin(): Plugin {
  let publicDirectory = ''
  return {
    name: 'island-stand-pools',
    // 使用 Vite 最终解析的 publicDir，避免把工作目录误当素材根目录。
    configResolved(config) {
      publicDirectory = config.publicDir
    },
    // 只接管自己的模块名，其他 import 交给 Vite 默认处理。
    resolveId(id) {
      return id === virtualId ? resolvedId : undefined
    },
    // 每次加载重新扫描，因此新增或删除图片不需要手写列表。
    load(id) {
      if (id !== resolvedId) return undefined
      return `export default ${JSON.stringify(scanStandPools(publicDirectory))}`
    },
    // 开发服务器监听各栏目的目录；服务关闭时解除本插件的回调。
    configureServer(server) {
      server.watcher.add(
        Object.values(standDirectories).map((directory) => join(publicDirectory, directory)),
      )
      // 仅响应直属图片的新增、删除和修改，再使虚拟模块缓存失效。
      const onAssetChange = (event: string, file: string) => {
        if (!['add', 'unlink', 'change'].includes(event)) return
        const local = relative(publicDirectory, file).replaceAll('\\', '/')
        const directory = local.slice(0, local.lastIndexOf('/'))
        if (!Object.values(standDirectories).some((folder) => folder === directory)) return
        if (!imageExtensions.has(extname(local).toLowerCase())) return
        const module = server.moduleGraph.getModuleById(resolvedId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('all', onAssetChange)
      server.httpServer?.once('close', () => server.watcher.off('all', onAssetChange))
    },
  }
}
