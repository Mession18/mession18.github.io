import { ArrowUpRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabels, getCollectionPreviewImage, type CollectionItem } from '../data/collections'
import { PreviewableImage } from './PreviewableImage'

export function CollectionCard({ item }: { item: CollectionItem }) {
  const previewImage = getCollectionPreviewImage(item)

  return (
    <article className="collection-card">
      <div className={`collection-cover collection-${item.color}`}>
        {previewImage ? (
          <PreviewableImage src={previewImage} alt={item.title} />
        ) : (
          <span>{item.icon}</span>
        )}
        <small>{categoryLabels[item.category]}</small>
      </div>
      <div className="collection-card-body">
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
        <Link className="collection-open" to={`/museum/${item.category}/${item.slug}`}>
          查看藏品 <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  )
}
