import { BackTop, Loading } from 'animal-island-ui'
import { useLayoutEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { AmbientWeather } from './components/AmbientWeather'
import { HomePage } from './pages/HomePage'
import { CollectionDetailPage } from './pages/CollectionDetailPage'
import { MuseumPage } from './pages/MuseumPage'
import { PostDetailPage } from './pages/PostDetailPage'
import { PostsPage } from './pages/PostsPage'

function getRouteSection(pathname: string) {
  if (pathname.startsWith('/posts')) return 'posts'
  if (pathname.startsWith('/museum')) return 'museum'
  return 'home'
}

export function App() {
  const location = useLocation()
  const previousSection = useRef(getRouteSection(location.pathname))
  const [displayLocation, setDisplayLocation] = useState(location)
  const [loadingVisible, setLoadingVisible] = useState(false)
  const [loadingActive, setLoadingActive] = useState(true)

  useLayoutEffect(() => {
    const nextSection = getRouteSection(location.pathname)
    if (previousSection.current === nextSection) {
      setDisplayLocation(location)
      return
    }
    previousSection.current = nextSection
    setLoadingActive(true)
    setLoadingVisible(false)

    const enterFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setLoadingVisible(true))
    })
    const swapTimer = window.setTimeout(() => setDisplayLocation(location), 480)
    const closeTimer = window.setTimeout(() => setLoadingActive(false), 820)
    const removeTimer = window.setTimeout(() => {
      setLoadingVisible(false)
    }, 1450)
    return () => {
      window.cancelAnimationFrame(enterFrame)
      window.clearTimeout(swapTimer)
      window.clearTimeout(closeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [location.pathname, location.hash])

  useLayoutEffect(() => {
    if (displayLocation.hash) {
      requestAnimationFrame(() =>
        document.querySelector(displayLocation.hash)?.scrollIntoView({ behavior: 'smooth' }),
      )
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [displayLocation.pathname, displayLocation.hash])

  return (
    <main>
      <div
        className={`opening-loading-overlay${loadingVisible ? ' is-visible' : ''}`}
        aria-hidden="true"
      >
        <Loading active={loadingActive} className="island-opening-loading" />
      </div>
      <AmbientWeather />
      <Header pathname={displayLocation.pathname} hash={displayLocation.hash} />
      <div className="route-transition" key={displayLocation.pathname}>
        <Routes location={displayLocation}>
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
