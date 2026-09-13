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
  getChildTags?: (tag: string) => readonly string[]
  matchesChildTag?: (item: Post, parent: string, child: string) => boolean
}

/** 四个展台栏目的共享标题、筛选与分页结构。 */
export function ContentListPage({
  section,
  items,
  renderCard,
  renderEmpty,
  extraTags = [],
  matchesTag = (item, tag) => item.tags.includes(tag),
  getChildTags,
  matchesChildTag = () => true,
}: Props) {
  const [page, setPage] = useState(1)
  const [activeTag, setActiveTag] = useState('all')
  const [activeChildTag, setActiveChildTag] = useState('all')
  const info = contentSectionInfo[section]
  const tags = [...new Set([...extraTags, ...items.flatMap((item) => item.tags)])]
  const childTags = activeTag === 'all' ? [] : (getChildTags?.(activeTag) ?? [])
  const visibleItems = items.filter(
    (item) =>
      (activeTag === 'all' || matchesTag(item, activeTag)) &&
      (activeChildTag === 'all' || matchesChildTag(item, activeTag, activeChildTag)),
  )
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
              setActiveChildTag('all')
              setPage(1)
            }}
          >
            {tag === 'all' ? allItemsLabel(section) : tag}
          </button>
        ))}
      </div>
      {childTags.length > 0 && (
        <div className="content-filters content-subfilters" aria-label={`${activeTag}省份`}>
          {['all', ...childTags].map((child) => (
            <button
              key={child}
              type="button"
              className={activeChildTag === child ? 'active' : ''}
              aria-pressed={activeChildTag === child}
              onClick={() => {
                setActiveChildTag(child)
                setPage(1)
              }}
            >
              {child === 'all' ? `全部${activeTag}` : child}
            </button>
          ))}
        </div>
      )}
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
