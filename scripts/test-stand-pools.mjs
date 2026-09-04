import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import ts from 'typescript'
import { loadUtils } from './load-utils.mjs'

// 用 TypeScript 转译构建侧纯扫描模块，测试不启动完整网站。
async function load(file) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const { scanStandPools } = await load('../build/stand-assets.ts')
const { selectStand } = await loadUtils()
// 测试素材只写入系统临时目录，保存真实路径用于清理前核对。
const root = mkdtempSync(join(tmpdir(), 'island-stand-test-'))
const originalRoot = realpathSync(root)
// 创建一份最小文件夹夹具；只测试扫描规则，不需要真实图片像素。
const put = (file) => {
  const target = join(root, file)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, 'fixture')
}
try {
  // 混合合法图片、非图片与子目录，验证默认池只收本栏目直属图片。
  for (const file of ['base.png', 'dark.png', 'third.PNG', '说明.txt', 'archive/old.png'])
    put(`images/crafts/workbenches/${file}`)
  put('images/museum/pedestals/展台.jpg')
  put('images/recipes/plates/plate.webp')
  put('images/planting/pots/pot.png')
  const pools = scanStandPools(root)
  assert.equal(pools.crafts.length, 3)
  assert.equal(pools.museum.length, 1)
  assert.equal(pools.recipes.length, 1)
  assert.equal(pools.planting.length, 1)
  assert.deepEqual(pools.travel, [])
  assert.deepEqual(pools.posts, [])
  assert(pools.crafts.every((stand) => stand.image.startsWith('/images/crafts/workbenches/')))
  assert.equal(pools.museum[0].image, '/images/museum/pedestals/%E5%B1%95%E5%8F%B0.jpg')
  // 构造房间装饰标签池，固定随机数验证两端边界以及未命中规则的回退。
  const selectedPool = pools.crafts.filter((stand) =>
    ['/base.png', '/dark.png'].some((name) => stand.image.endsWith(name)),
  )
  const config = {
    messages: { missing: [], empty: [] },
    stands: { default: pools.crafts, byTags: [{ tags: ['房间装饰'], pool: selectedPool }] },
  }
  assert(selectStand(config, ['房间装饰'], () => 0).image.endsWith('/base.png'))
  assert(selectStand(config, ['房间装饰'], () => 0.999).image.endsWith('/dark.png'))
  assert(selectStand(config, [], () => 0.999).image.endsWith('/third.PNG'))
  assert(selectStand(config, ['未知标签'], () => 0.999).image.endsWith('/third.PNG'))
  assert(selectStand(config, ['房间装饰'], () => 0.999, true).image.endsWith('/third.PNG'))
  // 新文件再次扫描时应自动发现，不需要修改配置清单。
  put('images/crafts/workbenches/new.png')
  assert.equal(scanStandPools(root).crafts.length, 4)
  console.log('通过：栏目隔离、图片过滤、新素材发现、标签限定图片集、无标签及未知标签回退。')
} finally {
  // 递归清理前确认目标仍是本次创建的临时目录，避免路径变化误删其他文件。
  assert.equal(realpathSync(root), originalRoot)
  assert.equal(dirname(resolve(root)), resolve(tmpdir()))
  assert(root.includes('island-stand-test-'))
  rmSync(root, { recursive: true, force: true })
}
