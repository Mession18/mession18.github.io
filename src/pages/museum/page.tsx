import { useImageSource } from '../../hooks/useImageSource'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdaptivePreviewImage } from '../../components/adaptive-image/AdaptivePreviewImage'
import { ContentMessageText } from '../../components/content-placeholder/ContentPlaceholder'
import { IslandPagination } from '../../components/pagination/IslandPagination'
import { SectionIcon } from '../../components/section-icon/SectionIcon'
import { useStand } from '../../hooks/useStand'
import { colorClass, colorStyle } from '../../shared/config'
import { formatChineseDate, standAttributes } from '../../shared/utils'

import {
  collections,
  getCollectionDisplayImage,
  type CollectionCategory,
  type CollectionItem,
} from './museum.data'
import { MuseumFilters } from './MuseumFilters'
import { presentation } from './presentation.data'

/** 博物馆筛选值：all 显示全部，其余值匹配 category。 */
type Filter = 'all' | CollectionCategory

/** 博物馆列表页：读取栏目数据，管理筛选与分页，并用本文件的卡片组件展示当前页。 */
export function MuseumPage() {
  const [filter, setFilter] = useState<Filter>('all')
  /** 页码状态从 1 开始；筛选改变时必须重置，切片索引则从 0 开始。 */
  const [page, setPage] = useState(1)
  /** 先筛选再分页，保证页数和空位数量反映当前筛选结果。 */
  const visibleItems =
    filter === 'all' ? collections : collections.filter((item) => item.category === filter)
  const pageSize = 9
  /** 根据过滤后的条目数量计算页数，至少保留一页供空状态展示。 */
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const pageItems = visibleItems.slice((page - 1) * pageSize, page * pageSize)
  const emptySlots = Math.max(0, pageSize - pageItems.length)
  return (
    <div className="museum-page page-surface">
      <header className="page-heading museum-page-heading">
        <p className="eyebrow">ISLAND COLLECTION</p>
        <h1>
          <SectionIcon section="museum" />
          岛上的小小博物馆
        </h1>
        <p>收藏那些让心里亮起一盏小灯的东西。</p>
      </header>
      <MuseumFilters
        value={filter}
        onChange={(value) => {
          setFilter(value)
          setPage(1)
        }}
      />
      {/* 藏品网格：先放实际藏品，再补齐空位；列数与间距由栏目 CSS 控制。 */}
      <section className="collection-grid display-stand-grid" aria-live="polite">
        {pageItems.map((item) => (
          <CollectionCard key={item.slug} item={item} />
        ))}
        {Array.from({ length: emptySlots }, (_, index) => (
          <EmptyCollectionCard key={`empty-${page}-${index}`} />
        ))}
      </section>
      <IslandPagination page={page} total={totalPages} onChange={setPage} />
    </div>
  )
}

/** 博物馆单条卡片：组合随机底图、内容预览和详情链接；本页专属结构集中在这里修改。 */
export function CollectionCard({ item }: { item: CollectionItem }) {
  /** 根据内容标签抽取底图；useStand 保存随机种子，使普通重绘不会换图。 */
  const stand = useStand(presentation, [...item.tags, item.category])
  const { image: previewImage, onError } = useImageSource(getCollectionDisplayImage(item))
  const collectionDate = formatChineseDate(item.date)

  return (
    <article {...standAttributes(stand)} className="collection-card collection-exhibit">
      <div className="collection-display-space">
        <Link className="collection-polaroid" to={`/museum/${item.category}/${item.slug}`}>
          <span
            className={`collection-picture collection-${colorClass(item.color)}`}
            style={previewImage ? undefined : colorStyle(item.color)}
          >
            {previewImage ? (
              <AdaptivePreviewImage onError={onError} src={previewImage} alt={item.title} />
            ) : (
              <b className="collection-away">
                <ContentMessageText section="museum" kind="missing" />
              </b>
            )}
          </span>
        </Link>
      </div>
      <div className="collection-card-body collection-pedestal has-pedestal">
        {collectionDate && (
          <svg className="collection-exhibit-date" viewBox="0 0 360 90" aria-hidden="true">
            <defs>
              <path className="collection-date-arc" id={`collection-date-arc-${item.slug}`} />
            </defs>
            <text textAnchor="middle">
              <textPath href={`#collection-date-arc-${item.slug}`} startOffset="50%">
                于{collectionDate}收藏
              </textPath>
            </text>
          </svg>
        )}
        <div>
          <span>{item.year}</span>
          <span className="collection-rating">
            <Star size={12} fill="currentColor" /> {item.rating}
          </span>
        </div>
        <h2 className="collection-exhibit-name">
          <Link to={`/museum/${item.category}/${item.slug}`}>{item.title}</Link>
        </h2>
        <p className="collection-exhibit-description">{item.excerpt}</p>
      </div>
    </article>
  )
}

/** 博物馆空位卡片：补齐未填满的网格，抽取空位底图与文案，不生成详情链接。 */
export function EmptyCollectionCard() {
  const stand = useStand(presentation, [], true)
  return (
    <article
      {...standAttributes(stand)}
      className="collection-card collection-exhibit collection-empty"
      aria-label="待收藏展位"
    >
      <div className="collection-display-space">
        <div className="collection-empty-sign">
          <ContentMessageText section="museum" kind="empty" />
        </div>
      </div>
      <div className="collection-card-body collection-pedestal has-pedestal">
        <h2 className="collection-exhibit-name">待收藏</h2>
        <p className="collection-exhibit-description">这里正在等待下一件值得珍藏的东西。</p>
      </div>
    </article>
  )
}
