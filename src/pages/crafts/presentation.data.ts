import standPools from 'virtual:island-stand-pools'
import { standPoolByFiles, type PresentationConfig } from '../../shared/utils'

/** 手工目录的全部底图；dark.png 标记为 dark 布局，便于 CSS 单独设置铭牌颜色。 */
const workbenches = standPools.crafts.map((stand) => ({
  ...stand,
  layout: stand.image.endsWith('/dark.png') ? 'dark' : 'default',
}))

/** 文案和底图统一在这里维护；byTags 从上到下匹配第一组。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['正在制作中', '材料采购中', '灵感正在施工'],
    empty: ['等待新的手工作品', '工作台暂时空着'],
  },
  stands: {
    // 默认从本栏目指定素材文件夹自动读取，无需手写图片清单。
    default: workbenches,
    byTags: [
      {
        tags: ['房间装饰'],
        pool: standPoolByFiles(workbenches, ['base.png', 'dark.png']),
      },
    ],
  },
}
