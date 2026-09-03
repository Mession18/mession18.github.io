import { Icon } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../data/contentSections'
import { getPostDisplayImage, type Post } from '../data/posts'
import { ContentPlaceholder } from './ContentPlaceholder'

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

const currentDayNumber = Math.floor(Date.now() / 86400000)

function animateItemRefresh(button: HTMLButtonElement, action: () => void) {
  button
    .querySelector('img')
    ?.animate(
      [
        { transform: 'rotate(0deg) scale(1)' },
        { transform: 'rotate(-12deg) scale(1.08)' },
        { transform: 'rotate(11deg) scale(1.08)' },
        { transform: 'rotate(-7deg) scale(1.04)' },
        { transform: 'rotate(0deg) scale(1)' },
      ],
      { duration: 420, easing: 'ease-in-out' },
    )
  window.setTimeout(action, 180)
}

function ContentImage({ item }: { item: Post }) {
  const image = getPostDisplayImage(item)
  const section =
    item.sourceDir === 'recipes' ||
    item.sourceDir === 'crafts' ||
    item.sourceDir === 'travel' ||
    item.sourceDir === 'planting'
      ? item.sourceDir
      : 'posts'
  return image ? (
    <img src={image} alt={item.title} />
  ) : (
    <ContentPlaceholder section={section} itemKey={item.slug} color={item.color} />
  )
}

export function RecipeHomeSection() {
  const recipes = sectionContent.recipes
  const [choices, setChoices] = useState(() => shuffled(recipes).slice(0, 3))
  const refresh = (button: HTMLButtonElement) =>
    animateItemRefresh(button, () => setChoices(shuffled(recipes).slice(0, 3)))
  return (
    <section className="home-recipes home-content-section" id="recipes">
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
          <button
            className="item-refresh recipe-refresh"
            type="button"
            onClick={(event) => refresh(event.currentTarget)}
            disabled={!recipes.length}
          >
            <img src="/images/nav/refresh-recipe-371.png" alt="" /> <span>换一组</span>
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
  const allCrafts = sectionContent.crafts
  const [crafts, setCrafts] = useState(() => shuffled(allCrafts).slice(0, 3))
  return (
    <section className="home-crafts home-content-section" id="crafts">
      <div className="home-content-inner craft-workbench">
        <div className="craft-copy">
          <Icon name="icon-diy" size={62} />
          <p className="eyebrow">TODAY'S WORKBENCH</p>
          <h2>岛民手作台</h2>
          <p>今天也把一点小灵感，做成可以留下来的东西。</p>
          <button
            className="item-refresh craft-refresh"
            type="button"
            onClick={(event) =>
              animateItemRefresh(event.currentTarget, () =>
                setCrafts(shuffled(allCrafts).slice(0, 3)),
              )
            }
            disabled={!allCrafts.length}
          >
            <img src="/images/nav/refresh-craft-481.png" alt="" /> <span>换一批手作</span>
          </button>
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
    <section className="home-travel home-content-section" id="travel">
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
            className="item-refresh travel-refresh"
            type="button"
            onClick={(event) =>
              animateItemRefresh(event.currentTarget, () => setIndex((value) => value + 1))
            }
            disabled={travel.length < 2}
          >
            <img src="/images/nav/refresh-travel-446.png" alt="" /> <span>换个目的地</span>
          </button>
          <Link to="/travel">全部旅行</Link>
        </div>
      </div>
    </section>
  )
}

export function PlantingHomeSection() {
  const flowers = sectionContent.planting
  const dailyIndex = useMemo(
    () => (flowers.length ? currentDayNumber % flowers.length : 0),
    [flowers],
  )
  const [flowerIndex, setFlowerIndex] = useState(dailyIndex)
  const today = flowers[flowerIndex % Math.max(flowers.length, 1)]
  return (
    <section className="home-planting home-content-section" id="planting">
      <div className="home-content-inner flower-garden">
        <div className="flower-title">
          <img src="/images/nav/planting-073.png" alt="" />
          <p className="eyebrow">FLOWER OF THE DAY</p>
          <h2>今日小花</h2>
          <p>每天认识一位花园里的新朋友。</p>
          <button
            className="item-refresh flower-refresh"
            type="button"
            onClick={(event) =>
              animateItemRefresh(event.currentTarget, () => setFlowerIndex((value) => value + 1))
            }
            disabled={flowers.length < 2}
          >
            <img src="/images/nav/refresh-flower-017.png" alt="" /> <span>换一朵花</span>
          </button>
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
