import { Image, Tag } from 'animal-island-ui'
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { MarkdownContent } from '../components/MarkdownContent'
import { contentSectionInfo, sectionContent, type ContentSectionKey } from '../data/contentSections'
import { getPostDetailImage } from '../data/posts'

export function ContentDetailPage({ section }: { section: ContentSectionKey }) {
  const { slug } = useParams()
  const item = sectionContent[section].find((entry) => entry.slug === slug)
  const info = contentSectionInfo[section]
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
  const image = getPostDetailImage(item)
  return (
    <article className="article-page">
      <Link className="back-link" to={`/${section}`}>
        <ArrowLeft size={16} /> 全部{info.title}
      </Link>
      <header className={`article-header ${item.color}`}>
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
          <Image src={image} alt={item.title} preview className="detail-preview-image" />
        </figure>
      )}
      <div className="article-body">
        <MarkdownContent>{item.content}</MarkdownContent>
      </div>
    </article>
  )
}
