import { BackTop, Loading } from 'animal-island-ui'
import { useEffect, useLayoutEffect, useState } from 'react'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(timer)
  }, [])

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
      <Loading active={loading} className="island-opening-loading" />
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
