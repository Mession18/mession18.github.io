import { Leaf, Moon, Search, Sparkles, Sun, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { posts } from '../data/posts'
import { useTheme, type ThemeMode } from '../context/ThemeContext'

const themeOptions: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
  { mode: 'day', label: '白天', icon: Sun },
  { mode: 'auto', label: '跟随', icon: Sparkles },
  { mode: 'night', label: '夜间', icon: Moon },
]

export function Header() {
  const { pathname, hash } = useLocation()
  const { mode, setMode } = useTheme()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 90)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

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
    if (!keyword) return posts.slice(0, 5)
    return posts
      .filter((post) =>
        `${post.title} ${post.excerpt} ${post.tag} ${post.content}`
          .toLocaleLowerCase('zh-CN')
          .includes(keyword),
      )
      .slice(0, 8)
  }, [query])

  const showSectionHeader = isHome && (Boolean(hash) || scrolled)
  return (
    <>
      <header
        className={`topbar ${isHome && !showSectionHeader ? '' : 'inner-topbar'} ${showSectionHeader ? 'section-topbar' : ''}`}
      >
        <Link className="brand" to="/">
          <span className="brand-leaf">
            <Leaf size={21} />
          </span>
          <span>风铃岛通信</span>
        </Link>
        <nav aria-label="主导航">
          <Link className={isHome && !hash ? 'active' : ''} to="/">
            首页
          </Link>
          <Link className={pathname.startsWith('/posts') ? 'active' : ''} to="/posts">
            日志
          </Link>
          <Link className={pathname.startsWith('/museum') ? 'active' : ''} to="/museum">
            博物馆
          </Link>
          <Link className={hash === '#about' ? 'active' : ''} to="/#about">
            岛民护照
          </Link>
        </nav>
        <div className="header-actions">
          <div className={`theme-switch selected-${mode}`} role="group" aria-label="主题模式">
            <span className="theme-slider" aria-hidden="true" />
            {themeOptions.map(({ mode: option, label, icon: Icon }) => (
              <button
                key={option}
                className={mode === option ? 'active' : ''}
                type="button"
                onClick={() => setMode(option)}
                aria-label={`${label}模式`}
                aria-pressed={mode === option}
                title={`${label}模式`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button
            className="search"
            type="button"
            aria-label="搜索文章"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={19} />
          </button>
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
            aria-label="搜索岛民日志"
          >
            <header>
              <div>
                <span>SEARCH ISLAND LETTERS</span>
                <h2>搜索岛民日志</h2>
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
                results.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/posts/${post.slug}`}
                    onClick={() => {
                      setSearchOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className={`search-result-icon ${post.color}`}>{post.icon}</span>
                    <span>
                      <b>{post.title}</b>
                      <small>
                        {post.tag} · {post.publishedAt}
                      </small>
                      <em>{post.excerpt}</em>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="search-empty">没有找到这封信，换个关键词试试吧。</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
