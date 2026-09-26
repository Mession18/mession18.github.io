import { contentSectionInfo } from '../../shared/config'
import { loadPosts } from '../../shared/markdown'
const files = import.meta.glob('../../content/travel/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
/** 解析旅行 Markdown，去掉模板并按日期从新到旧排序；新增内容通常只需添加 Markdown 文件。 */
export const travel = loadPosts(files, contentSectionInfo.travel.title)
