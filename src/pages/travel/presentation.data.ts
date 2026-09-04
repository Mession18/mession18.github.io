import standPools from 'virtual:island-stand-pools'
import type { PresentationConfig } from '../../shared/utils'

/** 文案和底图统一在这里维护；byTags 从上到下匹配第一组。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['正在拍摄中', '胶卷正在冲洗', '照片还在路上'],
    empty: ['即将前往', '下一站待定'],
  },
  stands: {
    // 默认从本栏目指定素材文件夹自动读取，无需手写图片清单。
    default: standPools.travel,
    byTags: [],
  },
}
