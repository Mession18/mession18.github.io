import { Icon } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../../../shared/data'
import { shuffled } from '../../../shared/presentation'
import { ContentImage } from './ContentImage'
import { RefreshButton } from './RefreshButton'

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
          <RefreshButton
            className="craft-refresh"
            icon="/images/common/icons/refresh-craft-481.png"
            onRefresh={() => setCrafts(shuffled(allCrafts).slice(0, 3))}
            disabled={!allCrafts.length}
          >
            换一批手作
          </RefreshButton>
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
              <div className="craft-note-photo">
                <ContentImage item={item} />
              </div>
              <strong>{item.title}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
