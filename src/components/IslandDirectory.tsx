import { Icon, type IconName } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { contentSectionInfo, sectionContent, type ContentSectionKey } from '../data/contentSections'

type DirectoryItem = {
  key: ContentSectionKey
  note: string
  icon?: IconName
  image?: string
}

const items: DirectoryItem[] = [
  {
    key: 'recipes',
    note: '把喜欢的味道写成一张张小食谱。',
    image: '/images/nav/cooking-recipe.png',
  },
  { key: 'crafts', note: '剪下灵感，缝起岛上的手作时光。', icon: 'icon-diy' },
  { key: 'travel', note: '将路上的风景和小故事收进行李箱。', icon: 'icon-miles' },
  {
    key: 'planting',
    note: '从一颗种子开始，等待季节慢慢开花。',
    image: '/images/nav/planting-073.png',
  },
]

export function IslandDirectory() {
  return (
    <section className="island-directory section" aria-labelledby="island-directory-title">
      <div className="section-heading directory-heading">
        <div>
          <p className="eyebrow">MORE FROM THE ISLAND</p>
          <h2 id="island-directory-title">岛上的其他角落</h2>
        </div>
        <p>做饭、手作、远行和种植，每个入口都有自己的小世界。</p>
      </div>
      <div className="directory-grid">
        {items.map((item) => {
          const info = contentSectionInfo[item.key]
          const latest = sectionContent[item.key][0]
          return (
            <Link
              className={`directory-card directory-${item.key}`}
              to={`/${item.key}`}
              key={item.key}
            >
              <span className="directory-icon" aria-hidden="true">
                {item.image ? (
                  <img src={item.image} alt="" />
                ) : (
                  <Icon name={item.icon!} size={54} />
                )}
              </span>
              <span className="directory-copy">
                <small>{info.eyebrow}</small>
                <strong>{info.title}</strong>
                <em>{item.note}</em>
                <b>{latest ? `最新：${latest.title}` : '等待第一篇记录'}</b>
              </span>
              <ArrowRight className="directory-arrow" size={20} />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
