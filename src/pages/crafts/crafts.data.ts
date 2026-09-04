import { contentSectionInfo } from '../../shared/config'
import { parseMarkdown, type Post } from '../../shared/utils'
/** 构建时读取本栏目直属 Markdown；下划线模板由解析器排除，不会生成卡片。 */
const files = import.meta.glob('../../content/crafts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
/** 解析手工 Markdown，去掉模板并按日期从新到旧排序；新增内容通常只需添加 Markdown 文件。 */
export const crafts = Object.entries(files)
  .map(([path, source]) => parseMarkdown(path, source, contentSectionInfo.crafts.title))
  .filter((item): item is Post => item !== null)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
