import { useImageSource } from '../../hooks/useImageSource'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ContentMessageText } from '../../components/content-placeholder/ContentPlaceholder'
import { IslandPagination } from '../../components/pagination/IslandPagination'
import { SectionIcon } from '../../components/section-icon/SectionIcon'
import { useStand } from '../../hooks/useStand'
import { colorClass, allItemsLabel, contentSectionInfo, displayPageSize } from '../../shared/config'

import {
  formatDateRange,
  getPostDisplayImage,
  type Post,
  standAttributes,
} from '../../shared/utils'

import { presentation } from './presentation.data'
import { travel } from './travel.data'

/** 旅行列表页：读取栏目数据，管理筛选与分页，并用本文件的卡片组件展示当前页。 */
export function TravelPage() {
  const section = 'travel' as const
  /** 页码状态从 1 开始；筛选改变时必须重置，切片索引则从 0 开始。 */
  const [page, setPage] = useState(1)
  /** 当前标签状态；all 是界面保留值，表示不按标签过滤。 */
  const [activeTag, setActiveTag] = useState('all')
  const items = travel
  const info = contentSectionInfo[section]
  const pageSize = displayPageSize
  /** 把内容中的标签去重，生成本页按钮；新增标签在 Markdown 填写即可。 */
  const tags = [...new Set(items.flatMap((item) => item.tags))]
  /** 先筛选再分页，保证页数和空位数量反映当前筛选结果。 */
  const visibleItems =
    activeTag === 'all' ? items : items.filter((item) => item.tags.includes(activeTag))
  /** 计算总页数与当前页切片，并补齐剩余空位；空列表仍保留第 1 页。 */
  const total = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const pageItems = visibleItems.slice((page - 1) * pageSize, page * pageSize)
  const emptySlots = Math.max(0, pageSize - pageItems.length)
  return (
    <div className={`page-surface ${section}-page`}>
      {/* 列表标题区：英文眉题、栏目标题和简介；通用栏目文案来自 shared/config.ts。 */}
      <header className="page-heading">
        <p className="eyebrow">{info.eyebrow}</p>
        <h1>
          <SectionIcon section={section} />
          {info.title}
        </h1>
        <p>{info.description}</p>
      </header>
      {/* 本页标签按钮：标签来自内容；切换时回到第 1 页，防止停留在不存在的页码。 */}
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
      {/* 内容区：渲染筛选后的当前页卡片、空位和分页；单卡片结构在下方函数中。 */}
      <section className="posts-library">
        <div className="post-grid display-stand-grid">
          {pageItems.map((item) => (
            <TravelCard key={item.slug} post={item} basePath={`/${section}`} />
          ))}

          {Array.from({ length: emptySlots }, (_, index) => (
            <EmptyTravelCard key={`travel-empty-${page}-${index}`} />
          ))}
        </div>
        {visibleItems.length === 0 && <p className="empty-section">这一页还在等待第一篇内容。</p>}
        <IslandPagination page={page} total={total} onChange={setPage} />
      </section>
    </div>
  )
}

/** 旅行单条卡片：组合随机底图、内容预览和详情链接；本页专属结构集中在这里修改。 */
export function TravelCard({ post, basePath = '/travel' }: { post: Post; basePath?: string }) {
  const { image: previewImage, onError } = useImageSource(getPostDisplayImage(post))
  /** 根据内容标签抽取底图；useStand 保存随机种子，使普通重绘不会换图。 */
  const stand = useStand(presentation, post.tags)

  const travelDates = formatDateRange(post.startDate, post.finalDate)
  return (
    <article {...standAttributes(stand)} className="post travel-postcard-card">
      <Link
        className="travel-card-postcard"
        to={`${basePath}/${post.slug}`}
        aria-label={`阅读：${post.title}`}
      >
        <div
          className={`travel-card-photo ${!previewImage ? `travel-card-photo-missing ${colorClass(post.color)}` : ''}`}
        >
          {previewImage ? (
            <img onError={onError} src={previewImage} alt={post.title} />
          ) : (
            <em>
              <ContentMessageText section="travel" kind="missing" />
            </em>
          )}
        </div>
        <div className="travel-card-message">
          <span className="travel-card-stamp" aria-hidden="true">
            {post.customIcon ?? ''}
          </span>
          <strong>{post.title}</strong>
          <p>{post.excerpt}</p>
          {travelDates && <time>{travelDates}</time>}
          <span className="travel-card-lines" aria-hidden="true" />
        </div>
      </Link>
    </article>
  )
}
/** 旅行空位卡片：补齐未填满的网格，抽取空位底图与文案，不生成详情链接。 */
export function EmptyTravelCard() {
  const stand = useStand(presentation, [], true)
  return (
    <article {...standAttributes(stand)} className="post travel-postcard-card travel-empty-card">
      <div className="travel-card-postcard">
        <div className="travel-card-photo travel-card-photo-empty">
          <ContentMessageText section="travel" kind="empty" />
        </div>
        <div className="travel-card-message">
          <span className="travel-card-stamp" aria-hidden="true">
            ?
          </span>
          <strong>目的地待定</strong>
          <span className="travel-card-lines" aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}
