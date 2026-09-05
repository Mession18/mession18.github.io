import { useParams } from 'react-router-dom'
import { PostDetail } from '../../components/post-detail/PostDetail'
import { recipes } from './recipes.data'

export function RecipesDetailPage() {
  const { slug } = useParams()
  return (
    <PostDetail
      item={recipes.find((item) => item.slug === slug)}
      basePath="/recipes"
      returnLabel="全部菜谱"
      notFoundReturnLabel="返回菜谱"
      layout="tutorial"
      featureLabel="ISLAND RECIPE"
    />
  )
}
