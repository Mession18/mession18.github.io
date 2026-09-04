import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../../../shared/data'
import { animateItemRefresh, currentDayNumber } from '../home.data'
import { ContentImage } from './ContentImage'

/** 首页花园预览：以日期确定推荐起点，可切换植物并进入详情。 */
export function PlantingHomeSection() {
  const flowers = sectionContent.planting
  /** 按日期计算每日推荐起点，空数组使用安全的最小长度。 */
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
          <img src="/images/common/icons/planting-073.png" alt="" />
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
            <img src="/images/common/icons/refresh-flower-017.png" alt="" /> <span>换一朵花</span>
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
