import { useImageSource } from '../../hooks/useImageSource'
import { Tag } from 'animal-island-ui'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IslandPagination } from '../../components/pagination/IslandPagination'
import { SectionIcon } from '../../components/section-icon/SectionIcon'
import { useStand } from '../../hooks/useStand'
import { colorClass, colorStyle } from '../../shared/config'
import { getPostDisplayImage, type Post, standAttributes } from '../../shared/utils'

import { posts } from './posts.data'
import { presentation } from './presentation.data'

/** 文章列表页：读取栏目数据，管理筛选与分页，并用本文件的卡片组件展示当前页。 */
export function PostsPage() {
  /** 页码状态从 1 开始；筛选改变时必须重置，切片索引则从 0 开始。 */
  const [page, setPage] = useState(1)
  /** 当前标签状态；all 是界面保留值，表示不按标签过滤。 */
  const [activeTag, setActiveTag] = useState('all')
  /** 把内容中的标签去重，生成本页按钮；新增标签在 Markdown 填写即可。 */
  const tags = [...new Set(posts.flatMap((post) => post.tags))]
  /** 按选中标签过滤全部文章，然后再计算本页内容。 */
  const filteredPosts =
    activeTag === 'all' ? posts : posts.filter((post) => post.tags.includes(activeTag))
  /** 根据过滤后的条目数量计算页数，至少保留一页供空状态展示。 */
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / 30))
  const visiblePosts = filteredPosts.slice((page - 1) * 30, page * 30)
  return (
    <div className="page-surface posts-page">
      {/* 列表标题区：英文眉题、栏目标题和简介；通用栏目文案来自 shared/config.ts。 */}
      <header className="page-heading">
        <p className="eyebrow">ALL ISLAND LETTERS</p>
        <h1>
          <SectionIcon section="posts" />
          全部文章
        </h1>
        <p>把日子折成信纸，慢慢寄给未来的自己。</p>
      </header>
      {/* 本页标签按钮：标签来自内容；切换时回到第 1 页，防止停留在不存在的页码。 */}
      <div className="content-filters" aria-label={'文章标签'}>
        {['all', ...tags].map((tag) => (
          <button
            key={tag}
            type="button"
            className={activeTag === tag ? 'active' : ''}
            aria-pressed={activeTag === tag}
            onClick={() => {
              setActiveTag(tag)
              setPage(1)
            }}
          >
            {tag === 'all' ? '全部文章' : tag}
          </button>
        ))}
      </div>
      {/* 内容区：渲染筛选后的当前页卡片、空位和分页；单卡片结构在下方函数中。 */}
      <section className="posts-library" aria-label="全部文章">
        <div className="post-grid">
          {visiblePosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        <IslandPagination page={page} total={totalPages} onChange={setPage} />
      </section>
    </div>
  )
}

/** 文章单条卡片：组合随机底图、内容预览和详情链接；本页专属结构集中在这里修改。 */
export function PostCard({ post, basePath = '/posts' }: { post: Post; basePath?: string }) {
  /** 根据内容标签抽取底图；useStand 保存随机种子，使普通重绘不会换图。 */
  const stand = useStand(presentation, post.tags)
  const { image: previewImage, onError } = useImageSource(getPostDisplayImage(post))

  return (
    <article {...standAttributes(stand)} className="post">
      <Link
        className={`post-art ${colorClass(post.color)}`}
        style={colorStyle(post.color)}
        to={`${basePath}/${post.slug}`}
        aria-label={`阅读：${post.title}`}
      >
        {previewImage ? (
          <img onError={onError} src={previewImage} alt={post.title} />
        ) : (
          <span>{post.icon}</span>
        )}
        <time dateTime={post.publishedAt}>{post.date}</time>
      </Link>
      <div className="post-body">
        <Tag size="small" variant="soft" color="app-green" className="island-ui-tag">
          {post.tag}
        </Tag>
        <h3>
          <Link to={`${basePath}/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
        <Link to={`${basePath}/${post.slug}`}>
          阅读这封信 <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}
