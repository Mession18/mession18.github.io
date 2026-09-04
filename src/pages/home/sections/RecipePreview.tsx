import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../../../shared/data'
import { animateItemRefresh } from '../home.data'
import { shuffled } from '../../../shared/utils'
import { ContentImage } from './ContentImage'

/** 首页菜谱预览：从菜谱数据选三项，并提供换一批与列表入口。 */
export function RecipeHomeSection() {
  const recipes = sectionContent.recipes
  /** 首页菜谱预览最多取三项；随机列表存入状态避免重绘时闪动。 */
  const [choices, setChoices] = useState(() => shuffled(recipes).slice(0, 3))
  const refresh = (button: HTMLButtonElement) =>
    animateItemRefresh(button, () => setChoices(shuffled(recipes).slice(0, 3)))
  return (
    <section className="home-recipes home-content-section" id="recipes">
      <div className="home-content-inner">
        <div className="home-content-heading recipe-heading">
          <span className="home-content-icon">
            <img src="/images/common/icons/cooking-recipe.png" alt="" />
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
            <img src="/images/common/icons/refresh-recipe-371.png" alt="" /> <span>换一组</span>
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
