import standPools from 'virtual:island-stand-pools'
import type { PresentationConfig } from '../../shared/utils'

/** 文案和底图统一在这里维护；byTags 从上到下匹配第一组。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['被吃掉了', '刚刚被端走', '正在重新摆盘'],
    empty: ['正在研发新菜品', '等待新菜谱'],
  },
  stands: {
    // 默认从本栏目指定素材文件夹自动读取，无需手写图片清单。
    default: standPools.recipes,
    byTags: [],
  },
}
