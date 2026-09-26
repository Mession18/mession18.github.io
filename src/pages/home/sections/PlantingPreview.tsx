import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../../../shared/data'
import { ContentImage } from './ContentImage'
import { RefreshButton } from './RefreshButton'

// 以 UTC 日期序号确定每日推荐的起点。
const currentDayNumber = Math.floor(Date.now() / 86400000)

export function PlantingHomeSection() {
  const flowers = sectionContent.planting
  const [flowerIndex, setFlowerIndex] = useState(currentDayNumber % Math.max(flowers.length, 1))
  const today = flowers[flowerIndex % Math.max(flowers.length, 1)]
  return (
    <section className="home-planting home-content-section" id="planting">
      <div className="home-content-inner flower-garden">
        <div className="flower-title">
          <img src="/images/common/icons/planting-073.png" alt="" />
          <p className="eyebrow">FLOWER OF THE DAY</p>
          <h2>今日小花</h2>
          <p>每天认识一位花园里的新朋友。</p>
          <RefreshButton
            className="flower-refresh"
            icon="/images/common/icons/refresh-flower-017.png"
            onRefresh={() => setFlowerIndex((value) => value + 1)}
            disabled={flowers.length < 2}
          >
            换一朵花
          </RefreshButton>
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
