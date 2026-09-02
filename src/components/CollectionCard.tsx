import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabels, getCollectionPreviewImage, type CollectionItem } from '../data/collections'
import { colorClass, colorStyle } from '../data/colorPalette'
import { AdaptivePreviewImage } from './AdaptivePreviewImage'

export function CollectionCard({ item }: { item: CollectionItem }) {
  const previewImage = getCollectionPreviewImage(item)

  return (
    <article className="collection-card collection-exhibit">
      <div className="collection-display-space">
        <Link className="collection-polaroid" to={`/museum/${item.category}/${item.slug}`}>
          <span
            className={`collection-picture collection-${colorClass(item.color)}`}
            style={colorStyle(item.color)}
          >
            {previewImage ? (
              <AdaptivePreviewImage src={previewImage} alt={item.title} />
            ) : (
              <b className="collection-away">藏品出差</b>
            )}
          </span>
          <small>{categoryLabels[item.category]}</small>
        </Link>
      </div>
      <div className="collection-card-body collection-pedestal">
        <div>
          <span>{item.year}</span>
          <span className="collection-rating">
            <Star size={12} fill="currentColor" /> {item.rating}
          </span>
        </div>
        <h2>
          <Link to={`/museum/${item.category}/${item.slug}`}>{item.title}</Link>
        </h2>
        <p>{item.excerpt}</p>
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
        <div className="collection-empty-sign">待收藏</div>
      </div>
      <div className="collection-card-body collection-pedestal">
        <h2>待收藏</h2>
        <p>这里正在等待下一件值得珍藏的东西。</p>
      </div>
    </article>
  )
}
