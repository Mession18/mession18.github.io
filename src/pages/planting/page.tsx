import { useImageSource } from '../../hooks/useImageSource'
import { Link } from 'react-router-dom'
import { ContentMessageText } from '../../components/content-placeholder/ContentPlaceholder'
import { ContentListPage } from '../../components/content-list/ContentListPage'
import { useStand } from '../../hooks/useStand'
import { colorClass } from '../../shared/config'

import {
  formatDateRange,
  getPostDisplayImage,
  type Post,
  standAttributes,
} from '../../shared/utils'

import { planting } from './planting.data'
import { presentation } from './presentation.data'

export function PlantingPage() {
  return (
    <ContentListPage
      section="planting"
      items={planting}
      renderCard={(post) => <PlantingCard key={post.slug} post={post} />}
      renderEmpty={(key) => <EmptyPlantingCard key={key} />}
    />
  )
}

/** 种植单条卡片：组合随机底图、内容预览和详情链接；本页专属结构集中在这里修改。 */
export function PlantingCard({ post, basePath = '/planting' }: { post: Post; basePath?: string }) {
  const { image: previewImage, onError } = useImageSource(getPostDisplayImage(post))
  /** 根据内容标签抽取底图；useStand 保存随机种子，使普通重绘不会换图。 */
  const stand = useStand(presentation, post.tags)

  const plantingDates = formatDateRange(post.startDate, post.finalDate)
  return (
    <article
      {...standAttributes(stand)}
      className={`post planting-pot-card ${!previewImage ? `planting-missing-card ${colorClass(post.color)}` : ''}`}
    >
      <Link
        className="planting-pot"
        to={`${basePath}/${post.slug}`}
        aria-label={`阅读：${post.title}`}
      >
        <span className="planting-pot-base" aria-hidden="true" />
        {previewImage && (
          <img onError={onError} className="planting-preview" src={previewImage} alt={post.title} />
        )}
        {!previewImage && (
          <em className="planting-missing">
            <ContentMessageText section="planting" kind="missing" />
          </em>
        )}
        <strong>{post.title}</strong>
        {plantingDates && (
          <svg className="planting-dates" viewBox="0 0 360 360" aria-hidden="true">
            <defs>
              <path className="planting-date-arc" id={`planting-date-arc-${post.slug}`} />
            </defs>
            <text textAnchor="middle">
              <textPath href={`#planting-date-arc-${post.slug}`} startOffset="50%">
                {plantingDates}
              </textPath>
            </text>
          </svg>
        )}
      </Link>
    </article>
  )
}
/** 种植空位卡片：补齐未填满的网格，抽取空位底图与文案，不生成详情链接。 */
export function EmptyPlantingCard() {
  const stand = useStand(presentation, [], true)
  return (
    <article {...standAttributes(stand)} className="post planting-pot-card planting-empty-card">
      <div className="planting-pot">
        <span className="planting-pot-base" aria-hidden="true" />
        <div className="planting-empty-sign">
          <ContentMessageText section="planting" kind="empty" />
        </div>
      </div>
    </article>
  )
}
