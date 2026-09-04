import { Search as SearchIcon, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchEntries } from './search.data'

/** 搜索弹窗：维护关键词和结果，监听快捷键并在选择结果后关闭。 */
export function Search() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  // 搜索打开时监听 Escape 关闭；关闭弹窗后移除键盘监听。
  useEffect(() => {
    if (!searchOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [searchOpen])

  /** 仅在关键词改变时过滤搜索索引，空关键词显示默认结果。 */
  const results = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('zh-CN')
    if (!keyword) return searchEntries.slice(0, 8)
    return searchEntries.filter((entry) => entry.searchText.includes(keyword)).slice(0, 8)
  }, [query])

  return (
    <>
      <button
        className="search"
        type="button"
        aria-label="搜索全站内容"
        onClick={() => setSearchOpen(true)}
      >
        <SearchIcon size={19} />
      </button>
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
              <SearchIcon size={19} />
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
