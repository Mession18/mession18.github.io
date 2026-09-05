import standPools from 'virtual:island-stand-pools'
import type { PresentationConfig } from '../../shared/utils'

/** 文案和底图统一在这里维护；文章的多个标签会合并所有命中规则的底图。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['去农场打僵尸了', '正在花园里散步', '暂时离开花盆'],
    empty: ['等待新植物到来', '等待下一颗种子'],
  },
  stands: {
    // 默认从本栏目指定素材文件夹自动读取，无需手写图片清单。
    default: standPools.planting,
    byTags: [],
  },
}
