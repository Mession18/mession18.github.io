import { useImageSource } from '../../../hooks/useImageSource'
import { ContentPlaceholder } from '../../../components/content-placeholder/ContentPlaceholder'
import { getPostDisplayImage, type Post } from '../../../shared/utils'

/** 首页预览图片入口；图片加载失败时按内容栏目显示对应缺图文案。 */
export function ContentImage({ item }: { item: Post }) {
  const { image, onError } = useImageSource(getPostDisplayImage(item))
  const section =
    item.sourceDir === 'recipes' ||
    item.sourceDir === 'crafts' ||
    item.sourceDir === 'travel' ||
    item.sourceDir === 'planting'
      ? item.sourceDir
      : 'posts'
  return image ? (
    <img onError={onError} src={image} alt={item.title} />
  ) : (
    <ContentPlaceholder section={section} color={item.color} />
  )
}
