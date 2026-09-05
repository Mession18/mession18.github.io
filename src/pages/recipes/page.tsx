import { useImageSource } from '../../hooks/useImageSource'
import { Link } from 'react-router-dom'
import { AdaptivePreviewImage } from '../../components/adaptive-image/AdaptivePreviewImage'
import { ContentMessageText } from '../../components/content-placeholder/ContentPlaceholder'
import { ContentListPage } from '../../components/content-list/ContentListPage'
import { useStand } from '../../hooks/useStand'
import { colorClass } from '../../shared/config'

import { getPostDisplayImage, type Post, standAttributes } from '../../shared/utils'

import { presentation } from './presentation.data'
import { recipes } from './recipes.data'

export function RecipesPage() {
  return (
    <ContentListPage
      section="recipes"
      items={recipes}
      renderCard={(post) => <RecipeCard key={post.slug} post={post} />}
      renderEmpty={(key) => <EmptyRecipeCard key={key} />}
    />
  )
}

/** 菜谱单条卡片：组合随机底图、内容预览和详情链接；本页专属结构集中在这里修改。 */
export function RecipeCard({ post, basePath = '/recipes' }: { post: Post; basePath?: string }) {
  const { image: previewImage, onError } = useImageSource(getPostDisplayImage(post))
  /** 根据内容标签抽取底图；useStand 保存随机种子，使普通重绘不会换图。 */
  const stand = useStand(presentation, post.tags)

  return (
    <article
      {...standAttributes(stand)}
      className={`post recipe-plate-card ${!previewImage ? `recipe-eaten-card ${colorClass(post.color)}` : ''}`}
    >
      <Link
        className="recipe-plate"
        to={`${basePath}/${post.slug}`}
        aria-label={`查看：${post.title}`}
      >
        <span className="recipe-plate-base" aria-hidden="true" />
        {previewImage && (
          <AdaptivePreviewImage
            onError={onError}
            className="recipe-dish-image"
            src={previewImage}
            alt={post.title}
          />
        )}
        {!previewImage && (
          <em className="recipe-eaten">
            <ContentMessageText section="recipes" kind="missing" />
          </em>
        )}
        <strong>{post.title}</strong>
        <svg viewBox="0 0 360 220" aria-hidden="true">
          <defs>
            <path className="recipe-date-arc" id={`recipe-arc-${post.slug}`} />
          </defs>
          <text textAnchor="middle">
            <textPath href={`#recipe-arc-${post.slug}`} startOffset="50%">
              于{post.publishedAt}制作
            </textPath>
          </text>
        </svg>
      </Link>
    </article>
  )
}
/** 菜谱空位卡片：补齐未填满的网格，抽取空位底图与文案，不生成详情链接。 */
export function EmptyRecipeCard() {
  const stand = useStand(presentation, [], true)
  return (
    <article {...standAttributes(stand)} className="post recipe-plate-card recipe-empty-card">
      <div className="recipe-plate">
        <span className="recipe-plate-base" aria-hidden="true" />
        <div className="recipe-empty-sign">
          <ContentMessageText section="recipes" kind="empty" />
        </div>
      </div>
    </article>
  )
}
