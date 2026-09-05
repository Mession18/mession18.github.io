import { useImageSource } from '../../hooks/useImageSource'
import { Link } from 'react-router-dom'
import { ContentMessageText } from '../../components/content-placeholder/ContentPlaceholder'
import { ContentListPage } from '../../components/content-list/ContentListPage'
import { useStand } from '../../hooks/useStand'
import { colorClass } from '../../shared/config'

import {
  splitDisplayDate,
  getPostDisplayImage,
  type Post,
  standAttributes,
} from '../../shared/utils'

import { crafts } from './crafts.data'
import { presentation } from './presentation.data'

export function CraftsPage() {
  const craftStatusTags = ['制作中', '制作完成']
  return (
    <ContentListPage
      section="crafts"
      items={crafts}
      extraTags={craftStatusTags}
      matchesTag={(post, tag) =>
        craftStatusTags.includes(tag)
          ? (post.finalDate ? '制作完成' : '制作中') === tag
          : post.tags.includes(tag)
      }
      renderCard={(post) => <CraftCard key={post.slug} post={post} />}
      renderEmpty={(key) => <EmptyCraftCard key={key} />}
    />
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
