import standPools from 'virtual:island-stand-pools'
import {
  standPoolByFiles,
  standRulesByImageNames,
  type PresentationConfig,
} from '../../shared/presentation'

/** 手工目录的全部底图；dark.png 标记为 dark 布局，便于 CSS 单独设置铭牌颜色。 */
const workbenches = standPools.crafts.map((stand) => ({
  ...stand,
  layout: stand.image.endsWith('/dark.png') ? 'dark' : 'default',
}))
const basicWorkbenchFiles = ['base.png']

/** 文案和底图统一在这里维护；文章的多个标签会合并所有命中规则的底图。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['正在制作中', '材料采购中', '灵感正在施工'],
    empty: ['等待新的手工作品', '工作台暂时空着'],
  },
  stands: {
    default: standPoolByFiles(workbenches, basicWorkbenchFiles),
    byTags: standRulesByImageNames(workbenches, basicWorkbenchFiles),
    empty: workbenches,
  },
}
