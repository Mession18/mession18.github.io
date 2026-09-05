import { useState, type ReactNode } from 'react'
import { IslandPagination } from '../pagination/IslandPagination'
import { SectionIcon } from '../section-icon/SectionIcon'
import {
  allItemsLabel,
  contentSectionInfo,
  displayPageSize,
  type ContentSectionKey,
} from '../../shared/config'
import type { Post } from '../../shared/utils'

type Props = {
  section: ContentSectionKey
  items: readonly Post[]
  renderCard: (item: Post) => ReactNode
  renderEmpty: (key: string) => ReactNode
  extraTags?: readonly string[]
  matchesTag?: (item: Post, tag: string) => boolean
}

/** 四个展台栏目的共享标题、筛选与分页结构。 */
export function ContentListPage({
  section,
  items,
  renderCard,
  renderEmpty,
  extraTags = [],
  matchesTag = (item, tag) => item.tags.includes(tag),
}: Props) {
  const [page, setPage] = useState(1)
  const [activeTag, setActiveTag] = useState('all')
  const info = contentSectionInfo[section]
  const tags = [...new Set([...extraTags, ...items.flatMap((item) => item.tags)])]
  const visibleItems =
    activeTag === 'all' ? items : items.filter((item) => matchesTag(item, activeTag))
  const total = Math.max(1, Math.ceil(visibleItems.length / displayPageSize))
  const pageItems = visibleItems.slice((page - 1) * displayPageSize, page * displayPageSize)
  const emptySlots = displayPageSize - pageItems.length

  return (
    <div className={`page-surface ${section}-page`}>
      <header className="page-heading">
        <p className="eyebrow">{info.eyebrow}</p>
        <h1>
          <SectionIcon section={section} />
          {info.title}
        </h1>
        <p>{info.description}</p>
      </header>
      <div className="content-filters" aria-label={`${info.title}标签`}>
        {['all', ...tags].map((tag) => (
          <button
            key={tag}
            type="button"
            className={activeTag === tag ? 'active' : ''}
            aria-pressed={activeTag === tag}
            onClick={() => {
              setActiveTag(tag)
              setPage(1)
            }}
          >
            {tag === 'all' ? allItemsLabel(section) : tag}
          </button>
        ))}
      </div>
      <section className="posts-library">
        <div className="post-grid display-stand-grid">
          {pageItems.map(renderCard)}
          {Array.from({ length: emptySlots }, (_, index) =>
            renderEmpty(`${section}-empty-${page}-${index}`),
          )}
        </div>
        {visibleItems.length === 0 && <p className="empty-section">这一页还在等待第一篇内容。</p>}
        <IslandPagination page={page} total={total} onChange={setPage} />
      </section>
    </div>
  )
}
