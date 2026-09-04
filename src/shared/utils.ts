import type { CSSProperties } from 'react'
import { resolveColor, type IslandColor } from './config'

/** 把 YYYY-MM-DD 拆为中文年月日；不完整的值按原文显示。 */
export function formatChineseDate(date?: string) {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${year}年${Number(month)}月${Number(day)}日`
}

/** 组合开始与结束日期；只有一个日期或两者相同则避免重复显示。 */
export function formatDateRange(startDate?: string, finalDate?: string) {
  if (!startDate) return finalDate ?? ''
  if (!finalDate || finalDate === startDate) return startDate
  return `${startDate} - ${finalDate}`
}

/** 把日期拆成年份与月日两部分，方便工作台左右台历分别排版。 */
export function splitDisplayDate(date?: string) {
  if (!date) return undefined
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return { year: date, monthDay: '' }
  return { year, monthDay: `${Number(month)}月${Number(day)}日` }
}

/** 构建时收集所有栏目的正文和封面图片；新增栏目无需再维护逐栏目路径清单。 */
const attachmentFiles = import.meta.glob(
  '../content/**/*.{png,jpg,jpeg,webp,gif,svg,avif,PNG,JPG,JPEG,WEBP,GIF,SVG,AVIF}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>

/** 图片 URL 查找表：同时存储标准化路径和可解码路径，以兼容中文及空格文件名。 */
const normalizedAssets = new Map<string, string>()
/** 逐项建立图片路径索引；解码失败仍保留原始文件名，不中断构建。 */
for (const [path, url] of Object.entries(attachmentFiles)) {
  const normalized = path.replaceAll('\\', '/')
  normalizedAssets.set(normalized, url)
  try {
    normalizedAssets.set(decodeURI(normalized), url)
  } catch {
    // Keep the original key when a filename contains a literal percent sign.
  }
}

/** 把 Markdown 相对图片地址转换为构建 URL，同时兼容 public、旧 src/collections 和外部地址。 */
export function resolveMarkdownImage(src: string, sourceDir?: string) {
  if (/^public\//i.test(src)) return `/${src.replace(/^public\//i, '')}`
  if (sourceDir && /^\/src\//i.test(src)) {
    const relativePath = src
      .replace(/^\/src\/(?:content\/)?/i, '')
      .replace(/^collections\//, 'museum/')
    const direct = normalizedAssets.get(`../content/${relativePath}`)
    if (direct) return direct
  }
  if (!sourceDir || /^(?:[a-z]+:|\/|#)/i.test(src)) return src
  let relativePath = src.replaceAll('\\', '/').replace(/^\.\//, '')
  try {
    relativePath = decodeURI(relativePath)
  } catch {
    // React Markdown may already provide a decoded path.
  }
  const direct = normalizedAssets.get(`../content/${sourceDir}/${relativePath}`)
  if (direct) return direct
  return (
    normalizedAssets.get(`../content/${sourceDir}/image/${relativePath}`) ??
    normalizedAssets.get(`../content/${sourceDir}/images/${relativePath}`) ??
    src
  )
}

/** 支持 tags: [木工, 手作]、tags: 木工, 手作 和 YAML 多行列表。 */
export function parseMarkdownTags(frontmatter: string): string[] {
  const values: string[] = []
  let inTags = false
  for (const line of frontmatter.split(/\r?\n/)) {
    const inline = line.match(/^tags:\s*(.*)$/)
    if (inline) {
      inTags = !inline[1].trim()
      values.push(...inline[1].replace(/^\[|\]$/g, '').split(','))
    } else if (inTags) {
      const item = line.match(/^\s*-\s*(.+)$/)
      if (item) values.push(item[1])
      else if (line.trim()) inTags = false
    }
  }
  return [
    ...new Set(values.map((value) => value.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)),
  ]
}

/** SVG 仅作为界面图标使用，不计入文章或藏品的有效预览图片。 */
export function isDisplayImage(src?: string): src is string {
  return Boolean(src && !/\.svg(?:$|\?)/i.test(src))
}

/** 把不适合预览的地址转为 undefined，让页面进入自己的缺图分支。 */
export function displayImageOrUndefined(src?: string) {
  return isDisplayImage(src) ? src : undefined
}

/** 普通内容的主题色字段，与公共色板使用相同类型。 */
export type PostColor = IslandColor

/** 普通文章、手工、菜谱、旅行和种植共用的数据模型；字段来自 Markdown 头部及正文。 */
export type Post = {
  slug: string
  date: string
  publishedAt: string
  startDate?: string
  finalDate?: string
  readingTime: number
  tag: string
  tags: string[]
  title: string
  excerpt: string
  color: PostColor
  icon: string
  customIcon?: string
  previewImage?: string
  detailImage?: string
  content: string
  sourceDir: string
}

/** 解析普通内容：跳过模板、校验日期与摘要、解析标签和图片，并生成阅读时间等衍生字段。 */
export function parseMarkdown(path: string, source: string, defaultTag = '岛民文章'): Post | null {
  /** 以文件名生成 slug，下划线开头视为模板；随后分离头部元信息和正文。 */
  const filename = path.split('/').pop() ?? ''
  if (filename.startsWith('_')) return null
  const slug = filename.replace(/\.md$/, '')
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`文章 ${filename} 缺少 Markdown 头部信息`)
  /** 解析头部键值字段；正文不参与元数据解析，标签列表由专门函数处理。 */
  const metadata: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const key = line.slice(0, separator).trim()
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    metadata[key] = value
  }
  /** 合并 tags 列表与兼容的单个 tag 字段，并去掉重复标签。 */
  const tags = [
    ...new Set([...parseMarkdownTags(match[1]), ...(metadata.tag ? [metadata.tag] : [])]),
  ]
  const content = match[2].trim()
  /** 从内容路径提取所属栏目，用它解析该 Markdown 的相对图片地址。 */
  const sourceDir = path.match(/content\/([^/]+)\//)?.[1] ?? 'posts'
  const startDate = metadata.date || undefined
  const finalDate = metadata.finaldate || undefined
  /** 优先使用开始日期作为显示及排序日期；手工额外要求必须填写开工 date。 */
  const publishedAt = startDate || finalDate
  if (!publishedAt || !metadata.excerpt)
    throw new Error(`文章 ${filename} 必须填写 date 或 finaldate，并填写 excerpt`)
  if (sourceDir === 'crafts' && !startDate)
    throw new Error(`手工 ${filename} 必须填写开工时间 date`)
  const title = metadata.title || slug
  const color = resolveColor(metadata.color) as PostColor
  const wordCount = content.replace(/\s+/g, '').length
  return {
    slug,
    date: publishedAt.slice(5).replace('-', ' / '),
    publishedAt,
    startDate,
    finalDate,
    readingTime: Number(metadata.readingTime) || Math.max(1, Math.ceil(wordCount / 400)),
    tag: tags[0] || defaultTag,
    tags: tags.length ? tags : [defaultTag],
    title,
    excerpt: metadata.excerpt,
    color,
    icon: metadata.icon || '🌊',
    customIcon: metadata.icon || undefined,
    previewImage: metadata.previewImage
      ? resolveMarkdownImage(metadata.previewImage, sourceDir)
      : undefined,
    detailImage: metadata.detailImage
      ? resolveMarkdownImage(metadata.detailImage, sourceDir)
      : undefined,
    content,
    sourceDir,
  }
}

/** 列表封面优先 previewImage，未设置则使用详情图。 */
export function getPostPreviewImage(post: Post) {
  return post.previewImage || post.detailImage
}

/** 列表封面增加 SVG 过滤，缺少有效照片时由栏目显示占位。 */
export function getPostDisplayImage(post: Post) {
  return displayImageOrUndefined(getPostPreviewImage(post))
}

/** 详情页优先 detailImage，未设置则使用封面。 */
export function getPostDetailImage(post: Post) {
  return post.detailImage || post.previewImage
}

/** 一张底图的标识、图片地址和布局名；布局名与 CSS data-stand-layout 联动。 */
export type Stand = {
  id: string
  /** 不填写图片时继续使用页面原本的 CSS 外观（如明信片）。 */
  image?: string
  /** 对应本页 styles.css 中的 data-stand-layout 选择器。 */
  layout?: string
}

/** 一组标签到图片池的映射；默认 any，all 要求该组每个标签同时存在。 */
export type StandRule = {
  tags: readonly string[]
  match?: 'any' | 'all'
  pool: readonly Stand[]
}

/** 各栏目展示配置契约：文案、替换词、默认池、标签规则和可选空位池。 */
export type PresentationConfig = {
  messages: {
    missing: readonly string[]
    empty: readonly string[]
    tokens?: Readonly<Record<string, readonly string[]>>
  }
  stands: {
    default: readonly Stand[]
    /** 从上到下匹配，第一个命中且非空的图片集优先。 */
    byTags: readonly StandRule[]
    /** 不填写或为空时，空位使用 default 图片集。 */
    empty?: readonly Stand[]
  }
}

/** 从本栏目的自动图片池按文件名取子集；中文、空格文件名先编码再匹配。
 * 不存在的文件会被忽略，返回空集时 selectStand 继续匹配下一条有效规则。
 * 示例：standPoolByFiles(workbenches, ['base.png', 'dark.png'])。
 */
export function standPoolByFiles<T extends Stand>(
  pool: readonly T[],
  filenames: readonly string[],
): T[] {
  const names = new Set(filenames.map((filename) => encodeURIComponent(filename)))
  return pool.filter((stand) => names.has(stand.image?.split('/').pop() ?? ''))
}

/** 纯选择函数，random 可注入，便于验证标签优先级和随机边界。 */
export function selectStand(
  config: PresentationConfig,
  tags: readonly string[] = [],
  random: () => number = Math.random,
  empty = false,
): Stand {
  /** 统一去掉标签首尾空格；接着按配置顺序寻找第一条非空且命中的规则。 */
  const normalized = new Set(tags.map((tag) => tag.trim()))
  const rule = empty
    ? undefined
    : config.stands.byTags.find((candidate) => {
        if (!candidate.tags.length || !candidate.pool.length) return false
        return candidate.match === 'all'
          ? candidate.tags.every((tag) => normalized.has(tag.trim()))
          : candidate.tags.some((tag) => normalized.has(tag.trim()))
      })
  /** 空位优先独立池，普通卡片优先标签池，最后回退默认池；无图时使用 CSS 外观。 */
  const pool =
    empty && config.stands.empty?.length
      ? config.stands.empty
      : (rule?.pool ?? config.stands.default)
  if (!pool.length) return { id: 'css-default', layout: 'default' }
  /** 把随机数映射为图片池下标，并限制范围以处理随机边界。 */
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  return pool[index]
}

/** 把选中的底图写成卡片 data 属性和 --stand-image CSS 变量，连接选图逻辑与外观。 */
export function standAttributes(stand: Stand) {
  return {
    'data-stand': stand.id,
    'data-stand-layout': stand.layout ?? 'default',
    'data-stand-image': Boolean(stand.image) || undefined,
    style: stand.image
      ? ({ '--stand-image': `url(${JSON.stringify(stand.image)})` } as CSSProperties)
      : undefined,
  }
}

/** 同一个文案列表抽完一轮再洗牌，避免长期固定使用首条文案。 */
const messageBags = new WeakMap<readonly string[], string[]>()
/** 复用文案抽签袋；抽完后重新洗牌，保证每轮覆盖全部文案。 */
function drawMessage(items: readonly string[]) {
  /** 从上次尚未抽完的文案袋继续抽取，空袋再复制并洗牌。 */
  let bag = messageBags.get(items)
  if (!bag?.length) {
    bag = [...items]
    for (let index = bag.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[bag[index], bag[other]] = [bag[other], bag[index]]
    }
    messageBags.set(items, bag)
  }
  return bag.pop() ?? ''
}

/** 抽取缺图或空位文案，并把 {占位词} 替换成配置中的随机词语。 */
export function drawContentMessage(config: PresentationConfig, kind: 'missing' | 'empty') {
  return drawMessage(config.messages[kind]).replace(/\{([^}]+)\}/g, (token, key: string) => {
    const values = config.messages.tokens?.[key]
    return values?.length ? drawMessage(values) : token
  })
}
