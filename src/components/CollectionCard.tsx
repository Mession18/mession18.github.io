import { Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCollectionPreviewImage, type CollectionItem } from '../data/collections'
import { colorClass, colorStyle } from '../data/colorPalette'
import { AdaptivePreviewImage } from './AdaptivePreviewImage'

const famousMuseums = ['大英博物馆', '卢浮宫', '大都会艺术博物馆', '故宫博物院', '梵蒂冈博物馆', '纽约现代艺术博物馆', '乌菲兹美术馆', '普拉多博物馆']

export function CollectionCard({ item }: { item: CollectionItem }) {
  const previewImage = getCollectionPreviewImage(item)
  const [loanMuseum] = useState(() => famousMuseums[Math.floor(Math.random() * famousMuseums.length)])
  const collectionDate = item.date
    ? (() => {
        const [year, month, day] = item.date.split('-')
        return `${year}年${Number(month)}月${Number(day)}日`
      })()
    : ''

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
              <b className="collection-away">藏品外借至{loanMuseum}</b>
            )}
          </span>
        </Link>
      </div>
      <div className="collection-card-body collection-pedestal has-pedestal">
        {collectionDate && <svg className="collection-exhibit-date" viewBox="0 0 360 90" aria-hidden="true">
          <defs><path id={`collection-date-arc-${item.slug}`} d="M 92 24 Q 180 56 268 24" /></defs>
          <text textAnchor="middle"><textPath href={`#collection-date-arc-${item.slug}`} startOffset="50%">于{collectionDate}收藏</textPath></text>
        </svg>}
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
        <div className="collection-empty-sign">待收藏</div>
      </div>
      <div className="collection-card-body collection-pedestal has-pedestal">
        <h2 className="collection-exhibit-name">待收藏</h2>
        <p className="collection-exhibit-description">这里正在等待下一件值得珍藏的东西。</p>
      </div>
    </article>
  )
}
