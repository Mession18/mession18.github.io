import { Icon } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionContent } from '../../../shared/data'
import { animateItemRefresh } from '../home.data'
import { shuffled } from '../../../shared/utils'
import { ContentImage } from './ContentImage'

/** 首页手作展示板：抽取三件作品、响应换一批，并链接到手工列表及详情。 */
export function CraftHomeSection() {
  const allCrafts = sectionContent.crafts
  /** 首页只抽取三件手工预览；修改数量时同时检查展示板排版。 */
  const [crafts, setCrafts] = useState(() => shuffled(allCrafts).slice(0, 3))
  return (
    <section className="home-crafts home-content-section" id="crafts">
      <div className="home-content-inner craft-workbench">
        {/* 首页手作区介绍与换一批按钮；进入工坊链接跳转独立列表页。 */}
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
            <img src="/images/common/icons/refresh-craft-481.png" alt="" /> <span>换一批手作</span>
          </button>
          <Link to="/crafts">
            进入工坊 <ArrowRight size={16} />
          </Link>
        </div>
        {/* 首页展示板，遍历已抽取的作品；尺寸在 home/styles/crafts.css 的变量中调整。 */}
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
