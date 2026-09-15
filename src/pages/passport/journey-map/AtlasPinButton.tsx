import type { CSSProperties } from 'react'
import type { AtlasPin } from './journey-map.data'

export function AtlasPinButton({
  pin,
  active,
  onSelect,
  style,
}: {
  pin: AtlasPin
  active: boolean
  onSelect: () => void
  style: CSSProperties
}) {
  return (
    <button
      type="button"
      className={
        'journey-atlas-pin' + (active ? ' is-selected' : '') + (pin.code === 'cn' ? '' : ' is-blue')
      }
      style={style}
      data-pin-group={pin.key}
      data-pin-level={pin.city ? 'city' : 'region'}
      aria-label={
        pin.city ? pin.label + '的旅行记录' : pin.label + '：' + pin.places.length + '座城市'
      }
      aria-pressed={active}
      onClick={onSelect}
    >
      <svg viewBox="0 0 32 44" aria-hidden="true">
        <path d="M16 42C13 36 2 25 2 16a14 14 0 0 1 28 0c0 9-11 20-14 26Z" />
        <circle cx="16" cy="16" r="7" />
      </svg>
      <span className="journey-atlas-pin-name">{pin.label}</span>
    </button>
  )
}
