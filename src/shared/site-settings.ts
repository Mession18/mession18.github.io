import defaults from './site-settings.defaults.json'
import type { CSSProperties } from 'react'

export type SiteSettings = {
  schema: number
  text: Record<string, { label: string; value: string; fontSize: number | null }>
  messages: Record<
    string,
    { missing: string[]; empty: string[]; tokens?: Record<string, string[]> }
  >
  passport: { stamps: Record<string, unknown>[]; order: string[] }
}
export const defaultSiteSettings = defaults as SiteSettings
let active = defaultSiteSettings
export const siteSettings = () => active
export function setSiteSettings(value: SiteSettings) {
  if (value?.schema !== 1 || !value.text || !value.messages || !value.passport) return
  active = value
}
export function setting(key: string) {
  return active.text[key]?.value ?? defaultSiteSettings.text[key]?.value ?? ''
}
export function settingStyle(key: string): CSSProperties | undefined {
  const size = active.text[key]?.fontSize
  return typeof size === 'number' && size >= 8 && size <= 96 ? { fontSize: `${size}px` } : undefined
}
export async function loadSiteSettings() {
  const preview = new URLSearchParams(location.search).get('editor-preview') === '1'
  if (preview) {
    const cached = sessionStorage.getItem('page-editor-preview')
    if (cached) {
      try {
        setSiteSettings(JSON.parse(cached))
      } catch {
        sessionStorage.removeItem('page-editor-preview')
      }
    } else {
      const response = await fetch('/api/site-settings', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('请登录编辑室后预览')
      setSiteSettings((await response.json()).value)
    }
    window.addEventListener('message', (event) => {
      if (
        event.origin !== location.origin ||
        event.source !== window.parent ||
        event.data?.type !== 'blog-page-preview'
      )
        return
      const value = event.data.value
      if (value?.schema !== 1) return
      sessionStorage.setItem('page-editor-preview', JSON.stringify(value))
      location.reload()
    })
    return
  }
  const response = await fetch('/site-settings.json', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (response.status === 404) return
  if (!response.ok) throw new Error('无法读取页面内容版本')
  setSiteSettings(await response.json())
}
