import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Link, useParams } from 'react-router-dom'
import { getPostDetailImage, posts } from '../data/posts'

export function PostDetailPage() {
  const { slug } = useParams()
  const post = posts.find((item) => item.slug === slug)
  if (!post)
    return (
      <div className="page-surface not-found">
        <span>🌊</span>
        <h1>这封信漂远了</h1>
        <p>没有找到你想阅读的文章。</p>
        <Link to="/posts">
          <ArrowLeft size={16} /> 返回日志
        </Link>
      </div>
    )
  const detailImage = getPostDetailImage(post)

  return (
    <article className="article-page">
      <Link className="back-link" to="/posts">
        <ArrowLeft size={16} /> 全部日志
      </Link>
      <header className={`article-header ${post.color}`}>
        <span className="article-icon">{post.icon}</span>
        <span className="tag">{post.tag}</span>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <div>
          <span>
            <CalendarDays size={15} /> {post.publishedAt}
          </span>
          <span>
            <Clock3 size={15} /> {post.readingTime} 分钟阅读
          </span>
        </div>
      </header>
      {detailImage && (
        <figure className="article-feature-image">
          <img src={detailImage} alt={post.title} />
        </figure>
      )}
      <div className="article-body">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      <footer className="article-ending">
        <span>END OF LETTER</span>
        <p>谢谢你读到这里，愿今天也有一件小小的好事。</p>
        <Link to="/posts">继续读岛上的信</Link>
      </footer>
    </article>
  )
}
