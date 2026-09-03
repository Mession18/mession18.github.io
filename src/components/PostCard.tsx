import { Tag } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPostDisplayImage, type Post } from '../data/posts'
import { colorClass, colorStyle } from '../data/colorPalette'
import { getContentMessage } from '../data/contentMessages'

export function PostCard({ post, basePath = '/posts' }: { post: Post; basePath?: string }) {
  const previewImage = getPostDisplayImage(post)
  if (basePath === '/travel') {
    const travelImage = previewImage
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
              <em>{getContentMessage('travel', 'missing', post.slug)}</em>
            )}
          </div>
          <div className="travel-card-message">
            <span className="travel-card-stamp" aria-hidden="true">
              {post.customIcon ?? ''}
            </span>
            <strong>{post.title}</strong>
            <p>{post.excerpt}</p>
            <time dateTime={post.publishedAt}>{post.publishedAt}</time>
            <span className="travel-card-lines" aria-hidden="true" />
          </div>
        </Link>
      </article>
    )
  }
  if (basePath === '/planting') {
    const plantingImage = previewImage
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
              {getContentMessage('planting', 'missing', post.slug)}
            </em>
          )}
          <strong>{post.title}</strong>
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
            <em className="recipe-eaten">{getContentMessage('recipes', 'missing', post.slug)}</em>
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

export function EmptyRecipeCard({ slotKey }: { slotKey: string }) {
  return (
    <article className="post recipe-plate-card recipe-empty-card">
      <div className="recipe-plate">
        <img src="/images/recipe-plate-plain.png" alt="" />
        <div className="recipe-empty-sign">{getContentMessage('recipes', 'empty', slotKey)}</div>
      </div>
    </article>
  )
}

export function EmptyPlantingCard({ slotKey }: { slotKey: string }) {
  return (
    <article className="post planting-pot-card planting-empty-card">
      <div className="planting-pot">
        <img src="/images/planting/flower-pot.png" alt="" />
        <div className="planting-empty-sign">{getContentMessage('planting', 'empty', slotKey)}</div>
      </div>
    </article>
  )
}

export function EmptyTravelCard({ slotKey }: { slotKey: string }) {
  return (
    <article className="post travel-postcard-card travel-empty-card">
      <div className="travel-card-postcard">
        <div className="travel-card-photo travel-card-photo-empty">
          {getContentMessage('travel', 'empty', slotKey)}
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
