import { setRuntimeContent } from './shared/runtime-content'

async function start() {
  if (import.meta.env.VITE_CONTENT_MODE === 'runtime') {
    const response = await fetch('/router-content.json', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (!response.ok) throw new Error('无法读取已部署的路由器内容版本')
    setRuntimeContent(await response.json())
  }
  const { mount } = await import('./mount')
  mount()
}
void start().catch(() => {
  const root = document.getElementById('root')
  if (root) root.textContent = '站点内容暂时无法读取，请稍后刷新。'
})
