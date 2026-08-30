import { useState } from 'react'
import { PostCard } from '../components/PostCard'
import { IslandPagination } from '../components/IslandPagination'
import { posts } from '../data/posts'

export function PostsPage() {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(posts.length / 30))
  const visiblePosts = posts.slice((page - 1) * 30, page * 30)
  return (
    <div className="page-surface">
      <header className="page-heading">
        <p className="eyebrow">ALL ISLAND LETTERS</p>
        <h1>全部岛民日志</h1>
        <p>把日子折成信纸，慢慢寄给未来的自己。</p>
      </header>
      <section className="posts-library" aria-label="全部文章">
        <div className="post-grid">
          {visiblePosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        <IslandPagination page={page} total={totalPages} onChange={setPage} />
      </section>
    </div>
  )
}
