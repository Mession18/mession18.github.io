import { useImageSource } from '../../../hooks/useImageSource'
import {
  type CollectionItem,
  collections,
  getCollectionDisplayImage,
} from '../../museum/museum.data'
import { Icon } from 'animal-island-ui'
import { Map } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdaptivePreviewImage } from '../../../components/adaptive-image/AdaptivePreviewImage'
import { ContentMessageText } from '../../../components/content-placeholder/ContentPlaceholder'
import { colorClass, colorStyle } from '../../../shared/config'
import { sectionContent } from '../../../shared/data'

import { posts } from '../../posts/posts.data'

/** 首页博物馆预览：选择藏品并通过闪光效果刷新照片组合。 */
export function Museum() {
  /** 保存本次首页抽取的藏品，点击刷新后才重新选取。 */
  const [featured, setFeatured] = useState(() =>
    [...collections].sort(() => Math.random() - 0.5).slice(0, 2),
  )
  const [flashing, setFlashing] = useState(false)
  /** 播放闪光反馈后重新选择首页藏品。 */
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
            <b>{String(posts.length).padStart(2, '0')}</b>
            <em>
              <img src="/images/common/icons/article-461.png" alt="" />
              文章
            </em>
          </span>
          <span>
            <b>{String(collections.length).padStart(2, '0')}</b>
            <em>
              <Icon name="icon-camera" size={16} />
              藏品
            </em>
          </span>
          <span>
            <b>{String(sectionContent.recipes.length).padStart(2, '0')}</b>
            <em>
              <img src="/images/common/icons/cooking-recipe.png" alt="" />
              菜谱
            </em>
          </span>
          <span>
            <b>{String(sectionContent.crafts.length).padStart(2, '0')}</b>
            <em>
              <Icon name="icon-diy" size={16} />
              手工
            </em>
          </span>
          <span>
            <b>{String(sectionContent.travel.length).padStart(2, '0')}</b>
            <em>
              <Icon name="icon-miles" size={16} />
              明信片
            </em>
          </span>
          <span>
            <b>{String(sectionContent.planting.length).padStart(2, '0')}</b>
            <em>
              <img src="/images/common/icons/planting-073.png" alt="" />
              植物
            </em>
          </span>
        </div>
        <Link to="/museum" className="secondary">
          参观博物馆 <Map size={17} />
        </Link>
      </div>
      <div className="photo-stack">
        {featured.map((item, index) => (
          <MuseumPreview key={item.slug} item={item} index={index} />
        ))}
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

/** 渲染首页单张藏品照片，处理图片失败和对应详情跳转。 */
function MuseumPreview({ item, index }: { item: CollectionItem; index: number }) {
  const { image: previewImage, onError } = useImageSource(getCollectionDisplayImage(item))
  return (
    <Link className={`photo p${index + 1}`} to={`/museum/${item.category}/${item.slug}`}>
      <div
        className={previewImage ? '' : `photo-missing ${colorClass(item.color)}`}
        style={previewImage ? undefined : colorStyle(item.color)}
      >
        {previewImage ? (
          <AdaptivePreviewImage onError={onError} src={previewImage} alt={item.title} />
        ) : (
          <span>
            <ContentMessageText section="museum" kind="missing" />
          </span>
        )}
      </div>
      <span>{item.title}</span>
    </Link>
  )
}
