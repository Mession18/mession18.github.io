import { useState, type CSSProperties } from 'react'
import { colorClass, colorStyle } from '../../shared/config'
import { getContentMessage } from '../../shared/data'

/** 允许使用缺图文案的栏目键；新增采用该组件的栏目时同步扩展。 */
type PlaceholderSection = 'museum' | 'recipes' | 'crafts' | 'travel' | 'planting' | 'posts'

/** 组合缺图色块与栏目文案；文字在挂载时抽取，重绘不会不断换句子。 */
export function ContentPlaceholder({
  section,
  className = '',
  color = 'mint',
}: {
  section: PlaceholderSection
  className?: string
  color?: string
}) {
  const customColor = colorStyle(color) as CSSProperties | undefined
  const [message] = useState(() => getContentMessage(section, 'missing'))
  return (
    <span
      className={`${className} content-placeholder ${colorClass(color)}`.trim()}
      style={customColor}
    >
      {message}
    </span>
  )
}

/** 只返回栏目随机文案，供工作台、花盆等自行安排外观与位置。 */
export function ContentMessageText({
  section,
  kind,
}: {
  section: PlaceholderSection
  kind: 'missing' | 'empty'
}) {
  const [message] = useState(() => getContentMessage(section, kind))
  return message
}
