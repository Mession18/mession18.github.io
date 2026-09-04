import { useImageSource } from '../../hooks/useImageSource'
import { Image, Tag } from 'animal-island-ui'
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { MarkdownContent } from '../../components/markdown/MarkdownContent'
import { colorClass, colorStyle, contentSectionInfo } from '../../shared/config'

import { getPostDetailImage } from '../../shared/utils'
import { travel } from './travel.data'

/** 旅行详情页：根据路由 slug 查找单条内容，显示大图、元信息和 Markdown；找不到时提供返回入口。 */
export function TravelDetailPage() {
  const section = 'travel' as const
  const { slug } = useParams()
  const item = travel.find((entry) => entry.slug === slug)
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
    <article className="article-page">
      <Link className="back-link" to={`/${section}`}>
        <ArrowLeft size={16} /> 全部{info.title}
      </Link>
      <header className={`article-header ${colorClass(item.color)}`} style={colorStyle(item.color)}>
        <span className="article-icon">{item.icon}</span>
        <Tag size="small" variant="soft" color="app-green">
          {item.tag}
        </Tag>
        <h1>{item.title}</h1>
        <p>{item.excerpt}</p>
        <div>
          <span>
            <CalendarDays size={15} /> {item.publishedAt}
          </span>
          <span>
            <Clock3 size={15} /> {item.readingTime} 分钟阅读
          </span>
        </div>
      </header>
      {image && (
        <figure className="article-feature-image">
          <Image
            onError={onError}
            src={image}
            alt={item.title}
            preview
            className="detail-preview-image"
          />
        </figure>
      )}
      <div className="article-body">
        <MarkdownContent sourceDir={item.sourceDir}>{item.content}</MarkdownContent>
      </div>
    </article>
  )
}
