import { useParams } from 'react-router-dom'
import { PostDetail } from '../../components/post-detail/PostDetail'
import { planting } from './planting.data'

export function PlantingDetailPage() {
  const { slug } = useParams()
  return (
    <PostDetail
      item={planting.find((item) => item.slug === slug)}
      basePath="/planting"
      returnLabel="全部种植"
      notFoundReturnLabel="返回种植"
    />
  )
}
