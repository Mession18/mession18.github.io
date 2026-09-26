import { contentSectionInfo } from '../../shared/config'
import { loadPosts } from '../../shared/markdown'
const files = import.meta.glob('../../content/crafts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
/** 解析手工 Markdown，去掉模板并按日期从新到旧排序；新增内容通常只需添加 Markdown 文件。 */
export const crafts = loadPosts(files, contentSectionInfo.crafts.title)
