import { useParams } from 'react-router-dom'
import { PostDetail } from '../../components/post-detail/PostDetail'
import { crafts } from './crafts.data'

export function CraftsDetailPage() {
  const { slug } = useParams()
  return (
    <PostDetail
      item={crafts.find((item) => item.slug === slug)}
      basePath="/crafts"
      returnLabel="全部手工"
      notFoundReturnLabel="返回手工"
      layout="tutorial"
      featureLabel="ISLAND DIY"
    />
  )
}
