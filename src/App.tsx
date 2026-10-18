import { BackTop } from 'animal-island-ui'
import { lazy, Suspense, useLayoutEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { IslandCompanion } from './components/island-cat/IslandCompanion'
import { PageMetadata } from './components/PageMetadata'
import { AmbientWeather } from './components/ambient-weather/AmbientWeather'
import { Footer } from './components/footer/Footer'
import { Header } from './components/header/Header'
import { CraftsPage } from './pages/crafts/page'
import { HomePage } from './pages/home/page'
import { MuseumPage } from './pages/museum/page'
import { Passport } from './pages/passport/page'
import { PlantingPage } from './pages/planting/page'
import { PostsPage } from './pages/posts/page'
import { RecipesPage } from './pages/recipes/page'
import { TravelPage } from './pages/travel/page'

/** 详情页只在首次进入时加载；列表与首页可先呈现，访问后的模块由浏览器缓存。 */
const CraftsDetailPage = lazy(() =>
  import('./pages/crafts/detailpage').then((module) => ({ default: module.CraftsDetailPage })),
)
const CollectionDetailPage = lazy(() =>
  import('./pages/museum/detailpage').then((module) => ({ default: module.CollectionDetailPage })),
)
const PlantingDetailPage = lazy(() =>
  import('./pages/planting/detailpage').then((module) => ({ default: module.PlantingDetailPage })),
)
const PostDetailPage = lazy(() =>
  import('./pages/posts/detailpage').then((module) => ({ default: module.PostDetailPage })),
)
const RecipesDetailPage = lazy(() =>
  import('./pages/recipes/detailpage').then((module) => ({ default: module.RecipesDetailPage })),
)
const TravelDetailPage = lazy(() =>
  import('./pages/travel/detailpage').then((module) => ({ default: module.TravelDetailPage })),
)

/** 应用外壳：组合全站组件并注册 URL 与页面的对应关系；新增页面在 Routes 中接入。 */
export function App() {
  const location = useLocation()

  // 新页面显示后滚动到锚点或回到顶部，避免沿用上一页的滚动位置。
  useLayoutEffect(() => {
    if (location.hash) {
      const frame = requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'instant'
              : 'smooth',
          }),
      )
      return () => cancelAnimationFrame(frame)
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  return (
    <main>
      <PageMetadata pathname={location.pathname} />
      <AmbientWeather />
      <Header pathname={location.pathname} />
      <IslandCompanion />
      {/* 在这里注册页面路由：静态路径对应列表，带 :slug 的路径对应单条详情。 */}
      <div
        className={`route-transition${location.pathname === '/' ? '' : ' route-inner'}`}
        key={location.pathname}
      >
        <Suspense
          fallback={
            <p className="empty-section" role="status">
              正在打开内容…
            </p>
          }
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/posts/:slug" element={<PostDetailPage />} />
            <Route path="/museum" element={<MuseumPage />} />
            <Route path="/museum/:slug" element={<CollectionDetailPage />} />
            <Route path="/museum/:legacyTag/:slug" element={<CollectionDetailPage />} />

            <Route path="/travel" element={<TravelPage />} />
            <Route path="/travel/:slug" element={<TravelDetailPage />} />
            <Route path="/planting" element={<PlantingPage />} />
            <Route path="/planting/:slug" element={<PlantingDetailPage />} />
            <Route path="/crafts" element={<CraftsPage />} />
            <Route path="/crafts/:slug" element={<CraftsDetailPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:slug" element={<RecipesDetailPage />} />
            <Route path="/passport" element={<Passport standalone />} />
            <Route path="*" element={<PostsPage />} />
          </Routes>
        </Suspense>
      </div>
      <BackTop visibilityHeight={650} />
      <Footer />
    </main>
  )
}
