import { BackTop, Loading } from 'animal-island-ui'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { AmbientWeather } from './components/AmbientWeather'
import { HomePage } from './pages/HomePage'
import { CollectionDetailPage } from './pages/CollectionDetailPage'
import { MuseumPage } from './pages/MuseumPage'
import { PostDetailPage } from './pages/PostDetailPage'
import { PostsPage } from './pages/PostsPage'

export function App() {
  const location = useLocation()
  const previousPathname = useRef(location.pathname)
  const [loadingVisible, setLoadingVisible] = useState(false)
  const [loadingActive, setLoadingActive] = useState(true)

  useEffect(() => {
    if (previousPathname.current === location.pathname) return
    previousPathname.current = location.pathname
    setLoadingActive(true)
    setLoadingVisible(false)

    const enterFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setLoadingVisible(true))
    })
    const closeTimer = window.setTimeout(() => setLoadingActive(false), 1050)
    const removeTimer = window.setTimeout(() => {
      setLoadingVisible(false)
    }, 1750)
    return () => {
      window.cancelAnimationFrame(enterFrame)
      window.clearTimeout(closeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [location.pathname])

  useLayoutEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }),
      )
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  return (
    <main>
      <div
        className={`opening-loading-overlay${loadingVisible ? ' is-visible' : ''}`}
        aria-hidden="true"
      >
        <Loading active={loadingActive} className="island-opening-loading" />
      </div>
      <AmbientWeather />
      <Header />
      <div className="route-transition" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:slug" element={<PostDetailPage />} />
          <Route path="/museum" element={<MuseumPage />} />
          <Route path="/museum/:category/:slug" element={<CollectionDetailPage />} />
          <Route path="*" element={<PostsPage />} />
        </Routes>
      </div>
      <BackTop visibilityHeight={650} />
      <Footer />
    </main>
  )
}
