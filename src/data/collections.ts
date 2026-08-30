export type CollectionCategory = 'photos' | 'games' | 'books' | 'music'
export type CollectionColor = 'mint' | 'sun' | 'sky' | 'rose' | 'lavender'
export type CollectionItem = {
  id: string
  slug: string
  category: CollectionCategory
  title: string
  subtitle: string
  year: string
  rating: number
  icon: string
  previewImage?: string
  detailImage?: string
  color: CollectionColor
  excerpt: string
  content: string
}

export const categoryLabels: Record<CollectionCategory, string> = {
  photos: '照片',
  games: '游戏',
  books: '书籍',
  music: '音乐',
}
const markdownFiles = import.meta.glob('../collections/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseCollection(path: string, source: string): CollectionItem | null {
  const filename = path.split('/').pop() ?? ''
  if (filename.startsWith('_')) return null
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`藏品 ${filename} 缺少 Markdown 头部信息`)
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
  if (!metadata.id || !metadata.title || !metadata.category || !metadata.excerpt)
    throw new Error(`藏品 ${filename} 必须填写 id、title、category 和 excerpt`)
  if (!(metadata.category in categoryLabels)) throw new Error(`藏品 ${filename} 的 category 无效`)
  const color = (
    ['mint', 'sun', 'sky', 'rose', 'lavender'].includes(metadata.color) ? metadata.color : 'mint'
  ) as CollectionColor
  return {
    id: metadata.id,
    slug: filename.replace(/\.md$/, ''),
    category: metadata.category as CollectionCategory,
    title: metadata.title,
    subtitle: metadata.subtitle || '',
    year: metadata.year || '',
    rating: Number(metadata.rating) || 0,
    icon: metadata.icon || '🏝️',
    previewImage: metadata.previewImage || undefined,
    detailImage: metadata.detailImage || undefined,
    color,
    excerpt: metadata.excerpt,
    content: match[2].trim(),
  }
}

export const collections = Object.entries(markdownFiles)
  .map(([path, source]) => parseCollection(path, source))
  .filter((item): item is CollectionItem => item !== null)
export function getCollectionPreviewImage(item: CollectionItem) {
  return item.previewImage || item.detailImage
}
export function getCollectionDetailImage(item: CollectionItem) {
  return item.detailImage || item.previewImage
}
