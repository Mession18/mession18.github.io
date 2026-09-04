import { createServer } from 'vite'

/** 使用与网站一致的 Vite 转换读取工具模块，支持其中的 import.meta.glob 图片索引。
 * 测试不启动 HTTP 端口；取出模块后立即关闭文件监听，避免脚本运行完后仍占用进程。
 */
export async function loadUtils() {
  const server = await createServer({
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: 'custom',
  })
  try {
    return await server.ssrLoadModule('/src/shared/utils.ts')
  } finally {
    await server.close()
  }
}
