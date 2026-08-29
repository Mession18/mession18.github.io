import { Leaf, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const { pathname, hash } = useLocation()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 90)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])
  const showSectionHeader = isHome && (Boolean(hash) || scrolled)
  return <header className={`topbar ${isHome && !showSectionHeader ? '' : 'inner-topbar'} ${showSectionHeader ? 'section-topbar' : ''}`}><Link className="brand" to="/"><span className="brand-leaf"><Leaf size={21} /></span><span>风铃岛通信</span></Link><nav aria-label="主导航"><Link className={isHome && !hash ? 'active' : ''} to="/">首页</Link><Link className={pathname.startsWith('/posts') ? 'active' : ''} to="/posts">日志</Link><Link className={pathname.startsWith('/museum') ? 'active' : ''} to="/museum">博物馆</Link><Link className={hash === '#about' ? 'active' : ''} to="/#about">岛民护照</Link></nav><button className="search" aria-label="搜索文章"><Search size={20} /></button></header>
}
