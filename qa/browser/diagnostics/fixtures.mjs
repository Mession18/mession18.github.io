import { request } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const fixedTime = '2026-10-18T22:24:00.000Z'
export const geo = { city: 'Controlled QA', latitude: '36.6694', longitude: '-78.3877', timezone: 'America/New_York' }
export const weather = {
  timezone: geo.timezone,
  current: { temperature_2m: 28, weather_code: 0, wind_speed_10m: 8, wind_gusts_10m: 8, wind_direction_10m: 0, precipitation: 0, snowfall: 0 },
  daily: {
    time: Array.from({ length: 7 }, (_, i) => `2026-10-${18 + i}`),
    weather_code: Array(7).fill(0), temperature_2m_min: Array(7).fill(18),
    temperature_2m_max: Array(7).fill(28), precipitation_probability_max: Array(7).fill(0),
  },
}

// Fetch the site's unchanged font once, before measurement. Every case receives identical bytes.
export async function prepareFonts(siteRoot, directory, userAgent) {
  await mkdir(directory, { recursive: true })
  const source = await readFile(join(siteRoot, 'src/styles/base.css'), 'utf8')
  const urls = [...source.matchAll(/@import\s+url\(['"]?(https:\/\/fonts\.googleapis\.com\/[^'"\)]+)['"]?\)/g)].map(m => m[1])
  if (urls.length !== 1) throw new Error('Expected one unchanged site font import')
  const api = await request.newContext({ userAgent, timeout: 15_000 })
  const manifest = {}
  async function save(url) {
    const response = await api.get(url)
    if (!response.ok()) throw new Error(`Font fixture HTTP ${response.status()}`)
    const body = await response.body()
    const hash = createHash('sha256').update(body).digest('hex')
    await writeFile(join(directory, hash), body)
    manifest[url] = { file: hash, bytes: body.length, contentType: response.headers()['content-type'] ?? 'application/octet-stream' }
    return body.toString('utf8')
  }
  try {
    const css = await save(urls[0])
    const fonts = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^\)]+)\)/g)].map(m => m[1]))]
    if (!fonts.length || fonts.length > 200) throw new Error('Unexpected font fixture list')
    let next = 0
    await Promise.all(Array.from({ length: 5 }, async () => {
      while (next < fonts.length) await save(fonts[next++])
    }))
    await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest))
    return { resources: Object.keys(manifest).length, bytes: Object.values(manifest).reduce((n, f) => n + f.bytes, 0), cssSHA256: manifest[urls[0]].file }
  } finally { await api.dispose() }
}
