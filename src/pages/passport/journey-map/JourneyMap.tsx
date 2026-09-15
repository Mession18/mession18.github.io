import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react'
import { useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AtlasGeography } from './AtlasGeography'
import { AtlasLoupe } from './AtlasLoupe'
import { AtlasPinButton } from './AtlasPinButton'
import { AtlasPaper } from './AtlasPaper'
import { countryFlags } from '../../../shared/country-flags'
import { stampArticles, type TravelStamp } from '../travel-stamps.data'
import { useImageSource } from '../../../hooks/useImageSource'
import type { Post } from '../../../shared/utils'
import {
  atlasSize,
  buildAtlasPlaces,
  groupAtlasPlaces,
  atlasIndexGroups,
  cityAtlasPins,
  isChinaPlace,
  formatVisit,
  type AtlasPlace,
  type AtlasVariant,
} from './journey-map.data'
import './journey-map.css'

const positionStyle = (x: number, y: number): CSSProperties => ({
  left: `${(x / atlasSize.width) * 100}%`,
  top: `${(y / atlasSize.height) * 100}%`,
})

/** 使用旅游明信片相同的邮票素材；图片失效时仅回退到文章提供的图标。 */
function TicketPostage({ post }: { post?: Post }) {
  const { image, onError } = useImageSource(post?.stampImage)
  if (!image && !post?.customIcon) return null
  return (
    <span className={'journey-atlas-postage' + (image ? ' has-image' : '')} aria-hidden="true">
      {image ? <img src={image} onError={onError} alt="" /> : post?.customIcon}
    </span>
  )
}

export default function JourneyMap({
  stamps,
  embedded = false,
  variant = 'world',
}: {
  stamps: TravelStamp[]
  embedded?: boolean
  variant?: AtlasVariant
}) {
  const id = useId().replaceAll(':', '')
  const mapRef = useRef<SVGSVGElement>(null)
  const places = useMemo(
    () =>
      buildAtlasPlaces(stamps).filter((place) => variant === 'world' || isChinaPlace(place.code)),
    [stamps, variant],
  )
  const pins = useMemo(() => groupAtlasPlaces(places, variant), [places, variant])
  const lensPins = useMemo(
    () => (variant === 'china' ? cityAtlasPins(places) : pins),
    [places, pins, variant],
  )
  const indexGroups = useMemo(() => atlasIndexGroups(places, variant), [places, variant])
  const visited = new Set(
    places.map((place) => (variant === 'china' ? (place.province ?? '') : place.code)),
  )
  const [selection, setSelection] = useState<string | null>(null)
  const [indexGroup, setIndexGroup] = useState<string | null>(null)
  const selectedGroup = indexGroups.find((group) => group.key === indexGroup)
  const selected = places.find((place) => place.key === selection)
  const selectedPin =
    selected && pins.find((pin) => pin.places.some((place) => place.key === selected.key))
  const [visitIndex, setVisitIndex] = useState(0)
  const [showIndex, setShowIndex] = useState(false)

  function selectPlace(place: AtlasPlace, group?: string | null) {
    setSelection(place.key)
    setVisitIndex(0)
    setShowIndex(false)
    if (group !== undefined) setIndexGroup(group)
  }
  const ticketX = selectedPin ? Math.max(35, Math.min(1120, selectedPin.x - 370)) : 570
  const ticketY = selectedPin ? Math.max(235, Math.min(700, selectedPin.y - 50)) : 400
  const visit = selected?.visits[Math.min(visitIndex, selected.visits.length - 1)]
  const related = selectedGroup?.places ?? selectedPin?.places ?? []
  const articles = [
    ...new Map(
      selected?.visits.flatMap(stampArticles).map((article) => [article.slug, article]) ?? [],
    ).values(),
  ]
  const postageArticle =
    (visit ? stampArticles(visit) : []).find((post) => post.stampImage || post.customIcon) ??
    articles.find((post) => post.stampImage || post.customIcon)

  return (
    <section
      className={`journey-atlas journey-atlas-${variant}${embedded ? ' journey-atlas-embedded' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="journey-atlas-book">
        <AtlasPaper className="journey-atlas-paper" />
        <header className="journey-atlas-heading">
          <h3 id={`${id}-title`}>旅行足迹</h3>
          <p>
            {variant === 'china'
              ? '中国 · ' + pins.length + ' 个省级地区'
              : '世界 · ' + visited.size + ' 个国家与地区'}{' '}
            · {places.length} 座城市
          </p>
        </header>
        <svg
          ref={mapRef}
          className="journey-atlas-geography"
          viewBox="0 0 1536 1024"
          preserveAspectRatio="none"
          aria-label={
            variant === 'china' ? '中国旅行地图，含省级地区边界' : '旅行世界地图，含国家地区轮廓'
          }
          role="img"
        >
          <AtlasGeography variant={variant} visited={visited} />
        </svg>
        <div className="journey-atlas-gutter" aria-hidden="true" />
        <div className="journey-atlas-pins" aria-label="地图上的旅行地点">
          {pins.map((pin) => (
            <AtlasPinButton
              key={pin.key}
              pin={pin}
              active={pin === selectedPin}
              style={positionStyle(pin.x, pin.y)}
              onSelect={() => selectPlace(pin.places[0], null)}
            />
          ))}
        </div>
        <AtlasLoupe
          mapRef={mapRef}
          variant={variant}
          pins={lensPins}
          visited={visited}
          selectedKey={variant === 'china' ? selected?.key : selectedPin?.key}
          onSelect={(pin) => selectPlace(pin.places[0], null)}
        />
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
              <TicketPostage post={postageArticle} />
            </div>
            <time className="journey-atlas-ticket-date">{formatVisit(visit)}</time>
            {related.length > 1 && (
              <div
                className="journey-atlas-nearby"
                aria-label={`${selectedGroup?.label ?? selectedPin?.label ?? ''}的城市`}
              >
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
            <div className="journey-atlas-articles" aria-label="城市游记">
              {articles.length ? (
                articles.map((article) => (
                  <Link key={article.slug} to={'/travel/' + article.slug}>
                    阅读游记 · {article.title} <span aria-hidden="true">↗</span>
                  </Link>
                ))
              ) : (
                <button className="journey-atlas-no-article" type="button" disabled>
                  游记待记录
                </button>
              )}
            </div>
            {!selected.position && (
              <small className="journey-atlas-pending">这个地点还未标注坐标</small>
            )}
          </aside>
        )}
        {!selected && (
          <div className="journey-atlas-empty-selection">
            <MapPin size={24} strokeWidth={1.2} />
            <p>轻点标签，打开城市旅行记录</p>
            <span>
              {variant === 'china'
                ? '放大镜内可查看城市边界、选择城市'
                : '相邻地点可用放大镜或地区索引选择'}
            </span>
          </div>
        )}
        <div className="journey-atlas-legend">
          <span>
            <i />
            {variant === 'china' ? '已到访的省级地区' : '已到访的国家／地区'}
          </span>
          <span>
            <MapPin aria-hidden="true" />
            {variant === 'china' ? '省份标签 · 点击选城市' : '国家／地区标签'}
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
          {showIndex ? '收起' : '展开'}
          {variant === 'china' ? '省份索引' : '国家／地区索引'} <span>{indexGroups.length}</span>
        </button>
        {showIndex && (
          <div id={`${id}-places`} className="journey-atlas-place-list">
            {indexGroups.map((group) => (
              <button
                type="button"
                key={group.key}
                aria-pressed={group.places.some((place) => selected?.key === place.key)}
                onClick={() => selectPlace(group.places[0], group.key)}
              >
                {variant === 'world' && countryFlags[group.code] && (
                  <img src={countryFlags[group.code]} alt="" />
                )}
                {group.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
