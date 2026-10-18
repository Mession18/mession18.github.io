import { mkdir, readdir, readFile, copyFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const output = join(root, 'artifacts')
await mkdir(output, { recursive: true })
const candidates = []
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) await walk(file)
    else if (entry.isFile() && /\.(jpg|png|zip|md)$/.test(entry.name)) {
      candidates.push({ file, size: (await stat(file)).size })
    }
  }
}
await walk(join(root, 'test-results'))
const summary = {
  commit: process.env.GITHUB_SHA ?? null,
  branch: process.env.GITHUB_REF_NAME ?? null,
  node: process.version,
  sandboxRequired: true,
  byteLimit: 20 * 1024 * 1024,
  copied: [],
  omitted: [],
}
const report = join(root, 'results', 'results.json')
try {
  const data = await readFile(report)
  const parsed = JSON.parse(data)
  summary.stats = parsed.stats
  if (data.length <= 2 * 1024 * 1024) {
    await writeFile(join(output, 'results.json'), data)
    summary.copied.push({ path: 'results.json', bytes: data.length })
  } else summary.omitted.push({ path: 'results.json', bytes: data.length, reason: 'over 2 MiB' })
} catch (error) {
  summary.reportUnavailable = String(error)
}
let used = summary.copied.reduce((total, file) => total + file.bytes, 0)
// Prefer screenshot evidence; large traces must not silently consume the storage budget.
candidates.sort((a, b) => Number(a.file.endsWith('.zip')) - Number(b.file.endsWith('.zip')) || a.size - b.size)
for (const candidate of candidates) {
  const path = relative(root, candidate.file).replaceAll('\\', '/')
  const limit = candidate.file.endsWith('.zip') ? 6 * 1024 * 1024 : 3 * 1024 * 1024
  if (candidate.size > limit || used + candidate.size > summary.byteLimit - 128 * 1024) {
    summary.omitted.push({ path, bytes: candidate.size, reason: 'bounded artifact budget' })
    continue
  }
  const destination = join(output, path)
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(candidate.file, destination)
  used += candidate.size
  summary.copied.push({ path, bytes: candidate.size })
}
summary.evidenceBytes = used
await writeFile(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
