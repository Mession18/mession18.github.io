import assert from 'node:assert/strict'
import { loadUtils } from './load-utils.mjs'
const {
  selectStand,
  standAttributes,
  drawContentMessage,
  parseMarkdownTags,
  standPoolByFiles,
  resolveMarkdownImage,
  parseMarkdown,
  shuffled,
} = await loadUtils()

// 文件名筛选使用实际图片池，支持中文和空格；拼错或缺失文件不会制造无效图片地址。
const filePool = [
  { id: 'base', image: '/images/crafts/workbenches/base.png' },
  { id: 'cn', image: '/images/crafts/workbenches/%E6%B7%B1%E8%89%B2%20%E5%8F%B0.png' },
]
assert.deepEqual(standPoolByFiles(filePool, ['深色 台.png']), [filePool[1]])
assert.deepEqual(standPoolByFiles(filePool, ['missing.png']), [])

// 共享文件合并后仍须找到 src/content 图片，避免相对路径少一级导致封面悄悄失效。
assert.notEqual(
  resolveMarkdownImage('preview/波罗蜜-封面.png', 'planting'),
  'preview/波罗蜜-封面.png',
)
assert.equal(parseMarkdown('src/content/crafts/_模板.md', ''), null)
// 最小图片及文案配置：多标签 all 规则优先，随后是单标签规则和默认池。
const a = { id: 'a', image: '/a.png', layout: 'wood' },
  b = { id: 'b' },
  fallback = { id: 'fallback' },
  empty = { id: 'empty' }
const config = {
  messages: { missing: ['借到{museum}'], empty: ['等待'], tokens: { museum: ['博物馆'] } },
  stands: {
    default: [fallback],
    empty: [empty],
    byTags: [
      { tags: ['木工', '手作'], match: 'all', pool: [a, b] },
      { tags: ['木工'], pool: [b] },
    ],
  },
}
// 注入可预测随机数，覆盖优先级、去空格、默认池、空位池与随机下标边界。
assert.equal(
  selectStand(config, ['木工', '手作'], () => 0),
  a,
)
assert.equal(
  selectStand(config, ['木工', '手作'], () => 0.999),
  b,
)
assert.equal(
  selectStand(config, [' 木工 ', '手作'], () => 0),
  a,
)
assert.equal(
  selectStand(config, ['木工'], () => 0),
  b,
)
assert.equal(
  selectStand(config, ['未知'], () => 0),
  fallback,
)
assert.equal(
  selectStand(config, ['木工'], () => 0, true),
  empty,
)
assert.equal(
  selectStand({ ...config, stands: { ...config.stands, empty: [] } }, [], () => 0, true),
  fallback,
)
assert.equal(
  selectStand(
    { ...config, stands: { default: [fallback], byTags: [{ tags: ['木工'], pool: [] }] } },
    ['木工'],
  ),
  fallback,
)
assert.equal(selectStand({ ...config, stands: { default: [], byTags: [] } }).id, 'css-default')
// 选中底图必须写出正确的布局属性及 CSS 图片变量。
assert.equal(standAttributes(a)['data-stand-layout'], 'wood')
assert.match(standAttributes(a).style['--stand-image'], /a\.png/)
// 验证文案占位词替换，以及行内、多行标签解析的去重与结束边界。
assert.equal(drawContentMessage(config, 'missing'), '借到博物馆')
assert.deepEqual(parseMarkdownTags('tags: ["木工", 手作, 木工]'), ['木工', '手作'])
assert.deepEqual(parseMarkdownTags('tags:\n  - 木工\n  - 手作\ntitle: 标题\n  - 不是标签'), [
  '木工',
  '手作',
])
console.log('通过：标签优先级、any/all、随机边界、默认回退、空位、布局、文案和 Markdown 标签。')

// 同一洗牌函数用于首页和文案：不改原数组、不丢项目，并覆盖空数组和随机边界。
const original = ['a', 'b', 'c']
assert.deepEqual(
  shuffled(original, () => 0),
  ['b', 'c', 'a'],
)
assert.deepEqual(
  shuffled(original, () => 0.999),
  original,
)
assert.deepEqual(original, ['a', 'b', 'c'])
assert.deepEqual(shuffled([]), [])
