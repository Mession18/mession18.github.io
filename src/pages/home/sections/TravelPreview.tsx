import { Icon } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../../../shared/data'
import { ContentImage } from './ContentImage'
import { RefreshButton } from './RefreshButton'

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
          <RefreshButton
            className="travel-refresh"
            icon="/images/common/icons/refresh-travel-446.png"
            onRefresh={() => setIndex((value) => value + 1)}
            disabled={travel.length < 2}
          >
            换个目的地
          </RefreshButton>
          <Link to="/travel">全部旅行</Link>
        </div>
      </div>
    </section>
  )
}
