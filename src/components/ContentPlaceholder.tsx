import { useState, type CSSProperties } from 'react'
import { colorClass, colorStyle } from '../data/colorPalette'
import { getContentMessage } from '../data/contentMessages'

type PlaceholderSection = 'museum' | 'recipes' | 'crafts' | 'travel' | 'planting' | 'posts'

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
