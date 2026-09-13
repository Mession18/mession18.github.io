import standPools from 'virtual:island-stand-pools'
import {
  standPoolByFiles,
  standRulesByImageNames,
  type PresentationConfig,
} from '../../shared/presentation'

const plates = standPools.recipes
const basicPlateFiles = ['recipe-plate.png']

/** 文案和底图统一在这里维护；文章的多个标签会合并所有命中规则的底图。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['被吃掉了', '刚刚被端走', '正在重新摆盘'],
    empty: ['正在研发新菜品', '等待新菜谱'],
  },
  stands: {
    default: standPoolByFiles(plates, basicPlateFiles),
    byTags: standRulesByImageNames(plates, basicPlateFiles),
    empty: plates,
  },
}
