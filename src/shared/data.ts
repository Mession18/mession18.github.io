import { crafts } from '../pages/crafts/crafts.data'
import { planting } from '../pages/planting/planting.data'
import { recipes } from '../pages/recipes/recipes.data'
import { travel } from '../pages/travel/travel.data'
import { presentation as craftsPresentation } from '../pages/crafts/presentation.data'
import { presentation as museumPresentation } from '../pages/museum/presentation.data'
import { presentation as plantingPresentation } from '../pages/planting/presentation.data'
import { presentation as postsPresentation } from '../pages/posts/presentation.data'
import { presentation as recipesPresentation } from '../pages/recipes/presentation.data'
import { presentation as travelPresentation } from '../pages/travel/presentation.data'
import { drawContentMessage } from './presentation'

/** 保留栏目元信息的命名导出，供读取聚合数据的调用者使用。 */
export { contentSectionInfo, type ContentSectionKey } from './config'
/** 跨栏目内容汇总；首页预览与搜索读取这里，解析仍留在各栏目 data 文件。 */
export const sectionContent = { travel, planting, crafts, recipes }

export { countryFlags } from './country-flags'

/** 把栏目键映射到各自展示配置，统一提供缺图文案查询。 */
const presentations = {
  museum: museumPresentation,
  recipes: recipesPresentation,
  crafts: craftsPresentation,
  travel: travelPresentation,
  planting: plantingPresentation,
  posts: postsPresentation,
}
/** 按栏目和 missing/empty 类型抽取文案，具体句子仍在各栏目的 presentation.data.ts。 */
export function getContentMessage(section: keyof typeof presentations, kind: 'missing' | 'empty') {
  return drawContentMessage(presentations[section], kind)
}
