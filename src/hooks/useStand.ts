import { useState } from 'react'
import { selectStand, type PresentationConfig } from '../shared/presentation'

/** 每次挂载抽一次随机数。页面重绘不换图，标签改变则按新标签匹配同一随机种子。 */
export function useStand(config: PresentationConfig, tags: readonly string[] = [], empty = false) {
  const [seed] = useState(() => Math.random())
  return selectStand(config, tags, () => seed, empty)
}
