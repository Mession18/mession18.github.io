import { Tag } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPostDisplayImage, type Post } from '../data/posts'
import { colorClass, colorStyle } from '../data/colorPalette'
import { ContentMessageText } from './ContentPlaceholder'
import { formatDateRange, splitDisplayDate } from '../data/dates'

export function PostCard({ post, basePath = '/posts' }: { post: Post; basePath?: string }) {
  const previewImage = getPostDisplayImage(post)
  if (basePath === '/travel') {
    const travelImage = previewImage
    const travelDates = formatDateRange(post.startDate, post.finalDate)
    return (
      <article className="post travel-postcard-card">
        <Link
          className="travel-card-postcard"
          to={`${basePath}/${post.slug}`}
          aria-label={`阅读：${post.title}`}
        >
          <div
            className={`travel-card-photo ${!travelImage ? `travel-card-photo-missing ${colorClass(post.color)}` : ''}`}
          >
            {travelImage ? (
              <img src={travelImage} alt={post.title} />
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
  if (basePath === '/planting') {
    const plantingImage = previewImage
    const plantingDates = formatDateRange(post.startDate, post.finalDate)
    return (
      <article
        className={`post planting-pot-card ${!plantingImage ? `planting-missing-card ${colorClass(post.color)}` : ''}`}
      >
        <Link
          className="planting-pot"
          to={`${basePath}/${post.slug}`}
          aria-label={`阅读：${post.title}`}
        >
          <img src="/images/planting/flower-pot.png" alt="" />
          {plantingImage && (
            <img className="planting-preview" src={plantingImage} alt={post.title} />
          )}
          {!plantingImage && (
            <em className="planting-missing">
              <ContentMessageText section="planting" kind="missing" />
            </em>
          )}
          <strong>{post.title}</strong>
          {plantingDates && (
            <svg className="planting-dates" viewBox="0 0 360 360" aria-hidden="true">
              <defs>
                <path id={`planting-date-arc-${post.slug}`} d="M 82 166 Q 180 184 278 166" />
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
  if (basePath === '/crafts') {
    const start = splitDisplayDate(post.startDate)
    const finish = splitDisplayDate(post.finalDate)
    return (
      <article className="post craft-workbench-card">
        <Link
          className="craft-workbench-display"
          to={`${basePath}/${post.slug}`}
          aria-label={`阅读：${post.title}`}
        >
          <img
            className="craft-workbench-base"
            src="/images/crafts/workbench_2.png"
            alt=""
          />
          <div className={`craft-art-frame ${!previewImage ? colorClass(post.color) : ''}`}>
            {previewImage ? (
              <img src={previewImage} alt={post.title} />
            ) : (
              <em>
                <ContentMessageText section="crafts" kind="missing" />
              </em>
            )}
          </div>
          <div className="craft-nameplate">
            <strong>{post.title}</strong>
          </div>
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
  if (basePath === '/recipes') {
    const recipeImage = previewImage
    return (
      <article
        className={`post recipe-plate-card ${!recipeImage ? `recipe-eaten-card ${colorClass(post.color)}` : ''}`}
      >
        <Link
          className="recipe-plate"
          to={`${basePath}/${post.slug}`}
          aria-label={`查看：${post.title}`}
        >
          <img src="/images/recipe-plate-plain.png" alt="" />
          {recipeImage && (
            <img
              className="recipe-dish-image"
              src={recipeImage}
              alt={post.title}
              onLoad={(event) => {
                if (event.currentTarget.naturalHeight > event.currentTarget.naturalWidth) {
                  event.currentTarget.classList.add('recipe-dish-portrait')
                }
              }}
            />
          )}
          {!recipeImage && (
            <em className="recipe-eaten">
              <ContentMessageText section="recipes" kind="missing" />
            </em>
          )}
          <strong>{post.title}</strong>
          <svg viewBox="0 0 360 220" aria-hidden="true">
            <defs>
              <path id={`recipe-arc-${post.slug}`} d="M 72 118 Q 180 150 288 118" />
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

  return (
    <article className="post">
      <Link
        className={`post-art ${colorClass(post.color)}`}
        style={colorStyle(post.color)}
        to={`${basePath}/${post.slug}`}
        aria-label={`阅读：${post.title}`}
      >
        {previewImage ? <img src={previewImage} alt={post.title} /> : <span>{post.icon}</span>}
        <time dateTime={post.publishedAt}>{post.date}</time>
      </Link>
      <div className="post-body">
        <Tag size="small" variant="soft" color="app-green" className="island-ui-tag">
          {post.tag}
        </Tag>
        <h3>
          <Link to={`${basePath}/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
        <Link to={`${basePath}/${post.slug}`}>
          阅读这封信 <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}

export function EmptyRecipeCard() {
  return (
    <article className="post recipe-plate-card recipe-empty-card">
      <div className="recipe-plate">
        <img src="/images/recipe-plate-plain.png" alt="" />
        <div className="recipe-empty-sign">
          <ContentMessageText section="recipes" kind="empty" />
        </div>
      </div>
    </article>
  )
}

export function EmptyPlantingCard() {
  return (
    <article className="post planting-pot-card planting-empty-card">
      <div className="planting-pot">
        <img src="/images/planting/flower-pot.png" alt="" />
        <div className="planting-empty-sign">
          <ContentMessageText section="planting" kind="empty" />
        </div>
      </div>
    </article>
  )
}

export function EmptyTravelCard() {
  return (
    <article className="post travel-postcard-card travel-empty-card">
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

export function EmptyCraftCard() {
  return (
    <article className="post craft-workbench-card craft-empty-card">
      <div className="craft-workbench-display">
        <img className="craft-workbench-base" src="/images/crafts/workbench_2.png" alt="" />
        <div className="craft-art-frame craft-empty-sign">
          <ContentMessageText section="crafts" kind="empty" />
        </div>
      </div>
    </article>
  )
}
