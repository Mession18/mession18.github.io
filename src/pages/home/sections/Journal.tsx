import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PostCard } from '../../posts/page'
import { posts } from '../../posts/posts.data'

/** 首页文章预览区：展示文章入口和选定的文章卡片。 */
export function Journal() {
  return (
    <section className="journal section" id="journal">
      <div className="section-heading">
        <div>
          <p className="eyebrow">RECENT STORIES</p>
          <h2>最近的文章</h2>
        </div>
        <Link to="/posts">
          查看全部 <ArrowRight size={16} />
        </Link>
      </div>
      <div className="post-grid">
        {posts.slice(0, 3).map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
