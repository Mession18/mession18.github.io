import { useImageSource } from '../../hooks/useImageSource'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ContentMessageText } from '../../components/content-placeholder/ContentPlaceholder'
import { IslandPagination } from '../../components/pagination/IslandPagination'
import { SectionIcon } from '../../components/section-icon/SectionIcon'
import { useStand } from '../../hooks/useStand'
import { colorClass, allItemsLabel, contentSectionInfo, displayPageSize } from '../../shared/config'

import {
  splitDisplayDate,
  getPostDisplayImage,
  type Post,
  standAttributes,
} from '../../shared/utils'

import { crafts } from './crafts.data'
import { presentation } from './presentation.data'

/** 手工列表页：读取栏目数据，管理筛选与分页，并用本文件的卡片组件展示当前页。 */
export function CraftsPage() {
  const section = 'crafts' as const
  /** 页码状态从 1 开始；筛选改变时必须重置，切片索引则从 0 开始。 */
  const [page, setPage] = useState(1)
  /** 当前标签状态；all 是界面保留值，表示不按标签过滤。 */
  const [activeTag, setActiveTag] = useState('all')
  const items = crafts
  const info = contentSectionInfo[section]
  const pageSize = displayPageSize
  /** 收集 Markdown 标签并去重；制作状态标签在下面单独补入。 */
  const markdownTags = [...new Set(items.flatMap((item) => item.tags))]
  /** 手工状态由 finalDate 是否存在决定，不需要在 Markdown 重复填写。 */
  const craftStatusTags = ['制作中', '制作完成']
  /** 把内容中的标签去重，生成本页按钮；新增标签在 Markdown 填写即可。 */
  const tags = [...craftStatusTags, ...markdownTags.filter((tag) => !craftStatusTags.includes(tag))]
  /** 先筛选再分页，保证页数和空位数量反映当前筛选结果。 */
  const visibleItems = items.filter((item) => {
    if (activeTag === 'all') return true
    if (craftStatusTags.includes(activeTag)) {
      return (item.finalDate ? '制作完成' : '制作中') === activeTag
    }
    return item.tags.includes(activeTag)
  })
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
            <CraftCard key={item.slug} post={item} basePath={`/${section}`} />
          ))}

          {Array.from({ length: emptySlots }, (_, index) => (
            <EmptyCraftCard key={`craft-empty-${page}-${index}`} />
          ))}
        </div>
        {visibleItems.length === 0 && <p className="empty-section">这一页还在等待第一篇内容。</p>}
        <IslandPagination page={page} total={total} onChange={setPage} />
      </section>
    </div>
  )
}

/** 手工单条卡片：组合随机底图、内容预览和详情链接；本页专属结构集中在这里修改。 */
export function CraftCard({ post, basePath = '/crafts' }: { post: Post; basePath?: string }) {
  const { image: previewImage, onError } = useImageSource(getPostDisplayImage(post))
  /** 根据内容标签抽取底图；useStand 保存随机种子，使普通重绘不会换图。 */
  const stand = useStand(presentation, [...post.tags, post.finalDate ? '制作完成' : '制作中'])

  /** 把开始和结束日期拆成台历需要的年份与月日；没有完工日期则不显示完工台历。 */
  const start = splitDisplayDate(post.startDate)
  const finish = splitDisplayDate(post.finalDate)
  return (
    <article {...standAttributes(stand)} className="post craft-workbench-card">
      <Link
        className="craft-workbench-display"
        to={`${basePath}/${post.slug}`}
        aria-label={`阅读：${post.title}`}
      >
        {/* 工作台底图层，读取卡片上的 --stand-image；透明 PNG 直接显示。 */}
        <span className="craft-workbench-base" aria-hidden="true" />
        <div className={`craft-art-frame ${!previewImage ? colorClass(post.color) : ''}`}>
          {previewImage ? (
            <img onError={onError} src={previewImage} alt={post.title} />
          ) : (
            <em>
              <ContentMessageText section="crafts" kind="missing" />
            </em>
          )}
        </div>
        {/* 铭牌显示作品标题；位置和字号在本栏目 styles.css 调整。 */}
        <div className="craft-nameplate">
          <strong>{post.title}</strong>
        </div>
        {/* 蓝图区域显示 Markdown 摘要 excerpt，需与底图留白位置对齐。 */}
        <p className="craft-blueprint-description">{post.excerpt}</p>
        {start && (
          <time className="craft-date craft-start-date" dateTime={post.startDate}>
            <b>{start.year}</b>
            <span>{start.monthDay}</span>
            <em>开工</em>
          </time>
        )}
        {finish && (
          <time className="craft-date craft-finish-date" dateTime={post.finalDate}>
            <b>{finish.year}</b>
            <span>{finish.monthDay}</span>
            <em>完工</em>
          </time>
        )}
      </Link>
    </article>
  )
}
/** 手工空位卡片：补齐未填满的网格，抽取空位底图与文案，不生成详情链接。 */
export function EmptyCraftCard() {
  const stand = useStand(presentation, [], true)
  return (
    <article {...standAttributes(stand)} className="post craft-workbench-card craft-empty-card">
      <div className="craft-workbench-display">
        <span className="craft-workbench-base" aria-hidden="true" />
        <div className="craft-art-frame craft-empty-sign">
          <ContentMessageText section="crafts" kind="empty" />
        </div>
      </div>
    </article>
  )
}
