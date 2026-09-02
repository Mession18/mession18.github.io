import { Icon } from 'animal-island-ui'
import { Map } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collections, getCollectionPreviewImage } from '../data/collections'
import { posts } from '../data/posts'
import { AdaptivePreviewImage } from './AdaptivePreviewImage'

export function Museum() {
  const photos = collections.filter((item) => item.category === 'photos')
  const [featured, setFeatured] = useState(() =>
    [...collections].sort(() => Math.random() - 0.5).slice(0, 2),
  )
  const [flashing, setFlashing] = useState(false)
  const refreshFeatured = () => {
    setFlashing(true)
    window.setTimeout(() => {
      setFeatured([...collections].sort(() => Math.random() - 0.5).slice(0, 2))
      setFlashing(false)
    }, 240)
  }
  return (
    <section className="museum section" id="museum">
      <div className="museum-copy">
        <p className="eyebrow">ISLAND COLLECTION</p>
        <h2 className="museum-home-title">
          <Icon name="icon-camera" size={38} />
          岛上的小小博物馆
        </h2>
        <p>照片、游戏、书和音乐。喜欢的东西不必昂贵，只要在看到它时，心里会亮起一盏小灯。</p>
        <div className="stats">
          <span>
            <b>{String(posts.length).padStart(2, '0')}</b> 篇文章
          </span>
          <span>
            <b>{String(photos.length).padStart(2, '0')}</b> 张照片
          </span>
          <span>
            <b>{String(collections.length).padStart(2, '0')}</b> 件收藏
          </span>
        </div>
        <Link to="/museum" className="secondary">
          参观博物馆 <Map size={17} />
        </Link>
      </div>
      <div className="photo-stack">
        {featured.map((item, index) => {
          const previewImage = getCollectionPreviewImage(item)
          return (
            <Link
              key={item.slug}
              className={`photo p${index + 1}`}
              to={`/museum/${item.category}/${item.slug}`}
            >
              <div>
                {previewImage ? (
                  <AdaptivePreviewImage src={previewImage} alt={item.title} />
                ) : (
                  <span>藏品出差</span>
                )}
              </div>
              <span>{item.title}</span>
            </Link>
          )
        })}
        <button
          className={`camera museum-refresh${flashing ? ' is-flashing' : ''}`}
          type="button"
          onClick={refreshFeatured}
          aria-label="换一组博物馆展品"
          title="换一组展品"
        >
          <Icon name="icon-camera" size={30} />
          <span>换一组</span>
          <i aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
