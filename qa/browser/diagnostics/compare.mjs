import { chromium } from '@playwright/test'
import { spawn, execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareFonts, fixedTime, geo, weather } from './fixtures.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const root = resolve(directory, '../../..')
const output = resolve(directory, '../diagnostic-results')
const baseline = process.env.QA_BASELINE_DIR
const cases = [
  ['baseline', 'no-preference', false], ['current', 'no-preference', false],
  ['current', 'reduce', false], ['baseline', 'reduce', false],
  ['baseline', 'no-preference', true], ['current', 'no-preference', true],
  ['current', 'reduce', true], ['baseline', 'reduce', true],
].map(([version, motion, playwrightTrace], i) => ({ version, motion, playwrightTrace, name: `${i + 1}-${version}-${motion}-${playwrightTrace ? 'trace' : 'plain'}`, performanceTrace: false, budgetMs: 60_000 }))
// The extra profiler is excluded from the tracing-overhead factorial comparison.
cases.push({ version: 'current', motion: 'no-preference', playwrightTrace: false, name: '9-current-short-profile', performanceTrace: true, budgetMs: 40_000 })
if (process.argv.includes('--plan')) { console.log(JSON.stringify({ cases, sandbox: true, globalMs: 570_000, acceptanceUnchanged: true }, null, 2)); process.exit(0) }
if (!baseline) throw new Error('QA_BASELINE_DIR is required')
await mkdir(output, { recursive: true })
const fixtureDirectory = join(process.env.RUNNER_TEMP ?? output, 'blog-controlled-fonts')
const summary = { baselineProduct: 'f6f742c7ffc099bbd76bde62568ac467b18673f8', currentProduct: 'e955fa878a946c8dee446036f3115767b07b0117', diagnosticCommit: process.env.GITHUB_SHA, fixedTime, geo, weather, viewport: { width: 1280, height: 900 }, cache: 'fresh browser per case; HTTP cache disabled; identical intercepted font bytes; OS/driver caches not flushed', sandbox: true, globalMs: 570_000, cases: [], limitations: [] }
const processes = new Set()
async function stop(child) {
  if (!child?.pid || child.exitCode !== null) return
  if (process.platform === 'win32') await new Promise(resolve => spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' }).once('close', resolve))
  else child.kill('SIGTERM')
  processes.delete(child)
}
const began = Date.now()
async function save() { await writeFile(join(output, 'comparison.json'), JSON.stringify(summary, null, 2)) }
const watchdog = setTimeout(async () => {
  summary.error = { message: 'Global 570-second diagnostic budget exceeded' }
  const emergencyExit = setTimeout(() => process.exit(1), 5000)
  for (const child of processes) await stop(child)
  await save()
  clearTimeout(emergencyExit)
  process.exit(1)
}, summary.globalMs).unref()
async function server(site, port) {
  const child = spawn(process.execPath, [join(site, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: site, stdio: 'ignore' })
  processes.add(child)
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1000) })).ok) return child } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`Preview server did not start on ${port}`)
}
try {
  const baselineSHA = execFileSync('git', ['-C', baseline, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (baselineSHA !== summary.baselineProduct) throw new Error('Baseline worktree SHA mismatch')
  execFileSync('git', ['diff', '--exit-code', summary.currentProduct, 'HEAD', '--', 'src', 'public', 'index.html', 'package.json', 'pnpm-lock.yaml', 'build', 'vite.config.ts'], { cwd: root })
  summary.baselineCheckedOut = baselineSHA
  const probe = await chromium.launch({ headless: true, chromiumSandbox: true })
  const protocol = await probe.newBrowserCDPSession()
  const version = await protocol.send('Browser.getVersion')
  summary.browser = version.product
  await probe.close()
  summary.fontFixtures = await prepareFonts(root, fixtureDirectory, version.userAgent)
  await server(baseline, 4175)
  await server(root, 4176)
  for (const entry of cases) {
    if (Date.now() - began > summary.globalMs - entry.budgetMs) { summary.limitations.push('Global diagnostic budget reached; remaining cases not started'); break }
    const config = { ...entry, output, fixtureDirectory, url: `http://127.0.0.1:${entry.version === 'baseline' ? 4175 : 4176}` }
    console.log(`Starting controlled case: ${entry.name}`)
    const child = spawn(process.execPath, [join(directory, 'worker.mjs'), JSON.stringify(config)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    processes.add(child)
    let log = ''
    child.stdout.on('data', d => { if (log.length < 3000) log += d })
    child.stderr.on('data', d => { if (log.length < 3000) log += d })
    let killed = false
    const timeout = setTimeout(() => { killed = true; void stop(child) }, entry.budgetMs)
    const exitCode = await new Promise(resolve => child.once('close', resolve))
    clearTimeout(timeout)
    processes.delete(child)
    let result
    try { result = JSON.parse(await readFile(join(output, `${entry.name}.json`), 'utf8')) }
    catch { result = { ...entry, status: 'no-report' } }
    if (killed) { result.status = 'hard-timeout'; result.limitations ??= []; result.limitations.push(`${entry.budgetMs}-ms case budget exceeded; only checkpointed evidence available`) }
    result.workerExitCode = exitCode
    result.workerLog = log
    await writeFile(join(output, `${entry.name}.json`), JSON.stringify(result, null, 2))
    summary.cases.push({ name: entry.name, version: entry.version, motion: entry.motion, playwrightTrace: entry.playwrightTrace, status: result.status, readyMs: result.readyMs, phases: result.phases, gpu: result.home?.renderer ?? result.gpu?.devices, hostCPU: result.hostCPU, frameSummary: result.frameSummary, longTaskSummary: result.longTaskSummary })
    await save()
    console.log(JSON.stringify(summary.cases.at(-1)))
  }
} catch (error) { summary.error = { message: error.message, stack: error.stack }; process.exitCode = 1 }
finally {
  clearTimeout(watchdog)
  for (const child of processes) await stop(child)
  summary.elapsedMs = Date.now() - began
  await save()
  if (summary.cases.length !== cases.length || summary.cases.some(c => c.status !== 'complete')) process.exitCode = 1
}
