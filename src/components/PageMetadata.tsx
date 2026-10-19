import { useEffect } from 'react'
import { posts } from '../pages/posts/posts.data'
import { crafts } from '../pages/crafts/crafts.data'
import { recipes } from '../pages/recipes/recipes.data'
import { planting } from '../pages/planting/planting.data'
import { travel } from '../pages/travel/travel.data'
import { collections } from '../pages/museum/museum.data'

const description = '这里是风铃岛。收集日常的小事、喜欢的游戏，还有每一个值得记住的晴天。'
const sections = {
  posts: '文章',
  museum: '博物馆',
  recipes: '菜谱',
  crafts: '手工',
  travel: '旅游',
  planting: '种植',
  passport: '护照',
}
const content = { posts, crafts, recipes, planting, travel, museum: collections }

/** 保持浏览器标题与当前内容一致；静态分享爬虫的默认信息见 index.html。 */
export function PageMetadata({ pathname }: { pathname: string }) {
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    const section = segments[0] as keyof typeof sections
    const items = content[section as keyof typeof content]
    let slug = segments.at(-1)
    try {
      slug = decodeURIComponent(slug || '')
    } catch {
      // 保留无效编码以显示未找到内容。
    }
    const item = segments.length > 1 ? items?.find((item) => item.slug === slug) : undefined
    const title = item?.title ?? (segments.length > 1 ? '未找到内容' : sections[section])
    document.title = title ? `${title} · 风铃岛通信` : '风铃岛通信'
    const update = (selector: string, value: string) =>
      document.querySelector(selector)?.setAttribute('content', value)
    update('meta[name="description"]', item?.excerpt || description)
    update('meta[property="og:title"]', document.title)
    update('meta[property="og:description"]', item?.excerpt || description)
    const origin =
      import.meta.env.VITE_CONTENT_MODE === 'runtime'
        ? window.location.origin
        : 'https://mession18.github.io'
    update('meta[property="og:url"]', `${origin}/#${pathname}`)
    update('meta[property="og:type"]', item ? 'article' : 'website')
  }, [pathname])
  return null
}
