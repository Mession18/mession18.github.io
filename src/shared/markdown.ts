import { resolveColor, type IslandColor } from './config'

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
  color: IslandColor
  icon: string
  customIcon?: string
  stampImage?: string
  province?: string
  city?: string
  latitude?: number
  longitude?: number
  stampColor?: 'green' | 'blue' | 'red' | 'violet'
  stampRotation?: number
  stampNote?: string
  previewImage?: string
  detailImage?: string
  content: string
  sourceDir: string
}

/** 普通内容和藏品共用头部语法；保留各模型的必填字段校验。 */
export function parseMarkdownDocument(path: string, source: string, kind = '文章') {
  const filename = path.split('/').pop() ?? ''
  if (isMarkdownTemplate(path)) return null
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`${kind} ${filename} 缺少 Markdown 头部信息`)
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
  return {
    filename,
    slug: filename.replace(/\.md$/, ''),
    metadata,
    tags: parseMarkdownTags(match[1]),
    content: match[2].trim(),
  }
}

/** 跳过模板、校验日期与摘要，并生成阅读时间等衍生字段。 */
export function parseMarkdown(path: string, source: string, defaultTag = '岛民文章'): Post | null {
  const document = parseMarkdownDocument(path, source)
  if (!document) return null
  const { filename, slug, metadata, content } = document
  // 保留普通文章的旧 tag 字段兼容性；藏品仍要求 tags。
  const tags = [...new Set([...document.tags, ...(metadata.tag ? [metadata.tag] : [])])]
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
    color: resolveColor(metadata.color),
    icon: metadata.icon || '🌊',
    customIcon: metadata.icon || undefined,
    stampImage: metadata.stampImage
      ? resolveMarkdownImage(metadata.stampImage, sourceDir)
      : undefined,
    province: metadata.province || undefined,
    city: metadata.city || undefined,
    latitude: metadata.latitude ? Number(metadata.latitude) : undefined,
    longitude: metadata.longitude ? Number(metadata.longitude) : undefined,
    stampColor: ['green', 'blue', 'red', 'violet'].includes(metadata.stampColor)
      ? (metadata.stampColor as Post['stampColor'])
      : undefined,
    stampRotation: metadata.stampRotation ? Number(metadata.stampRotation) || 0 : undefined,
    stampNote: metadata.stampNote || undefined,
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

/** 各栏目保留自己的 glob 范围，共用模板过滤和倒序排列。 */
export function loadPosts(files: Record<string, string>, defaultTag?: string): Post[] {
  return Object.entries(files)
    .map(([path, source]) => parseMarkdown(path, source, defaultTag))
    .filter((post): post is Post => post !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
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

/** 模板 Markdown 只供复制编辑：兼容旧的 `_模板.md` 和新的 `模板.md` 命名。 */
export function isMarkdownTemplate(path: string) {
  const filename = path.split('/').pop() ?? ''
  return filename.startsWith('_') || /模板\.md$/i.test(filename)
}
