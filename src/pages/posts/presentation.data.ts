import standPools from 'virtual:island-stand-pools'
import type { PresentationConfig } from '../../shared/utils'

/** 文案和底图统一在这里维护；文章的多个标签会合并所有命中规则的底图。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['文章配图正在绘制', '照片正在整理', '封面还在路上'],
    empty: ['等待新的岛屿来信', '下一篇文章正在构思'],
  },
  stands: {
    // 默认从本栏目指定素材文件夹自动读取，无需手写图片清单。
    default: standPools.posts,
    byTags: [],
  },
}
