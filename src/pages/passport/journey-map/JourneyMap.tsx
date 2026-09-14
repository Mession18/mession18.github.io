import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react'
import { useId, useMemo, useState, type CSSProperties } from 'react'
import { countryFlags } from '../../../shared/country-flags'
import type { TravelStamp } from '../travel-stamps.data'
import {
  atlasCountries,
  atlasLabels,
  atlasSize,
  buildAtlasPlaces,
  clusterAtlasPlaces,
  formatVisit,
  projectLocation,
  visitTime,
  type AtlasPlace,
} from './journey-map.data'
import './journey-map.css'

const positionStyle = (x: number, y: number): CSSProperties => ({
  left: `${(x / atlasSize.width) * 100}%`,
  top: `${(y / atlasSize.height) * 100}%`,
})

export default function JourneyMap({ stamps }: { stamps: TravelStamp[] }) {
  const id = useId().replaceAll(':', '')
  const places = useMemo(() => buildAtlasPlaces(stamps), [stamps])
  const pins = useMemo(() => clusterAtlasPlaces(places), [places])
  const visitedCodes = new Set(places.map((place) => place.code))
  const newest = [...places]
    .filter((place) => place.position)
    .sort((a, b) => visitTime(b.visits[0]) - visitTime(a.visits[0]))[0]
  const [selection, setSelection] = useState<string | null | undefined>(undefined)
  const selected =
    selection === null ? undefined : (places.find((place) => place.key === selection) ?? newest)
  const selectedPin =
    selected && pins.find((pin) => pin.places.some((place) => place.key === selected.key))
  const [visitIndex, setVisitIndex] = useState(0)
  const [showIndex, setShowIndex] = useState(false)

  function selectPlace(place: AtlasPlace) {
    setSelection(place.key)
    setVisitIndex(0)
  }
  const ticketX = selectedPin ? Math.max(35, Math.min(1120, selectedPin.x - 370)) : 570
  const ticketY = selectedPin ? Math.max(235, Math.min(700, selectedPin.y - 50)) : 400
  const visit = selected?.visits[Math.min(visitIndex, selected.visits.length - 1)]
  const related = selectedPin?.places ?? []

  return (
    <section className="journey-atlas" aria-labelledby={`${id}-title`}>
      <div className="journey-atlas-book">
        <img
          className="journey-atlas-paper"
          src="/images/passport/旅行地图书页.webp"
          alt=""
          width="1536"
          height="1024"
          loading="lazy"
        />
        <header className="journey-atlas-heading">
          <h3 id={`${id}-title`}>旅行足迹</h3>
          <p>
            {visitedCodes.size} 个国家与地区 · {places.length} 座城市
          </p>
        </header>
        <svg
          className="journey-atlas-geography"
          viewBox="0 0 1536 1024"
          aria-label="旅行世界地图，使用真实海岸线与国家地区轮廓"
          role="img"
        >
          <defs>
            <filter id={`${id}-pigment`} x="0" y="0" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency=".18"
                numOctaves="4"
                seed="12"
                result="noise"
              />
              <feColorMatrix in="noise" type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="linear" slope=".4" intercept=".3" />
                <feFuncG type="linear" slope=".4" intercept=".3" />
                <feFuncB type="linear" slope=".4" intercept=".3" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" mode="soft-light" result="pigment" />
              <feComposite in="pigment" in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <g filter={`url(#${id}-pigment)`} className="journey-atlas-land">
            {atlasCountries.map((country) => (
              <path
                key={country.id}
                d={country.path ?? undefined}
                className={visitedCodes.has(country.code) ? 'is-visited' : undefined}
                data-country={country.code}
              >
                <title>{country.name}</title>
              </path>
            ))}
          </g>
          <g className="journey-atlas-labels" aria-hidden="true">
            {atlasLabels.map((label) => (
              <text
                key={`${label.x}-${label.y}`}
                x={label.x}
                y={label.y}
                className={label.ocean ? 'is-ocean' : undefined}
              >
                {label.lines.map((line, index) => (
                  <tspan key={line} x={label.x} dy={index ? 23 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            ))}
            {Array.from(visitedCodes).map((code) => {
              const country = atlasCountries.find((item) => item.code === code)
              const place = places.find((item) => item.code === code)
              const point = country && projectLocation(country)
              return point && place ? <text key={`visited-${code}`} x={point.x + (code === 'kr' ? 34 : 0)} y={point.y + 38} className="journey-atlas-country-name">{place.countryOrRegion}</text> : null
            })}
          </g>
        </svg>
        <div className="journey-atlas-gutter" aria-hidden="true" />
        <div className="journey-atlas-pins" aria-label="地图上的旅行地点">
          {pins.map((pin) => {
            const active = pin === selectedPin
            return (
              <button
                key={pin.key}
                type="button"
                className={`journey-atlas-pin${active ? ' is-selected' : ''}${pin.places[0].code === 'cn' ? '' : ' is-blue'}`}
                style={positionStyle(pin.x, pin.y)}
                aria-label={
                  pin.places.length > 1
                    ? `查看${pin.places.map((place) => place.city).join('、')}，共${pin.places.length}座城市`
                    : `查看${pin.places[0].city}的旅行记录`
                }
                aria-pressed={active}
                onClick={() => selectPlace(pin.places[0])}
              >
                <svg viewBox="0 0 32 44" aria-hidden="true">
                  <path d="M16 42C13 36 2 25 2 16a14 14 0 0 1 28 0c0 9-11 20-14 26Z" />
                  <circle cx="16" cy="16" r={pin.places.length > 1 ? 10 : 6} />
                </svg>
                {pin.places.length > 1 && <span>{pin.places.length}</span>}
              </button>
            )
          })}
        </div>
        {selected && visit && (
          <aside
            className="journey-atlas-ticket"
            style={positionStyle(ticketX, ticketY)}
            aria-label={`${selected.city}旅行记录`}
          >
            <button
              className="journey-atlas-close"
              type="button"
              aria-label="关闭旅行记录"
              onClick={() => setSelection(null)}
            >
              <X />
            </button>
            <div className="journey-atlas-ticket-place" aria-live="polite">
              {countryFlags[selected.code] ? (
                <img src={countryFlags[selected.code]} alt={`${selected.countryOrRegion}国旗`} />
              ) : (
                <MapPin aria-hidden="true" />
              )}
              <div>
                {selected.province &&
                  selected.province !== selected.city &&
                  selected.province !== selected.countryOrRegion && (
                    <span>{selected.province}</span>
                  )}
                <strong>{selected.city}</strong>
              </div>
              <svg className="journey-atlas-sketch" viewBox="0 0 90 60" aria-hidden="true">
                <path d="m3 48 14-16 14 16m-19-9 5 4 5-3m4 8 16-23 18 23M38 33l4 5 5-2M57 49V25m17 24V25M51 26h29l-8-5H59Zm3-11h23l-8-5h-7Zm4-11h15l-8-4ZM65 1v5M54 37h23M62 26v23m7-23v23M4 51h81" />
              </svg>
            </div>
            <time className="journey-atlas-ticket-date">{formatVisit(visit)}</time>
            {related.length > 1 && (
              <div className="journey-atlas-nearby" aria-label="此处的城市">
                {related.map((place) => (
                  <button
                    type="button"
                    key={place.key}
                    aria-pressed={place.key === selected.key}
                    onClick={() => selectPlace(place)}
                  >
                    {place.city}
                  </button>
                ))}
              </div>
            )}
            {selected.visits.length > 1 && (
              <div className="journey-atlas-visits">
                <button
                  type="button"
                  aria-label="上一枚旅行章"
                  disabled={visitIndex === 0}
                  onClick={() => setVisitIndex((value) => value - 1)}
                >
                  <ChevronLeft />
                </button>
                <span>
                  旅行章 {visitIndex + 1} / {selected.visits.length}
                </span>
                <button
                  type="button"
                  aria-label="下一枚旅行章"
                  disabled={visitIndex >= selected.visits.length - 1}
                  onClick={() => setVisitIndex((value) => value + 1)}
                >
                  <ChevronRight />
                </button>
              </div>
            )}
            {!selected.position && (
              <small className="journey-atlas-pending">这个地点还未标注坐标</small>
            )}
          </aside>
        )}
        <div className="journey-atlas-legend">
          <span>
            <i />
            已到访的国家／地区
          </span>
          <span>
            <MapPin aria-hidden="true" />
            已到访的城市
          </span>
        </div>
      </div>
      <div className="journey-atlas-index">
        <button
          type="button"
          className="journey-atlas-index-toggle"
          aria-expanded={showIndex}
          aria-controls={`${id}-places`}
          onClick={() => setShowIndex((value) => !value)}
        >
          {showIndex ? '收起' : '展开'}地点索引 <span>{places.length}</span>
        </button>
        {showIndex && (
          <div id={`${id}-places`} className="journey-atlas-place-list">
            {places.map((place) => (
              <button
                type="button"
                key={place.key}
                aria-pressed={selected?.key === place.key}
                onClick={() => selectPlace(place)}
              >
                {countryFlags[place.code] && <img src={countryFlags[place.code]} alt="" />}
                {place.city}
                {!place.position && <small>待定位</small>}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
