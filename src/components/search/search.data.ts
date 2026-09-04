import { categoryLabels, collections } from '../../pages/museum/museum.data'
import { posts } from '../../pages/posts/posts.data'
import { contentSectionInfo, sectionContent, type ContentSectionKey } from '../../shared/data'

/** 搜索索引条目：显示字段、跳转地址和标准化后的搜索全文。 */
export type SearchEntry = {
  id: string
  href: string
  title: string
  meta: string
  excerpt: string
  icon: string
  color: string
  searchText: string
}

/** 拼接标题、摘要及正文并统一小写，让搜索使用同一套匹配规则。 */
function searchable(entry: Omit<SearchEntry, 'searchText'>, extra = ''): SearchEntry {
  return {
    ...entry,
    searchText: `${entry.title} ${entry.meta} ${entry.excerpt} ${extra}`.toLocaleLowerCase('zh-CN'),
  }
}

/** 栏目入口索引，即使没有具体内容也可以搜索并进入栏目。 */
const sectionEntries: SearchEntry[] = [
  searchable({
    id: 'section-home',
    href: '/',
    title: '风铃岛首页',
    meta: '首页 · 岛屿指引',
    excerpt: '天气、最新文章、随机藏品与岛上的日常入口。',
    icon: '🏝️',
    color: 'mint',
  }),
  searchable({
    id: 'section-passport',
    href: '/#about',
    title: '岛民护照',
    meta: '首页 · 旅行护照',
    excerpt: '岛民身份页、旅行签证、城市印章与旅行年鉴。',
    icon: '🛂',
    color: 'sky',
  }),
  searchable({
    id: 'section-posts',
    href: '/posts',
    title: '文章',
    meta: '文章 · 全部内容',
    excerpt: '阅读风铃岛寄出的每一封信。',
    icon: '✉️',
    color: 'sunshine',
  }),
  searchable({
    id: 'section-museum',
    href: '/museum',
    title: '岛民博物馆',
    meta: '博物馆 · 全部藏品',
    excerpt: '照片、游戏、书籍和音乐收藏。',
    icon: '🏛️',
    color: 'lavender',
  }),
  ...(Object.keys(contentSectionInfo) as ContentSectionKey[]).map((section) =>
    searchable({
      id: `section-${section}`,
      href: `/${section}`,
      title: contentSectionInfo[section].title,
      meta: `${contentSectionInfo[section].title} · 全部内容`,
      excerpt: contentSectionInfo[section].description,
      icon:
        section === 'recipes'
          ? '🍳'
          : section === 'crafts'
            ? '🧶'
            : section === 'travel'
              ? '🧳'
              : '🌱',
      color:
        section === 'recipes'
          ? 'sunshine'
          : section === 'crafts'
            ? 'coral'
            : section === 'travel'
              ? 'sky'
              : 'mint',
    }),
  ),
]

/** 把文章正文及元信息转换为可跳转的搜索条目。 */
const postEntries = posts.map((post) =>
  searchable(
    {
      id: `post-${post.slug}`,
      href: `/posts/${post.slug}`,
      title: post.title,
      meta: `文章 · ${post.tag} · ${post.publishedAt}`,
      excerpt: post.excerpt,
      icon: post.icon,
      color: post.color,
    },
    post.content,
  ),
)

/** 为藏品生成带分类与 slug 的详情地址和搜索文本。 */
const collectionEntries = collections.map((item) =>
  searchable(
    {
      id: `collection-${item.category}-${item.slug}`,
      href: `/museum/${item.category}/${item.slug}`,
      title: item.title,
      meta: `博物馆 · ${categoryLabels[item.category]} · ${item.year}`,
      excerpt: item.excerpt,
      icon: item.icon,
      color: item.color,
    },
    `${item.subtitle} ${item.content}`,
  ),
)

/** 遍历共享栏目数据生成索引；接入 sectionContent 的栏目会在这里纳入全文搜索。 */
const extraEntries = (Object.keys(sectionContent) as ContentSectionKey[]).flatMap((section) =>
  sectionContent[section].map((item) =>
    searchable(
      {
        id: `${section}-${item.slug}`,
        href: `/${section}/${item.slug}`,
        title: item.title,
        meta: `${contentSectionInfo[section].title} · ${item.tag}`,
        excerpt: item.excerpt,
        icon: item.icon,
        color: item.color,
      },
      item.content,
    ),
  ),
)

/** 合并栏目、文章、藏品和其他内容的搜索索引，供搜索弹窗过滤。 */
export const searchEntries = [
  ...sectionEntries,
  ...postEntries,
  ...collectionEntries,
  ...extraEntries,
]
