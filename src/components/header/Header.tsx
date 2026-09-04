import { Icon } from 'animal-island-ui'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MusicPlayer } from '../music-player/MusicPlayer'
import { Search } from '../search/Search'
import { WeatherTestPanel } from '../weather-panel/WeatherTestPanel'

/** 主导航清单：to 是独立页面地址，section 是首页锚点 ID；新增栏目时一起填写。 */
const navItems = [
  {
    to: '/posts',
    section: 'journal',
    label: '文章',
    match: (path: string) => path.startsWith('/posts'),
    image: '/images/common/icons/article-461.png',
  },
  {
    to: '/museum',
    section: 'museum',
    label: '博物馆',
    match: (path: string) => path.startsWith('/museum'),
    icon: 'icon-camera',
  },
  {
    to: '/recipes',
    section: 'recipes',
    label: '菜谱',
    match: (path: string) => path.startsWith('/recipes'),
    image: '/images/common/icons/cooking-recipe.png',
  },
  {
    to: '/crafts',
    section: 'crafts',
    label: '手工',
    match: (path: string) => path.startsWith('/crafts'),
    icon: 'icon-diy',
  },
  {
    to: '/travel',
    section: 'travel',
    label: '旅游',
    match: (path: string) => path.startsWith('/travel'),
    icon: 'icon-miles',
  },
  {
    to: '/planting',
    section: 'planting',
    label: '种植',
    match: (path: string) => path.startsWith('/planting'),
    image: '/images/common/icons/planting-073.png',
  },
  {
    to: '/passport',
    section: 'about',
    label: '护照',
    match: (path: string) => path.startsWith('/passport'),
    icon: 'icon-variant',
  },
] as const

/** 全站导航：根据首页滚动位置或当前路由高亮入口，挂载搜索、音乐和天气控制。 */
export function Header({ pathname, hash }: { pathname: string; hash: string }) {
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [activeHomeSection, setActiveHomeSection] = useState('top')

  // 监听滚动并高亮当前首页区块；使用被动监听，卸载时解除。
  useEffect(() => {
    const updateHeader = () => {
      setScrolled(window.scrollY > 90)
      if (!isHome) return
      let current = 'top'
      for (const id of ['journal', 'museum', 'recipes', 'crafts', 'travel', 'planting', 'about']) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= 150) current = id
      }
      setActiveHomeSection(current)
    }
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [isHome])

  const showSectionHeader = isHome && (Boolean(hash) || scrolled)
  return (
    <>
      <header
        className={`topbar ${isHome && !showSectionHeader ? '' : 'inner-topbar'} ${showSectionHeader ? 'section-topbar' : ''}`}
      >
        <Link className="brand" to="/">
          <span className="brand-leaf">
            <img src="/images/common/icons/icon-home.svg" alt="" />
          </span>
          <span>风铃岛通信</span>
        </Link>
        <nav aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.to}
              className={
                isHome
                  ? activeHomeSection === item.section
                    ? 'active'
                    : ''
                  : item.match(pathname)
                    ? 'active'
                    : ''
              }
              to={item.to}
              aria-label={item.label}
              title={item.label}
            >
              {'image' in item ? (
                <img src={item.image} alt="" />
              ) : (
                <Icon name={item.icon} size={28} />
              )}
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <WeatherTestPanel />
          <Search />
          <MusicPlayer />
        </div>
      </header>
    </>
  )
}
