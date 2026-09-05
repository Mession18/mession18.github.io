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

import { presentation } from './presentation.data'
import { travel } from './travel.data'

export function TravelPage() {
  return (
    <ContentListPage
      section="travel"
      items={travel}
      renderCard={(post) => <TravelCard key={post.slug} post={post} />}
      renderEmpty={(key) => <EmptyTravelCard key={key} />}
    />
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
