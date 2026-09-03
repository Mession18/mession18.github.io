import { useState } from 'react'
import { IslandPagination } from '../components/IslandPagination'
import { EmptyRecipeCard, PostCard } from '../components/PostCard'
import { SectionIcon } from '../components/SectionIcon'
import { contentSectionInfo, sectionContent, type ContentSectionKey } from '../data/contentSections'

export function ContentSectionPage({ section }: { section: ContentSectionKey }) {
  const [page, setPage] = useState(1)
  const [recipeTag, setRecipeTag] = useState('all')
  const items = sectionContent[section]
  const info = contentSectionInfo[section]
  const pageSize = section === 'recipes' ? 9 : 30
  const recipeTags = [...new Set(items.flatMap((item) => item.tags))]
  const visibleItems =
    section === 'recipes' && recipeTag !== 'all'
      ? items.filter((item) => item.tags.includes(recipeTag))
      : items
  const total = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const pageItems = visibleItems.slice((page - 1) * pageSize, page * pageSize)
  const emptySlots = section === 'recipes' ? Math.max(0, pageSize - pageItems.length) : 0
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
      {section === 'recipes' && (
        <div className="museum-filters recipe-filters" aria-label="菜谱标签">
          {['all', ...recipeTags].map((tag) => (
            <button
              className={recipeTag === tag ? 'active' : ''}
              key={tag}
              onClick={() => {
                setRecipeTag(tag)
                setPage(1)
              }}
            >
              {tag === 'all' ? '全部菜品' : tag}
            </button>
          ))}
        </div>
      )}
      <section className="posts-library">
        <div className={`post-grid ${section === 'recipes' ? 'display-stand-grid' : ''}`}>
          {pageItems.map((item) => (
            <PostCard key={item.slug} post={item} basePath={`/${section}`} />
          ))}
          {section === 'recipes' &&
            Array.from({ length: emptySlots }, (_, index) => (
              <EmptyRecipeCard key={`recipe-empty-${page}-${index}`} />
            ))}
        </div>
        {visibleItems.length === 0 && <p className="empty-section">这一页还在等待第一篇内容。</p>}
        <IslandPagination page={page} total={total} onChange={setPage} />
      </section>
    </div>
  )
}
