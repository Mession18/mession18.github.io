import { Grip, Minus, Plus, Search, X } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type RefObject, type PointerEvent } from 'react'
import { AtlasGeography } from './AtlasGeography'
import { AtlasPinButton } from './AtlasPinButton'
import { AtlasPaper } from './AtlasPaper'
import { atlasSize, type AtlasPin, type AtlasVariant } from './journey-map.data'

const clamp = (value: number) => Math.max(0, Math.min(1, value))

/** 放大底图和坐标间距，标签在独立图层绘制，始终保持原字号与点击尺寸。 */
export function AtlasLoupe({
  mapRef,
  pins,
  variant,
  visited,
  selectedKey,
  onSelect,
}: {
  mapRef: RefObject<SVGSVGElement | null>
  pins: AtlasPin[]
  variant: AtlasVariant
  visited: Set<string>
  selectedKey?: string
  onSelect: (pin: AtlasPin) => void
}) {
  const [enabled, setEnabled] = useState(false)
  const [zoom, setZoom] = useState(4)
  const [point, setPoint] = useState({ x: 0.73, y: 0.42 })
  const [size, setSize] = useState({ width: 1000, height: 650 })
  const drag = useRef<{
    id: number
    x: number
    y: number
    origin: { x: number; y: number }
    cursor: { x: number; y: number }
    moved: boolean
    toolbar: boolean
  } | null>(null)
  const ignoreClick = useRef(false)
  useLayoutEffect(() => {
    const element = mapRef.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      if (element.clientWidth && element.clientHeight)
        setSize({ width: element.clientWidth, height: element.clientHeight })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [mapRef])
  const radius = Math.max(80, Math.min(115, size.width * 0.13))
  const cx = point.x * size.width,
    cy = point.y * size.height
  function mapPoint(clientX: number, clientY: number) {
    const matrix = mapRef.current?.getScreenCTM()
    if (!matrix) return null
    const local = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
    return { x: local.x / atlasSize.width, y: local.y / atlasSize.height }
  }
  function start(event: PointerEvent<HTMLElement>, toolbar = false) {
    if (
      event.button !== 0 ||
      (!toolbar &&
        (event.target as HTMLElement).closest(
          '.journey-atlas-pin, .journey-atlas-loupe-close, .journey-atlas-loupe-zoom',
        ))
    )
      return
    const cursor = mapPoint(event.clientX, event.clientY)
    if (!cursor) return
    event.preventDefault()
    event.stopPropagation()
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      origin: toolbar ? cursor : point,
      cursor,
      moved: false,
      toolbar,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<HTMLElement>) {
    const dragging = drag.current
    if (!dragging || dragging.id !== event.pointerId) return
    if (Math.hypot(event.clientX - dragging.x, event.clientY - dragging.y) < 4 && !dragging.moved)
      return
    dragging.moved = true
    const cursor = mapPoint(event.clientX, event.clientY)
    if (!cursor) return
    setPoint({
      x: clamp(dragging.origin.x + cursor.x - dragging.cursor.x),
      y: clamp(dragging.origin.y + cursor.y - dragging.cursor.y),
    })
    setEnabled(true)
  }
  function end(event: PointerEvent<HTMLElement>) {
    if (!drag.current) return
    ignoreClick.current = drag.current.toolbar && drag.current.moved
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return (
    <>
      <button
        className="journey-atlas-loupe-toggle"
        type="button"
        aria-label="地图放大镜：点击开启，或拖到地图上"
        aria-pressed={enabled}
        title="拖动放大镜，查看地图细节"
        onPointerDown={(event) => start(event, true)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onClick={() => {
          if (ignoreClick.current) {
            ignoreClick.current = false
            return
          }
          setEnabled((value) => !value)
        }}
      >
        <Search size={23} />
      </button>
      {enabled && (
        <div
          className="journey-atlas-loupe"
          role="group"
          aria-label="地图放大镜"
          style={{ left: cx - radius, top: cy - radius, width: radius * 2, height: radius * 2 }}
          onPointerDown={(event) => start(event)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <div className="journey-atlas-loupe-window">
            <div
              className="journey-atlas-loupe-map"
              style={{
                width: size.width,
                height: size.height,
                transform:
                  'translate(' +
                  (radius - cx * zoom) +
                  'px,' +
                  (radius - cy * zoom) +
                  'px) scale(' +
                  zoom +
                  ')',
              }}
            >
              <AtlasPaper />
              <svg viewBox="0 0 1536 1024" preserveAspectRatio="none" aria-hidden="true">
                <AtlasGeography
                  variant={variant}
                  visited={visited}
                  detailed={variant === 'china'}
                />
              </svg>
            </div>
            <div className="journey-atlas-loupe-pins">
              {pins
                .filter(
                  (pin) =>
                    Math.hypot(
                      ((pin.x / atlasSize.width) * size.width - cx) * zoom,
                      ((pin.y / atlasSize.height) * size.height - cy) * zoom,
                    ) <
                    radius + 35,
                )
                .map((pin) => (
                  <AtlasPinButton
                    key={pin.key}
                    pin={pin}
                    active={pin.key === selectedKey}
                    onSelect={() => onSelect(pin)}
                    style={{
                      left: radius + ((pin.x / atlasSize.width) * size.width - cx) * zoom,
                      top: radius + ((pin.y / atlasSize.height) * size.height - cy) * zoom,
                    }}
                  />
                ))}
            </div>
          </div>
          <button
            className="journey-atlas-loupe-handle"
            type="button"
            aria-label="移动放大镜，支持方向键"
            onKeyDown={(event) => {
              const offsets: Record<string, [number, number]> = {
                ArrowLeft: [-0.03, 0],
                ArrowRight: [0.03, 0],
                ArrowUp: [0, -0.03],
                ArrowDown: [0, 0.03],
              }
              const offset = offsets[event.key]
              if (offset) {
                event.preventDefault()
                event.stopPropagation()
                setPoint((value) => ({
                  x: clamp(value.x + offset[0]),
                  y: clamp(value.y + offset[1]),
                }))
              }
              if (event.key === 'Escape') setEnabled(false)
            }}
          >
            <Grip size={15} />
            <span>{zoom}×</span>
          </button>
          <div className="journey-atlas-loupe-zoom">
            <button
              type="button"
              aria-label="减小地图放大倍数"
              disabled={zoom <= 2}
              onClick={() => setZoom((value) => Math.max(2, value - 2))}
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              aria-label="增大地图放大倍数"
              disabled={zoom >= 24}
              onClick={() => setZoom((value) => Math.min(24, value + 2))}
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            className="journey-atlas-loupe-close"
            type="button"
            aria-label="收起放大镜"
            onClick={() => setEnabled(false)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  )
}
