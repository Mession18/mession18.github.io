import { resolveColor, type IslandColor } from '../../shared/config'
import {
  resolveMarkdownImage,
  parseMarkdownTags,
  displayImageOrUndefined,
} from '../../shared/utils'

/** 藏品分类键，允许使用内置英文分类或新增自定义分类。 */
export type CollectionCategory = string
/** 藏品主题色，与共享色板解析规则一致。 */
export type CollectionColor = IslandColor
/** 藏品的统一数据结构；与普通文章相比多了分类、评分和年份等字段。 */
export type CollectionItem = {
  id: string
  slug: string
  tags: string[]
  category: CollectionCategory
  title: string
  subtitle: string
  year: string
  date?: string
  rating: number
  icon: string
  previewImage?: string
  detailImage?: string
  color: CollectionColor
  excerpt: string
  content: string
  sourceDir: string
}

/** 内置分类的中文显示名；未列出的自定义分类直接显示其原始值。 */
const builtInCategoryLabels: Record<string, string> = {
  photos: '照片',
  games: '游戏',
  books: '书籍',
  music: '音乐',
}
/** 构建时读取本栏目 Markdown 原文，后续统一解析为页面使用的数据。 */
const markdownFiles = import.meta.glob('../../content/museum/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** 解析藏品头部和正文，校验必填字段，生成卡片、详情和搜索所需字段。 */
function parseCollection(path: string, source: string): CollectionItem | null {
  /** 以文件名生成 slug，下划线开头视为模板；随后分离头部元信息和正文。 */
  const filename = path.split('/').pop() ?? ''
  if (filename.startsWith('_')) return null
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`藏品 ${filename} 缺少 Markdown 头部信息`)
  /** 解析头部键值字段；正文不参与元数据解析，标签列表由专门函数处理。 */
  const metadata = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':')
        return [
          line.slice(0, separator).trim(),
          line
            .slice(separator + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ''),
        ]
      }),
  )
  if (!metadata.id || !metadata.category || !metadata.excerpt)
    throw new Error(`藏品 ${filename} 必须填写 id、category 和 excerpt`)
  const slug = filename.replace(/\.md$/, '')
  const color = resolveColor(metadata.color) as CollectionColor
  return {
    id: metadata.id,
    tags: parseMarkdownTags(match[1]),
    slug,
    category: metadata.category as CollectionCategory,
    title: metadata.title || slug,
    subtitle: metadata.subtitle || '',
    year: metadata.year || '',
    date: metadata.date || metadata.year || undefined,
    rating: Number(metadata.rating) || 0,
    icon: metadata.icon || '🏝️',
    previewImage: metadata.previewImage
      ? resolveMarkdownImage(metadata.previewImage, 'museum')
      : undefined,
    detailImage: metadata.detailImage
      ? resolveMarkdownImage(metadata.detailImage, 'museum')
      : undefined,
    color,
    excerpt: metadata.excerpt,
    content: match[2].trim(),
    sourceDir: 'museum',
  }
}

/** 加载全部有效藏品；数组顺序沿用文件导入顺序。 */
export const collections = Object.entries(markdownFiles)
  .map(([path, source]) => parseCollection(path, source))
  .filter((item): item is CollectionItem => item !== null)

/** 从藏品 category 自动去重生成分类按钮，新增分类无需手写按钮。 */
export const collectionCategories = [...new Set(collections.map((item) => item.category))]

/** 合并内置分类翻译与自定义分类名称，供列表筛选和详情展示。 */
export const categoryLabels: Record<string, string> = Object.fromEntries(
  collectionCategories.map((category) => [category, builtInCategoryLabels[category] ?? category]),
)
/** 藏品封面优先使用 previewImage，未填写则借用 detailImage。 */
export function getCollectionPreviewImage(item: CollectionItem) {
  return item.previewImage || item.detailImage
}
/** 筛除仅用作图标的 SVG，返回适合藏品照片区域的地址。 */
export function getCollectionDisplayImage(item: CollectionItem) {
  return displayImageOrUndefined(getCollectionPreviewImage(item))
}
/** 藏品详情大图优先使用 detailImage，未填写则借用封面。 */
export function getCollectionDetailImage(item: CollectionItem) {
  return item.detailImage || item.previewImage
}
