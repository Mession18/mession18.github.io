import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchEntries } from '../data/search'
import { WeatherTestPanel } from './WeatherTestPanel'
import { Icon } from 'animal-island-ui'
import { MusicPlayer } from './MusicPlayer'

const navItems = [
  {
    to: '/',
    section: 'top',
    label: '首页',
    match: (path: string, hash: string) => path === '/' && !hash,
    image: '/images/nav/icon-home.svg',
  },
  {
    to: '/posts',
    section: 'journal',
    label: '文章',
    match: (path: string) => path.startsWith('/posts'),
    image: '/images/nav/article-461.png',
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
    image: '/images/nav/cooking-recipe.png',
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
    image: '/images/nav/planting-073.png',
  },
  {
    to: '/#about',
    section: 'about',
    label: '护照',
    match: (_path: string, hash: string) => hash === '#about',
    icon: 'icon-variant',
  },
] as const

export function Header({ pathname, hash }: { pathname: string; hash: string }) {
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [activeHomeSection, setActiveHomeSection] = useState('top')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

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

  useEffect(() => {
    if (!searchOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [searchOpen])

  const results = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('zh-CN')
    if (!keyword) return searchEntries.slice(0, 8)
    return searchEntries.filter((entry) => entry.searchText.includes(keyword)).slice(0, 8)
  }, [query])

  const showSectionHeader = isHome && (Boolean(hash) || scrolled)
  return (
    <>
      <header
        className={`topbar ${isHome && !showSectionHeader ? '' : 'inner-topbar'} ${showSectionHeader ? 'section-topbar' : ''}`}
      >
        <Link className="brand" to="/">
          <span className="brand-leaf">
            <img src="/images/nav/icon-home.svg" alt="" />
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
                  : item.match(pathname, hash)
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
          <button
            className="search"
            type="button"
            aria-label="搜索全站内容"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={19} />
          </button>
          <MusicPlayer />
        </div>
      </header>
      {searchOpen && (
        <div
          className="search-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false)
          }}
        >
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="搜索风铃岛"
          >
            <header>
              <div>
                <span>SEARCH THE ISLAND</span>
                <h2>搜索风铃岛</h2>
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="关闭搜索">
                <X size={20} />
              </button>
            </header>
            <label className="search-input">
              <Search size={19} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="输入标题、分类或正文关键词…"
              />
            </label>
            <div className="search-results">
              {results.length ? (
                results.map((entry) => (
                  <Link
                    key={entry.id}
                    to={entry.href}
                    onClick={() => {
                      setSearchOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className={`search-result-icon ${entry.color}`}>{entry.icon}</span>
                    <span>
                      <b>{entry.title}</b>
                      <small>{entry.meta}</small>
                      <em>{entry.excerpt}</em>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="search-empty">没有找到相关内容，换个关键词试试吧。</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
