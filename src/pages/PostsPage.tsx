import { PostCard } from '../components/PostCard'
import { posts } from '../data/posts'

export function PostsPage() {
  return <div className="page-surface"><header className="page-heading"><p className="eyebrow">ALL ISLAND LETTERS</p><h1>全部岛民日志</h1><p>把日子折成信纸，慢慢寄给未来的自己。</p></header><section className="posts-library" aria-label="全部文章"><div className="post-grid">{posts.map((post) => <PostCard key={post.slug} post={post} />)}</div></section></div>
}
