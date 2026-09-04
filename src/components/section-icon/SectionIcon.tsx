import { Icon, type IconName } from 'animal-island-ui'

/** 栏目标题图标映射；可使用 public 图片或组件库图标名。 */
const icons: Record<string, { image?: string; icon?: IconName }> = {
  posts: { image: '/images/common/icons/article-461.png' },
  museum: { icon: 'icon-camera' },
  recipes: { image: '/images/common/icons/cooking-recipe.png' },
  crafts: { icon: 'icon-diy' },
  travel: { icon: 'icon-miles' },
  planting: { image: '/images/common/icons/planting-073.png' },
}
/** 按栏目键渲染标题图标；未配置的栏目返回空，不阻塞页面。 */
export function SectionIcon({ section }: { section: string }) {
  const item = icons[section]
  return item?.image ? (
    <img className="section-title-icon" src={item.image} alt="" />
  ) : item?.icon ? (
    <Icon className="section-title-icon" name={item.icon} size={42} />
  ) : null
}
