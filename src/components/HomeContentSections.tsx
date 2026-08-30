import { Icon } from 'animal-island-ui'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../data/contentSections'
import { getPostPreviewImage, type Post } from '../data/posts'

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function ContentImage({ item }: { item: Post }) {
  const image = getPostPreviewImage(item)
  return image ? <img src={image} alt="" /> : <span>{item.icon}</span>
}

export function RecipeHomeSection() {
  const recipes = sectionContent.recipes
  const [choices, setChoices] = useState(() => shuffled(recipes).slice(0, 3))
  const refresh = () => setChoices(shuffled(recipes).slice(0, 3))
  return (
    <section className="home-recipes home-content-section">
      <div className="home-content-inner">
        <div className="home-content-heading recipe-heading">
          <span className="home-content-icon">
            <img src="/images/nav/cooking-recipe.png" alt="" />
          </span>
          <div>
            <p className="eyebrow">TODAY'S MENU</p>
            <h2>今天吃什么？</h2>
            <p>从岛上的菜谱中随机挑三样，不喜欢就再换一组。</p>
          </div>
          <button type="button" onClick={refresh} disabled={!recipes.length}>
            <RefreshCw size={16} /> 换一组
          </button>
        </div>
        <div className="recipe-choices">
          {choices.map((item) => (
            <Link to={`/recipes/${item.slug}`} key={item.slug}>
              <ContentImage item={item} />
              <strong>{item.title}</strong>
            </Link>
          ))}
        </div>
        <Link className="home-content-more" to="/recipes">
          查看全部菜谱 <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}

export function CraftHomeSection() {
  const crafts = sectionContent.crafts.slice(0, 3)
  return (
    <section className="home-crafts home-content-section">
      <div className="home-content-inner craft-workbench">
        <div className="craft-copy">
          <Icon name="icon-diy" size={62} />
          <p className="eyebrow">TODAY'S WORKBENCH</p>
          <h2>岛民手作台</h2>
          <p>今天也把一点小灵感，做成可以留下来的东西。</p>
          <Link to="/crafts">
            进入工坊 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="craft-board">
          {crafts.map((item, index) => (
            <Link
              to={`/crafts/${item.slug}`}
              key={item.slug}
              className={`craft-note note-${index + 1}`}
            >
              <ContentImage item={item} />
              <span>
                <small>{item.tag}</small>
                <strong>{item.title}</strong>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TravelHomeSection() {
  const travel = sectionContent.travel
  const [index, setIndex] = useState(0)
  const item = travel[index % Math.max(travel.length, 1)]
  return (
    <section className="home-travel home-content-section">
      <div className="home-content-inner travel-desk">
        <div className="travel-postcard">
          {item && (
            <>
              <div className="travel-photo">
                <ContentImage item={item} />
              </div>
              <div className="travel-message">
                <Icon name="icon-miles" size={42} />
                <small>POSTCARD FROM THE ISLAND</small>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
                <Link to={`/travel/${item.slug}`}>
                  打开明信片 <ArrowRight size={15} />
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="travel-controls">
          <span>下一站去哪里？</span>
          <button
            type="button"
            onClick={() => setIndex((value) => value + 1)}
            disabled={travel.length < 2}
          >
            <RefreshCw size={16} /> 换个目的地
          </button>
          <Link to="/travel">全部旅行</Link>
        </div>
      </div>
    </section>
  )
}

export function PlantingHomeSection() {
  const flowers = sectionContent.planting
  const today = useMemo(
    () =>
      flowers.length ? flowers[Math.floor(Date.now() / 86400000) % flowers.length] : undefined,
    [flowers],
  )
  return (
    <section className="home-planting home-content-section">
      <div className="home-content-inner flower-garden">
        <div className="flower-title">
          <img src="/images/nav/planting-073.png" alt="" />
          <p className="eyebrow">FLOWER OF THE DAY</p>
          <h2>今日小花</h2>
          <p>每天认识一位花园里的新朋友。</p>
        </div>
        {today && (
          <Link className="flower-feature" to={`/planting/${today.slug}`}>
            <div>
              <ContentImage item={today} />
            </div>
            <span>
              <small>{today.tag}</small>
              <strong>{today.title}</strong>
              <em>{today.excerpt}</em>
              <b>
                查看种植笔记 <ArrowRight size={15} />
              </b>
            </span>
          </Link>
        )}
        <Link className="garden-link" to="/planting">
          走进岛民花园 <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
