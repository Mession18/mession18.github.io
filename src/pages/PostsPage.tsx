import { useState } from 'react'
import { PostCard } from '../components/PostCard'
import { IslandPagination } from '../components/IslandPagination'
import { SectionIcon } from '../components/SectionIcon'
import { posts } from '../data/posts'

export function PostsPage() {
  const [page, setPage] = useState(1)
  const [activeTag, setActiveTag] = useState('all')
  const tags = [...new Set(posts.flatMap((post) => post.tags))]
  const filteredPosts =
    activeTag === 'all' ? posts : posts.filter((post) => post.tags.includes(activeTag))
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / 30))
  const visiblePosts = filteredPosts.slice((page - 1) * 30, page * 30)
  return (
    <div className="page-surface posts-page">
      <header className="page-heading">
        <p className="eyebrow">ALL ISLAND LETTERS</p>
        <h1>
          <SectionIcon section="posts" />
          全部文章
        </h1>
        <p>把日子折成信纸，慢慢寄给未来的自己。</p>
      </header>
      <div className="content-filters" aria-label="文章标签">
        {['all', ...tags].map((tag) => (
          <button
            className={activeTag === tag ? 'active' : ''}
            key={tag}
            onClick={() => {
              setActiveTag(tag)
              setPage(1)
            }}
          >
            {tag === 'all' ? '全部文章' : tag}
          </button>
        ))}
      </div>
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
