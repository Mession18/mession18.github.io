import { parseMarkdown, type Post } from './posts'

export type ContentSectionKey = 'recipes' | 'crafts' | 'travel' | 'planting'
export const contentSectionInfo: Record<
  ContentSectionKey,
  { title: string; eyebrow: string; description: string }
> = {
  recipes: { title: '菜谱', eyebrow: 'ISLAND RECIPES', description: '记录值得反复品尝的味道。' },
  crafts: { title: '手工', eyebrow: 'ISLAND DIY', description: '把灵感慢慢做成看得见的东西。' },
  travel: { title: '旅游', eyebrow: 'ISLAND TRAVEL', description: '收藏一路遇见的风景与故事。' },
  planting: { title: '种植', eyebrow: 'ISLAND GARDEN', description: '记录播种、开花与收获。' },
}

const filesBySection: Record<ContentSectionKey, Record<string, string>> = {
  recipes: import.meta.glob('../recipes/*.md', { query: '?raw', import: 'default', eager: true }),
  crafts: import.meta.glob('../crafts/*.md', { query: '?raw', import: 'default', eager: true }),
  travel: import.meta.glob('../travel/*.md', { query: '?raw', import: 'default', eager: true }),
  planting: import.meta.glob('../planting/*.md', { query: '?raw', import: 'default', eager: true }),
} as Record<ContentSectionKey, Record<string, string>>

export const sectionContent = Object.fromEntries(
  Object.entries(filesBySection).map(([section, files]) => [
    section,
    Object.entries(files)
      .map(([path, source]) =>
        parseMarkdown(path, source, contentSectionInfo[section as ContentSectionKey].title),
      )
      .filter((item): item is Post => item !== null)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  ]),
) as Record<ContentSectionKey, Post[]>
