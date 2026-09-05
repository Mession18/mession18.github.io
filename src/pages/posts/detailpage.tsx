import { Link, useParams } from 'react-router-dom'
import { PostDetail } from '../../components/post-detail/PostDetail'
import { posts } from './posts.data'

export function PostDetailPage() {
  const { slug } = useParams()
  return (
    <PostDetail
      item={posts.find((item) => item.slug === slug)}
      basePath="/posts"
      returnLabel="全部文章"
      notFoundReturnLabel="返回文章"
      tagClassName="article-island-tag"
      notFound={{ icon: '🌊', title: '这封信漂远了', description: '没有找到你想阅读的文章。' }}
      footer={
        <footer className="article-ending">
          <span>END OF LETTER</span>
          <p>谢谢你读到这里，愿今天也有一件小小的好事。</p>
          <Link to="/posts">继续读岛上的信</Link>
        </footer>
      }
    />
  )
}
