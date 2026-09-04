import { parseMarkdown, type Post } from '../../shared/utils'
/** 构建时读取本栏目 Markdown 原文，后续统一解析为页面使用的数据。 */
const markdownFiles = import.meta.glob('../../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
/** 解析文章 Markdown，去掉模板并按日期从新到旧排序；新增内容通常只需添加 Markdown 文件。 */
export const posts = Object.entries(markdownFiles)
  .map(([path, source]) => parseMarkdown(path, source))
  .filter((post): post is Post => post !== null)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
