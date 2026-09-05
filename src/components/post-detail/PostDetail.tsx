import { Image, Tag } from 'animal-island-ui'
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useImageSource } from '../../hooks/useImageSource'
import { colorClass, colorStyle } from '../../shared/config'
import { getPostDetailImage, type Post } from '../../shared/utils'
import { MarkdownContent } from '../markdown/MarkdownContent'

type Props = {
  item?: Post
  basePath: string
  returnLabel: string
  notFoundReturnLabel?: string
  layout?: 'article' | 'tutorial'
  featureLabel?: string
  tagClassName?: string
  notFound?: { icon: string; title: string; description?: string }
  footer?: ReactNode
}

/** 普通 Markdown 内容共享的文章式与教程式详情结构。 */
export function PostDetail({
  item,
  basePath,
  returnLabel,
  notFoundReturnLabel = returnLabel,
  layout = 'article',
  featureLabel,
  tagClassName,
  notFound = { icon: '🏝️', title: '没有找到这篇内容' },
  footer,
}: Props) {
  const { image, onError } = useImageSource(item ? getPostDetailImage(item) : undefined)
  if (!item)
    return (
      <div className="page-surface not-found">
        <span>{notFound.icon}</span>
        <h1>{notFound.title}</h1>
        {notFound.description && <p>{notFound.description}</p>}
        <Link to={basePath}>
          <ArrowLeft size={16} /> {notFoundReturnLabel}
        </Link>
      </div>
    )

  const imageNode = image ? (
    <Image
      onError={onError}
      src={image}
      alt={item.title}
      preview
      className="detail-preview-image"
    />
  ) : (
    <span>{item.icon}</span>
  )
  const metadata = (
    <>
      <span>
        <CalendarDays size={15} /> {item.publishedAt}
      </span>
      <span>
        <Clock3 size={15} /> {item.readingTime} 分钟阅读
      </span>
    </>
  )

  if (layout === 'tutorial')
    return (
      <article className={`collection-detail tutorial-detail tutorial-${basePath.slice(1)}`}>
        <Link className="back-link" to={basePath}>
          <ArrowLeft size={16} /> {returnLabel}
        </Link>
        <div className="collection-detail-grid">
          <div
            className={`collection-feature collection-${colorClass(item.color)} ${image ? 'has-image' : ''}`}
            style={colorStyle(item.color)}
          >
            {imageNode}
            <small>{featureLabel}</small>
          </div>
          <div className="collection-info tutorial-info">
            <Tag size="small" variant="soft" color="app-green">
              {item.tag}
            </Tag>
            <h1>{item.title}</h1>
            <p className="collection-subtitle">{item.excerpt}</p>
            <div className="collection-meta">{metadata}</div>
            <div className="tutorial-content">
              <MarkdownContent sourceDir={item.sourceDir}>{item.content}</MarkdownContent>
            </div>
          </div>
        </div>
      </article>
    )

  return (
    <article className="article-page">
      <Link className="back-link" to={basePath}>
        <ArrowLeft size={16} /> {returnLabel}
      </Link>
      <header className={`article-header ${colorClass(item.color)}`} style={colorStyle(item.color)}>
        <span className="article-icon">{item.icon}</span>
        <Tag size="small" variant="soft" color="app-green" className={tagClassName}>
          {item.tag}
        </Tag>
        <h1>{item.title}</h1>
        <p>{item.excerpt}</p>
        <div>{metadata}</div>
      </header>
      {image && <figure className="article-feature-image">{imageNode}</figure>}
      <div className="article-body">
        <MarkdownContent sourceDir={item.sourceDir}>{item.content}</MarkdownContent>
      </div>
      {footer}
    </article>
  )
}
