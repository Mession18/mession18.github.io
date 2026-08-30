import { Tag } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPostPreviewImage, type Post } from '../data/posts'

export function PostCard({ post, basePath = '/posts' }: { post: Post; basePath?: string }) {
  const previewImage = getPostPreviewImage(post)

  return (
    <article className="post">
      <Link
        className={`post-art ${post.color}`}
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
