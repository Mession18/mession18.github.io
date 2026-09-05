import { useParams } from 'react-router-dom'
import { PostDetail } from '../../components/post-detail/PostDetail'
import { travel } from './travel.data'

export function TravelDetailPage() {
  const { slug } = useParams()
  return (
    <PostDetail
      item={travel.find((item) => item.slug === slug)}
      basePath="/travel"
      returnLabel="全部旅游"
      notFoundReturnLabel="返回旅游"
    />
  )
}
