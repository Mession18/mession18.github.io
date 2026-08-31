export type PostColor = 'mint' | 'sunshine' | 'sky'

export type Post = {
  slug: string
  date: string
  publishedAt: string
  readingTime: number
  tag: string
  title: string
  excerpt: string
  color: PostColor
  icon: string
  previewImage?: string
  detailImage?: string
  content: string
  sourceDir: string
}

const markdownFiles = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function parseMarkdown(path: string, source: string, defaultTag = '岛民文章'): Post | null {
  const filename = path.split('/').pop() ?? ''
  if (filename.startsWith('_')) return null
  const slug = filename.replace(/\.md$/, '')
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`文章 ${filename} 缺少 Markdown 头部信息`)
  const metadata = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':')
        if (separator < 0) return [line.trim(), '']
        const key = line.slice(0, separator).trim()
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '')
        return [key, value]
      }),
  )
  const content = match[2].trim()
  const publishedAt = metadata.date
  if (!metadata.title || !publishedAt || !metadata.excerpt)
    throw new Error(`文章 ${filename} 必须填写 title、date 和 excerpt`)
  const color = (
    ['mint', 'sunshine', 'sky'].includes(metadata.color) ? metadata.color : 'mint'
  ) as PostColor
  const wordCount = content.replace(/\s+/g, '').length
  return {
    slug,
    date: publishedAt.slice(5).replace('-', ' / '),
    publishedAt,
    readingTime: Number(metadata.readingTime) || Math.max(1, Math.ceil(wordCount / 400)),
    tag: metadata.tag || defaultTag,
    title: metadata.title,
    excerpt: metadata.excerpt,
    color,
    icon: metadata.icon || '🌊',
    previewImage: metadata.previewImage || undefined,
    detailImage: metadata.detailImage || undefined,
    content,
    sourceDir: path.match(/\.\.\/([^/]+)\//)?.[1] ?? 'posts',
  }
}

export const posts = Object.entries(markdownFiles)
  .map(([path, source]) => parseMarkdown(path, source))
  .filter((post): post is Post => post !== null)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export function getPostPreviewImage(post: Post) {
  return post.previewImage || post.detailImage
}

export function getPostDetailImage(post: Post) {
  return post.detailImage || post.previewImage
}
