import { useImageSource } from '../../hooks/useImageSource'
import { Image, Tag } from 'animal-island-ui'
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { MarkdownContent } from '../../components/markdown/MarkdownContent'
import { colorClass, colorStyle, contentSectionInfo } from '../../shared/config'

import { getPostDetailImage } from '../../shared/utils'
import { crafts } from './crafts.data'

/** 手工详情页：根据路由 slug 查找单条内容，显示大图、元信息和 Markdown；找不到时提供返回入口。 */
export function CraftsDetailPage() {
  const section = 'crafts' as const
  const { slug } = useParams()
  const item = crafts.find((entry) => entry.slug === slug)
  const info = contentSectionInfo[section]
  const { image, onError } = useImageSource(item ? getPostDetailImage(item) : undefined)
  if (!item)
    return (
      <div className="page-surface not-found">
        <span>🏝️</span>
        <h1>没有找到这篇内容</h1>
        <Link to={`/${section}`}>
          <ArrowLeft size={16} /> 返回{info.title}
        </Link>
      </div>
    )

  return (
    <article className={`collection-detail tutorial-detail tutorial-${section}`}>
      <Link className="back-link" to={`/${section}`}>
        <ArrowLeft size={16} /> 全部{info.title}
      </Link>
      {/* 详情左右分区：大图/图标预览与标题、日期、正文；窄屏排列交给 CSS。 */}
      <div className="collection-detail-grid">
        <div
          className={`collection-feature collection-${colorClass(item.color)} ${image ? 'has-image' : ''}`}
          style={colorStyle(item.color)}
        >
          {image ? (
            <Image
              onError={onError}
              src={image}
              alt={item.title}
              preview
              className="detail-preview-image"
            />
          ) : (
            <span>{item.icon}</span>
          )}
          <small>{'ISLAND DIY'}</small>
        </div>
        <div className="collection-info tutorial-info">
          <Tag size="small" variant="soft" color="app-green">
            {item.tag}
          </Tag>
          <h1>{item.title}</h1>
          <p className="collection-subtitle">{item.excerpt}</p>
          <div className="collection-meta">
            <span>
              <CalendarDays size={15} /> {item.publishedAt}
            </span>
            <span>
              <Clock3 size={15} /> {item.readingTime} 分钟阅读
            </span>
          </div>
          {/* 正文区域交给 MarkdownContent 解析，sourceDir 用于查找本栏目图片。 */}
          <div className="tutorial-content">
            <MarkdownContent sourceDir={item.sourceDir}>{item.content}</MarkdownContent>
          </div>
        </div>
      </div>
    </article>
  )
}
