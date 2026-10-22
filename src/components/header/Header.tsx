import { setting, settingStyle } from '../../shared/site-settings'
import { Icon } from 'animal-island-ui'
import { useEffect, useRef, useState } from 'react'
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
    image: '/images/common/icons/cooking-recipe-84.webp',
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
export function Header({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreButton = useRef<HTMLButtonElement>(null)
  const morePanel = useRef<HTMLDivElement>(null)
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [activeHomeSection, setActiveHomeSection] = useState('top')

  useEffect(() => {
    if (!moreOpen) return
    const close = (event: PointerEvent) => {
      if (
        !morePanel.current?.contains(event.target as Node) &&
        !moreButton.current?.contains(event.target as Node)
      ) {
        setMoreOpen(false)
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false)
        moreButton.current?.focus()
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [moreOpen])

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

  // 只依据实际滚动位置；即使 URL 保留首页锚点，回到顶部也恢复透明。
  const showSectionHeader = isHome && scrolled
  return (
    <>
      <header
        className={`topbar ${isHome && !showSectionHeader ? '' : 'inner-topbar'} ${showSectionHeader ? 'section-topbar' : ''}`}
      >
        <Link className="brand" to="/">
          <span className="brand-leaf">
            <img src="/images/common/icons/icon-home.svg" alt="" />
          </span>
          <span style={settingStyle('footer.brand')}>{setting('footer.brand')}</span>
        </Link>
        <nav aria-label="主导航">
          {navItems.map((item, index) => (
            <Link
              key={item.to}
              className={`${index > 2 ? 'secondary-nav ' : ''}${
                isHome
                  ? activeHomeSection === item.section
                    ? 'active'
                    : ''
                  : item.match(pathname)
                    ? 'active'
                    : ''
              }`}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              aria-current={!isHome && item.match(pathname) ? 'page' : undefined}
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
          <button
            className="more-nav"
            ref={moreButton}
            type="button"
            aria-expanded={moreOpen}
            aria-controls="more-navigation"
            onClick={() => setMoreOpen((open) => !open)}
          >
            <span aria-hidden="true">•••</span>
            <span className="nav-label">更多</span>
          </button>
        </nav>
        {moreOpen && (
          <div
            className="more-navigation"
            id="more-navigation"
            ref={morePanel}
            role="navigation"
            aria-label="更多栏目"
          >
            {navItems.slice(3).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  setMoreOpen(false)
                  moreButton.current?.focus()
                }}
                aria-current={item.match(pathname) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
        <div className="header-actions">
          <WeatherTestPanel />
          <Search />
          <MusicPlayer />
        </div>
      </header>
    </>
  )
}
