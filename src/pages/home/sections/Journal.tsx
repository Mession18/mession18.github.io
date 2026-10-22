import { setting, settingStyle } from '../../../shared/site-settings'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PostCard } from '../../posts/page'
import { posts } from '../../posts/posts.data'

export function Journal() {
  return (
    <section className="journal section" id="journal">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span style={settingStyle('section.posts.eyebrow')}>
              {setting('section.posts.eyebrow')}
            </span>
          </p>
          <h2>
            <span style={settingStyle('section.posts.title')}>
              {setting('section.posts.title')}
            </span>
          </h2>
          {setting('section.posts.description') && (
            <p style={settingStyle('section.posts.description')}>
              {setting('section.posts.description')}
            </p>
          )}
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
