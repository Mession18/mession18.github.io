import { chromium } from '@playwright/test'
import { readFile, writeFile, mkdir, unlink, stat, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { cpus } from 'node:os'
import { gzipSync } from 'node:zlib'
import { fixedTime, geo, weather } from './fixtures.mjs'

const config = JSON.parse(process.argv[2])
const output = join(config.output, `${config.name}.json`)
const report = { ...config, status: 'starting', phases: {}, limitations: [] }
delete report.fixtureDirectory
const began = performance.now()
const nodeCPU = process.cpuUsage()
const cpuStart = cpus().map(c => c.times)
let browser, context, session, browserSession
let stopPerformanceTrace = async () => {}
let checkpointQueue = Promise.resolve()
async function checkpoint(stage) {
  report.stage = stage
  report.elapsedMs = performance.now() - began
  const payload = JSON.stringify(report, null, 2)
  checkpointQueue = checkpointQueue.then(async () => {
    await writeFile(output + '.tmp', payload)
    await rename(output + '.tmp', output)
  })
  await checkpointQueue
}
async function timed(name, operation) {
  await checkpoint(name)
  const start = performance.now()
  try { return await operation() } finally { report.phases[name] = performance.now() - start; await checkpoint(name) }
}
async function optional(protocol, method, params) {
  try { return await protocol.send(method, params) }
  catch (error) { report.limitations.push(`${method}: ${error.message}`); return null }
}
function stats(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return { count: sorted.length, mean: values.reduce((a, b) => a + b, 0) / (values.length || 1), p50: sorted[Math.floor(sorted.length * .5)] ?? null, p95: sorted[Math.floor(sorted.length * .95)] ?? null, max: sorted.at(-1) ?? null }
}

try {
  await mkdir(config.output, { recursive: true })
  browser = await timed('browserLaunch', () => chromium.launch({ headless: true, chromiumSandbox: true }))
  report.browser = browser.version()
  browserSession = await browser.newBrowserCDPSession()
  const gpu = await optional(browserSession, 'SystemInfo.getInfo')
  report.gpu = gpu?.gpu ?? null
  context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: config.motion })
  const fonts = JSON.parse(await readFile(join(config.fixtureDirectory, 'manifest.json'), 'utf8'))
  await context.route('https://get.geojs.io/**', route => route.fulfill({ json: geo }))
  await context.route('https://api.open-meteo.com/**', route => route.fulfill({ json: weather }))
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, async route => {
    const fixture = fonts[route.request().url()]
    if (!fixture) { report.limitations.push('Unprepared font URL'); return route.abort() }
    await route.fulfill({ status: 200, contentType: fixture.contentType, body: await readFile(join(config.fixtureDirectory, fixture.file)) })
  })
  await context.addInitScript(() => {
    performance.setResourceTimingBufferSize(500)
    const data = window.__qaPerf = { frames: [], longTasks: [], longTaskSupported: false, errors: [], began: performance.now(), stage: 'startup' }
    let previous = performance.now()
    function sample(now) {
      if (data.frames.length < 4000) data.frames.push({ at: now, delta: now - previous, stage: data.stage })
      previous = now
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (data.longTasks.length < 500) data.longTasks.push({ start: entry.startTime, duration: entry.duration, name: entry.name })
      }).observe({ type: 'longtask', buffered: true })
      data.longTaskSupported = true
    } catch {}
    addEventListener('error', event => data.errors.push(event.message))
  })
  if (config.playwrightTrace) await context.tracing.start({ screenshots: true, snapshots: true, sources: false })
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  await page.clock.setFixedTime(new Date(fixedTime))
  session = await context.newCDPSession(page)
  await optional(session, 'Network.enable')
  await optional(session, 'Network.clearBrowserCache')
  await optional(session, 'Network.setCacheDisabled', { cacheDisabled: true })
  await optional(session, 'Performance.enable')
  report.processesBefore = await optional(browserSession, 'SystemInfo.getProcessInfo')
  report.cdpBefore = await optional(session, 'Performance.getMetrics')
  if (config.performanceTrace) {
    let resolveComplete
    const complete = new Promise(resolve => { resolveComplete = resolve })
    browserSession.once('Tracing.tracingComplete', resolveComplete)
    try {
      await browserSession.send('Tracing.start', { categories: 'devtools.timeline,v8,blink.user_timing,gpu', transferMode: 'ReturnAsStream' })
      let completion
      stopPerformanceTrace = () => completion ??= (async () => {
        await browserSession.send('Tracing.end')
        const { stream } = await complete
        const chunks = []
        let bytes = 0, oversized = false
        for (;;) {
          const chunk = await browserSession.send('IO.read', { handle: stream, size: 64 * 1024 })
          const buffer = Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8')
          bytes += buffer.length
          if (bytes <= 24 * 1024 * 1024) chunks.push(buffer)
          else oversized = true
          if (chunk.eof) break
        }
        await browserSession.send('IO.close', { handle: stream })
        if (oversized) return report.limitations.push('Performance trace exceeded 24 MiB raw cap; omitted')
        const compressed = gzipSync(Buffer.concat(chunks))
        if (compressed.length > 3 * 1024 * 1024) return report.limitations.push('Performance trace exceeded 3 MiB gzip cap; omitted')
        await writeFile(join(config.output, `${config.name}.performance.json.gz`), compressed)
        report.performanceTrace = { rawBytes: bytes, gzipBytes: compressed.length, requestedWindowMs: 12_000 }
        await checkpoint('performanceTraceCaptured')
      })()
      setTimeout(() => { void stopPerformanceTrace().catch(error => report.limitations.push(`Tracing: ${error.message}`)) }, 12_000).unref()
    } catch (error) { report.limitations.push(`Tracing.start: ${error.message}`) }
  }

  const navigationBegan = performance.now()
  await timed('domContentLoaded', () => page.goto(config.url + '/#/', { waitUntil: 'domcontentloaded', timeout: 30_000 }))
  await timed('canvasAndFontsReady', async () => {
    await page.locator('.island-scene-3d canvas[data-engine]').waitFor({ state: 'visible', timeout: 30_000 })
    await page.waitForFunction(() => {
      const hero = document.querySelector('.hero')
      return hero && !hero.classList.contains('weather-pending') && document.querySelector('.weather')?.textContent.includes('Controlled QA')
    }, undefined, { timeout: 15_000 })
    await page.evaluate(async () => {
      await document.fonts.ready
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
  })
  report.readyMs = performance.now() - navigationBegan
  async function snapshot(stage) {
    return page.evaluate(stage => {
      const scene = document.querySelector('.island-scene-3d')
      const canvas = scene?.querySelector('canvas')
      const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl')
      const debug = gl?.getExtension('WEBGL_debug_renderer_info')
      window.__qaPerf.stage = stage
      const rect = canvas?.getBoundingClientRect()
      return {
        stage, at: performance.now(), now: new Date().toISOString(), compatMode: document.compatMode, devicePixelRatio,
        weatherText: document.querySelector('.weather')?.textContent,
        motion: scene?.getAttribute('data-motion'), smoke: scene?.getAttribute('data-smoke'), lamps: scene?.getAttribute('data-lamps'),
        canvas: canvas ? { width: canvas.width, height: canvas.height, top: rect.top, bottom: rect.bottom, cssWidth: rect.width, cssHeight: rect.height } : null,
        renderer: gl ? { vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR), renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER), version: gl.getParameter(gl.VERSION), lost: gl.isContextLost() } : null,
        font: getComputedStyle(document.body).fontFamily, fontsStatus: document.fonts.status,
      }
    }, stage)
  }
  report.home = await timed('homeSnapshot', () => snapshot('home'))
  await new Promise(resolve => setTimeout(resolve, 2000))
  await timed('scrollToJournal', async () => {
    await page.evaluate(() => window.scrollTo({ top: document.getElementById('journal').getBoundingClientRect().top + scrollY - 94, behavior: 'instant' }))
    await page.waitForFunction(() => Math.abs(document.getElementById('journal').getBoundingClientRect().top - 94) < 8, undefined, { timeout: 15_000 })
  })
  report.journal = await timed('journalSnapshot', () => snapshot('journal'))
  await new Promise(resolve => setTimeout(resolve, 2000))
  await timed('screenshot', () => page.screenshot({ path: join(config.output, `${config.name}.jpg`), type: 'jpeg', quality: 60, fullPage: false, timeout: 15_000 }))
  const metrics = await timed('collectMetrics', () => page.evaluate(() => ({
    ...window.__qaPerf,
    resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, start: r.startTime, duration: r.duration, transferSize: r.transferSize, type: r.initiatorType })),
    domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd,
  })))
  report.metrics = metrics
  report.frameSummary = {}
  for (const stage of ['startup', 'home', 'journal']) report.frameSummary[stage] = stats(metrics.frames.filter(f => f.stage === stage).map(f => f.delta))
  report.longTaskSummary = { count: metrics.longTasks.length, durationMs: metrics.longTasks.reduce((n, t) => n + t.duration, 0), maxMs: Math.max(0, ...metrics.longTasks.map(t => t.duration)) }
  report.cdpAfter = await optional(session, 'Performance.getMetrics')
  report.processesAfter = await optional(browserSession, 'SystemInfo.getProcessInfo')
  report.status = 'complete'
} catch (error) {
  report.status = 'error'
  report.error = { message: error.message, stack: error.stack }
} finally {
  const endCPU = cpus().map(c => c.times)
  let total = 0, idle = 0
  endCPU.forEach((t, i) => { for (const k of Object.keys(t)) total += t[k] - cpuStart[i][k]; idle += t.idle - cpuStart[i].idle })
  report.hostCPU = { logicalCores: endCPU.length, utilization: total ? 1 - idle / total : null }
  report.nodeCPU = process.cpuUsage(nodeCPU)
  await checkpoint('finishing')
  try { await stopPerformanceTrace() } catch (error) { report.limitations.push(`Trace cleanup: ${error.message}`) }
  if (context && config.playwrightTrace) {
    try {
      const path = join(config.output, `${config.name}.playwright.zip`)
      await context.tracing.stop({ path })
      const size = (await stat(path)).size
      if (size > 4 * 1024 * 1024) { await unlink(path); report.limitations.push('Playwright trace exceeded 4 MiB file cap; omitted') }
    } catch (error) { report.limitations.push(`Playwright trace: ${error.message}`) }
  }
  try { await browser?.close() } catch (error) { report.limitations.push(`Browser close: ${error.message}`) }
  await checkpoint('finished')
}
