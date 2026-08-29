import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Post } from '../data/posts'

export function PostCard({ post }: { post: Post }) {
  return <article className="post"><Link className={`post-art ${post.color}`} to={`/posts/${post.slug}`} aria-label={`阅读：${post.title}`}><span>{post.icon}</span><time dateTime={post.publishedAt}>{post.date}</time></Link><div className="post-body"><span className="tag">{post.tag}</span><h3><Link to={`/posts/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><Link to={`/posts/${post.slug}`}>阅读这封信 <ArrowRight size={15} /></Link></div></article>
}
