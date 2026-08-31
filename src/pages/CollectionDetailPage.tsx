import { Image, Tag } from 'animal-island-ui'
import { ArrowLeft, CalendarDays, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { categoryLabels, collections, getCollectionDetailImage } from '../data/collections'
import { MarkdownContent } from '../components/MarkdownContent'

export function CollectionDetailPage() {
  const { category, slug } = useParams()
  const item = collections.find((entry) => entry.category === category && entry.slug === slug)
  if (!item)
    return (
      <div className="page-surface not-found">
        <span>🏛️</span>
        <h1>展柜是空的</h1>
        <p>没有找到这件藏品。</p>
        <Link to="/museum">
          <ArrowLeft size={16} /> 返回博物馆
        </Link>
      </div>
    )
  const detailImage = getCollectionDetailImage(item)

  return (
    <article className="collection-detail">
      <Link className="back-link" to="/museum">
        <ArrowLeft size={16} /> 返回博物馆
      </Link>
      <div className="collection-detail-grid">
        <div
          className={`collection-feature collection-${item.color} ${detailImage ? 'has-image' : ''}`}
        >
          {detailImage ? (
            <Image src={detailImage} alt={item.title} preview className="detail-preview-image" />
          ) : (
            <span>{item.icon}</span>
          )}
          <small>COLLECTION · {item.id}</small>
        </div>
        <div className="collection-info">
          <Tag size="small" variant="soft" color="app-green" className="island-ui-tag">
            {categoryLabels[item.category]}
          </Tag>
          <h1>{item.title}</h1>
          <p className="collection-subtitle">{item.subtitle}</p>
          <div className="collection-meta">
            <span>
              <CalendarDays size={15} /> {item.year}
            </span>
            <span>
              <Star size={15} fill="currentColor" /> {item.rating} / 5
            </span>
          </div>
          <MarkdownContent sourceDir={item.sourceDir}>{item.content}</MarkdownContent>
        </div>
      </div>
    </article>
  )
}
