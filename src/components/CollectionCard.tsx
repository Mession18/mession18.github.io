import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCollectionDisplayImage, type CollectionItem } from '../data/collections'
import { colorClass, colorStyle } from '../data/colorPalette'
import { ContentMessageText } from './ContentPlaceholder'
import { AdaptivePreviewImage } from './AdaptivePreviewImage'
import { formatChineseDate } from '../data/dates'

export function CollectionCard({ item }: { item: CollectionItem }) {
  const previewImage = getCollectionDisplayImage(item)
  const collectionDate = formatChineseDate(item.date)

  return (
    <article className="collection-card collection-exhibit">
      <div className="collection-display-space">
        <Link className="collection-polaroid" to={`/museum/${item.category}/${item.slug}`}>
          <span
            className={`collection-picture collection-${colorClass(item.color)}`}
            style={previewImage ? undefined : colorStyle(item.color)}
          >
            {previewImage ? (
              <AdaptivePreviewImage src={previewImage} alt={item.title} />
            ) : (
              <b className="collection-away">
                <ContentMessageText section="museum" kind="missing" />
              </b>
            )}
          </span>
        </Link>
      </div>
      <div className="collection-card-body collection-pedestal has-pedestal">
        {collectionDate && (
          <svg className="collection-exhibit-date" viewBox="0 0 360 90" aria-hidden="true">
            <defs>
              <path id={`collection-date-arc-${item.slug}`} d="M 92 30 Q 180 52 268 30" />
            </defs>
            <text textAnchor="middle">
              <textPath href={`#collection-date-arc-${item.slug}`} startOffset="50%">
                于{collectionDate}收藏
              </textPath>
            </text>
          </svg>
        )}
        <div>
          <span>{item.year}</span>
          <span className="collection-rating">
            <Star size={12} fill="currentColor" /> {item.rating}
          </span>
        </div>
        <h2 className="collection-exhibit-name">
          <Link to={`/museum/${item.category}/${item.slug}`}>{item.title}</Link>
        </h2>
        <p className="collection-exhibit-description">{item.excerpt}</p>
      </div>
    </article>
  )
}

export function EmptyCollectionCard() {
  return (
    <article
      className="collection-card collection-exhibit collection-empty"
      aria-label="待收藏展位"
    >
      <div className="collection-display-space">
        <div className="collection-empty-sign">
          <ContentMessageText section="museum" kind="empty" />
        </div>
      </div>
      <div className="collection-card-body collection-pedestal has-pedestal">
        <h2 className="collection-exhibit-name">待收藏</h2>
        <p className="collection-exhibit-description">这里正在等待下一件值得珍藏的东西。</p>
      </div>
    </article>
  )
}
