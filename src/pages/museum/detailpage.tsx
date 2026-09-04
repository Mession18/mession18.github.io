import { useImageSource } from '../../hooks/useImageSource'
import { Image, Tag } from 'animal-island-ui'
import { ArrowLeft, CalendarDays, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { MarkdownContent } from '../../components/markdown/MarkdownContent'
import { colorClass, colorStyle } from '../../shared/config'
import { categoryLabels, collections, getCollectionDetailImage } from './museum.data'

/** 博物馆详情页：根据路由 slug 查找单条内容，显示大图、元信息和 Markdown；找不到时提供返回入口。 */
export function CollectionDetailPage() {
  const { category, slug } = useParams()
  const item = collections.find((entry) => entry.category === category && entry.slug === slug)
  const { image: detailImage, onError } = useImageSource(
    item ? getCollectionDetailImage(item) : undefined,
  )
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

  return (
    <article className="collection-detail">
      <Link className="back-link" to="/museum">
        <ArrowLeft size={16} /> 返回博物馆
      </Link>
      {/* 详情左右分区：大图/图标预览与标题、日期、正文；窄屏排列交给 CSS。 */}
      <div className="collection-detail-grid">
        <div
          className={`collection-feature collection-${colorClass(item.color)} ${detailImage ? 'has-image' : ''}`}
          style={colorStyle(item.color)}
        >
          {detailImage ? (
            <Image
              onError={onError}
              src={detailImage}
              alt={item.title}
              preview
              className="detail-preview-image"
            />
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
