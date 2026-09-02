import { Tag } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPostPreviewImage, type Post } from '../data/posts'
import { colorClass, colorStyle } from '../data/colorPalette'

export function PostCard({ post, basePath = '/posts' }: { post: Post; basePath?: string }) {
  const previewImage = getPostPreviewImage(post)
  if (basePath === '/recipes') {
    return <article className={`post recipe-plate-card ${!previewImage ? `recipe-eaten-card ${colorClass(post.color)}` : ''}`}><Link className="recipe-plate" to={`${basePath}/${post.slug}`} aria-label={`查看：${post.title}`}>
      <img src="/images/recipe-plate-plain.png" alt="" />
      {!previewImage && <em className="recipe-eaten">被吃掉了</em>}
      <strong>{post.title}</strong>
      <svg viewBox="0 0 360 220" aria-hidden="true"><defs><path id={`recipe-arc-${post.slug}`} d="M 68 105 A 112 112 0 0 0 292 105" /></defs><text><textPath href={`#recipe-arc-${post.slug}`} startOffset="50%">于{post.publishedAt}制作</textPath></text></svg>
    </Link></article>
  }

  return (
    <article className="post">
      <Link
        className={`post-art ${colorClass(post.color)}`}
        style={colorStyle(post.color)}
        to={`${basePath}/${post.slug}`}
        aria-label={`阅读：${post.title}`}
      >
        {previewImage ? <img src={previewImage} alt={post.title} /> : <span>{post.icon}</span>}
        <time dateTime={post.publishedAt}>{post.date}</time>
      </Link>
      <div className="post-body">
        <Tag size="small" variant="soft" color="app-green" className="island-ui-tag">
          {post.tag}
        </Tag>
        <h3>
          <Link to={`${basePath}/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
        <Link to={`${basePath}/${post.slug}`}>
          阅读这封信 <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}

export function EmptyRecipeCard() {
  return <article className="post recipe-plate-card recipe-empty-card"><div className="recipe-empty-sign">正在研发新菜品</div></article>
}
