import { useState } from 'react'
import { IslandPagination } from '../components/IslandPagination'
import { PostCard } from '../components/PostCard'
import { SectionIcon } from '../components/SectionIcon'
import { contentSectionInfo, sectionContent, type ContentSectionKey } from '../data/contentSections'

export function ContentSectionPage({ section }: { section: ContentSectionKey }) {
  const [page, setPage] = useState(1)
  const items = sectionContent[section]
  const info = contentSectionInfo[section]
  const total = Math.max(1, Math.ceil(items.length / 30))
  return (
    <div className="page-surface">
      <header className="page-heading">
        <p className="eyebrow">{info.eyebrow}</p>
        <h1>
          <SectionIcon section={section} />
          {info.title}
        </h1>
        <p>{info.description}</p>
      </header>
      <section className="posts-library">
        <div className="post-grid">
          {items.slice((page - 1) * 30, page * 30).map((item) => (
            <PostCard key={item.slug} post={item} basePath={`/${section}`} />
          ))}
        </div>
        {items.length === 0 && <p className="empty-section">这一页还在等待第一篇内容。</p>}
        <IslandPagination page={page} total={total} onChange={setPage} />
      </section>
    </div>
  )
}
