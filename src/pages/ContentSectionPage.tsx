import { useState } from 'react'
import { IslandPagination } from '../components/IslandPagination'
import {
  EmptyPlantingCard,
  EmptyRecipeCard,
  EmptyTravelCard,
  EmptyCraftCard,
  PostCard,
} from '../components/PostCard'
import { SectionIcon } from '../components/SectionIcon'
import {
  allItemsLabel,
  contentSectionInfo,
  displayStandSections,
  filterableSections,
  sectionContent,
  sectionPageSize,
  type ContentSectionKey,
} from '../data/contentSections'

export function ContentSectionPage({ section }: { section: ContentSectionKey }) {
  const [page, setPage] = useState(1)
  const [activeTag, setActiveTag] = useState('all')
  const items = sectionContent[section]
  const info = contentSectionInfo[section]
  const pageSize = sectionPageSize(section)
  const markdownTags = [...new Set(items.flatMap((item) => item.tags))]
  const craftStatusTags = ['制作中', '制作完成']
  const tags =
    section === 'crafts'
      ? [...craftStatusTags, ...markdownTags.filter((tag) => !craftStatusTags.includes(tag))]
      : markdownTags
  const visibleItems =
    section === 'crafts' && craftStatusTags.includes(activeTag)
      ? items.filter((item) => (item.finalDate ? '制作完成' : '制作中') === activeTag)
      : filterableSections.has(section) && activeTag !== 'all'
        ? items.filter((item) => item.tags.includes(activeTag))
        : items
  const total = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const pageItems = visibleItems.slice((page - 1) * pageSize, page * pageSize)
  const emptySlots = displayStandSections.has(section)
    ? Math.max(0, pageSize - pageItems.length)
    : 0
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
      {filterableSections.has(section) && (
        <div className="museum-filters recipe-filters" aria-label={`${info.title}标签`}>
          {['all', ...tags].map((tag) => (
            <button
              className={activeTag === tag ? 'active' : ''}
              key={tag}
              onClick={() => {
                setActiveTag(tag)
                setPage(1)
              }}
            >
              {tag === 'all' ? allItemsLabel(section) : tag}
            </button>
          ))}
        </div>
      )}
      <section className="posts-library">
        <div
          className={`post-grid ${displayStandSections.has(section) ? 'display-stand-grid' : ''}`}
        >
          {pageItems.map((item) => (
            <PostCard key={item.slug} post={item} basePath={`/${section}`} />
          ))}
          {section === 'recipes' &&
            Array.from({ length: emptySlots }, (_, index) => (
              <EmptyRecipeCard key={`recipe-empty-${page}-${index}`} />
            ))}
          {section === 'planting' &&
            Array.from({ length: emptySlots }, (_, index) => (
              <EmptyPlantingCard key={`planting-empty-${page}-${index}`} />
            ))}
          {section === 'travel' &&
            Array.from({ length: emptySlots }, (_, index) => (
              <EmptyTravelCard key={`travel-empty-${page}-${index}`} />
            ))}
          {section === 'crafts' &&
            Array.from({ length: emptySlots }, (_, index) => (
              <EmptyCraftCard key={`craft-empty-${page}-${index}`} />
            ))}
        </div>
        {visibleItems.length === 0 && <p className="empty-section">这一页还在等待第一篇内容。</p>}
        <IslandPagination page={page} total={total} onChange={setPage} />
      </section>
    </div>
  )
}
