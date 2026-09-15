import { countryFlags, isMainlandChina } from '../../shared/country-flags'
import type { TravelStamp as TravelStampData } from '../../pages/passport/travel-stamps.data'
import { stampArticles } from '../../pages/passport/travel-stamps.data'
import { Link } from 'react-router-dom'

/** 护照与明信片共用的旅行章；章心固定显示中文国家/地区对应的国旗。 */
export function TravelStamp({
  stamp,
  compact = false,
  linkToArticle = false,
}: {
  stamp: TravelStampData
  compact?: boolean
  linkToArticle?: boolean
}) {
  const flag = stamp.countryCode ? countryFlags[stamp.countryCode] : undefined
  const showProvince = stamp.province && stamp.province.trim() !== stamp.countryOrRegion.trim()
  const showCompactProvince = showProvince && stamp.province?.trim() !== stamp.city.trim()
  const artwork = (
    <div
      className={`travel-stamp stamp-${stamp.color} ${isMainlandChina(stamp.countryOrRegion) ? 'stamp-square' : ''} ${compact ? 'travel-stamp-compact' : ''}`}
      style={{ transform: `rotate(${stamp.rotation ?? 0}deg)` }}
    >
      {flag ? (
        <img className="stamp-flag" src={flag} alt={`${stamp.countryOrRegion}旗帜`} />
      ) : (
        <span className="stamp-mark" aria-label="未识别国旗">
          🏳️
        </span>
      )}
      {compact ? (
        <b className="stamp-location stamp-location-compact">
          {showCompactProvince && <small>{stamp.province}</small>}
          <span>{stamp.city}</span>
        </b>
      ) : (
        <>
          <b className="stamp-location">
            {showProvince && <small>{stamp.province}</small>}
            <span>{stamp.city}</span>
          </b>
          <span className="stamp-country">{stamp.countryOrRegion}</span>
          <time>
            <span>{stamp.startDate}</span>
            {stamp.endDate && stamp.endDate !== stamp.startDate && (
              <>
                <i>-</i>
                <span>{stamp.endDate}</span>
              </>
            )}
          </time>
          {stamp.note && <em>{stamp.note}</em>}
        </>
      )}
    </div>
  )
  if (!linkToArticle) return artwork
  const article = stampArticles(stamp)[0]
  return article ? (
    <Link
      className="passport-stamp-entry"
      to={`/travel/${article.slug}`}
      aria-label={`${stamp.city}旅行章：阅读《${article.title}》`}
    >
      {artwork}
      <span className="passport-stamp-caption">查看游记 ↗</span>
    </Link>
  ) : (
    <div className="passport-stamp-entry">
      {artwork}
      <span className="passport-stamp-caption is-pending">游记待记录</span>
    </div>
  )
}
