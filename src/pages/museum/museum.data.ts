import { resolveColor, type IslandColor } from '../../shared/config'
import {
  resolveMarkdownImage,
  parseMarkdownDocument,
  displayImageOrUndefined,
} from '../../shared/markdown'
/** 藏品的统一数据结构；与普通文章相比多了分类、评分和年份等字段。 */
export type CollectionItem = {
  id: string
  slug: string
  tags: string[]
  title: string
  subtitle: string
  year: string
  date?: string
  rating: number
  icon: string
  previewImage?: string
  detailImage?: string
  color: IslandColor
  excerpt: string
  content: string
  sourceDir: string
}

/** 构建时读取本栏目 Markdown 原文，后续统一解析为页面使用的数据。 */
const markdownFiles = import.meta.glob('../../content/museum/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** 解析藏品头部和正文，校验必填字段，生成卡片、详情和搜索所需字段。 */
function parseCollection(path: string, source: string): CollectionItem | null {
  const document = parseMarkdownDocument(path, source, '藏品')
  if (!document) return null
  const { filename, slug, metadata, tags, content } = document
  if (!metadata.id || !tags.length || !metadata.excerpt)
    throw new Error(`藏品 ${filename} 必须填写 id、tags 和 excerpt`)
  return {
    id: metadata.id,
    tags,
    slug,
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
    color: resolveColor(metadata.color),
    excerpt: metadata.excerpt,
    content,
    sourceDir: 'museum',
  }
}

/** 加载全部有效藏品；数组顺序沿用文件导入顺序。 */
export const collections = Object.entries(markdownFiles)
  .map(([path, source]) => parseCollection(path, source))
  .filter((item): item is CollectionItem => item !== null)

/** 从所有藏品标签自动生成筛选按钮；多标签藏品会出现在每个对应筛选中。 */
export const collectionTags = [...new Set(collections.flatMap((item) => item.tags))]
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
