import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { posts } from '../data/posts'
import { PostCard } from './PostCard'

export function Journal() {
  return <section className="journal section" id="journal"><div className="section-heading"><div><p className="eyebrow">RECENT STORIES</p><h2>最近的岛民日志</h2></div><Link to="/posts">查看全部 <ArrowRight size={16} /></Link></div><div className="post-grid">{posts.slice(0, 3).map((post) => <PostCard key={post.slug} post={post} />)}</div></section>
}
