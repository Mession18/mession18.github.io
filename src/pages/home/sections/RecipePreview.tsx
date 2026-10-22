import { setting, settingStyle } from '../../../shared/site-settings'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../../../shared/data'
import { shuffled } from '../../../shared/presentation'
import { ContentImage } from './ContentImage'
import { RefreshButton } from './RefreshButton'

export function RecipeHomeSection() {
  const recipes = sectionContent.recipes
  const [choices, setChoices] = useState(() => shuffled(recipes).slice(0, 3))
  return (
    <section className="home-recipes home-content-section" id="recipes">
      <div className="home-content-inner">
        <div className="home-content-heading recipe-heading">
          <span className="home-content-icon">
            <img src="/images/common/icons/cooking-recipe.png" alt="" />
          </span>
          <div>
            <p className="eyebrow">
              <span style={settingStyle('section.recipes.eyebrow')}>
                {setting('section.recipes.eyebrow')}
              </span>
            </p>
            <h2>
              <span style={settingStyle('section.recipes.title')}>
                {setting('section.recipes.title')}
              </span>
            </h2>
            <p>
              <span style={settingStyle('section.recipes.description')}>
                {setting('section.recipes.description')}
              </span>
            </p>
          </div>
          <RefreshButton
            className="recipe-refresh"
            icon="/images/common/icons/refresh-recipe-371.png"
            onRefresh={() => setChoices(shuffled(recipes).slice(0, 3))}
            disabled={!recipes.length}
          >
            换一组
          </RefreshButton>
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
