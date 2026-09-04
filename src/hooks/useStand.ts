import { useState } from 'react'
import { selectStand, type PresentationConfig } from '../shared/utils'

/** 每次挂载抽一次随机数。页面重绘不换图，标签改变则按新标签匹配同一随机种子。 */
export function useStand(config: PresentationConfig, tags: readonly string[] = [], empty = false) {
  /** 每次挂载只抽一次随机种子；标签或图片池变化时仍能重新按规则计算结果。 */
  const [seed] = useState(() => Math.random())
  return selectStand(config, tags, () => seed, empty)
}
