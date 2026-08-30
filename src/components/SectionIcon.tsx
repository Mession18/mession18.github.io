import { Icon, type IconName } from 'animal-island-ui'

const icons: Record<string, { image?: string; icon?: IconName }> = {
  posts: { image: '/images/nav/article-461.png' },
  museum: { icon: 'icon-camera' },
  recipes: { image: '/images/nav/cooking-recipe-transparent.png' },
  crafts: { icon: 'icon-diy' },
  travel: { icon: 'icon-miles' },
  planting: { image: '/images/nav/planting-073.png' },
}
export function SectionIcon({ section }: { section: string }) {
  const item = icons[section]
  return item?.image ? (
    <img className="section-title-icon" src={item.image} alt="" />
  ) : item?.icon ? (
    <Icon className="section-title-icon" name={item.icon} size={42} />
  ) : null
}
