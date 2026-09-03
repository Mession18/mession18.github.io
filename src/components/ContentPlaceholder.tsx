import type { CSSProperties } from 'react'
import { colorClass, colorStyle } from '../data/colorPalette'
import { getContentMessage } from '../data/contentMessages'

type PlaceholderSection = 'museum' | 'recipes' | 'crafts' | 'travel' | 'planting' | 'posts'

export function ContentPlaceholder({
  section,
  itemKey,
  className = '',
  color = 'mint',
}: {
  section: PlaceholderSection
  itemKey: string
  className?: string
  color?: string
}) {
  const customColor = colorStyle(color) as CSSProperties | undefined
  return (
    <span
      className={`${className} content-placeholder ${colorClass(color)}`.trim()}
      style={customColor}
    >
      {getContentMessage(section, 'missing', itemKey)}
    </span>
  )
}
