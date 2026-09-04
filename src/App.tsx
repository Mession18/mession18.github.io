import { BackTop, Loading } from 'animal-island-ui'
import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
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

/** 将较大的 3D 猫组件延迟加载，使普通页面内容先显示。 */
const IslandCat3D = lazy(() =>
  import('./components/island-cat/IslandCat3D').then((module) => ({ default: module.IslandCat3D })),
)

/** 把详情地址归到所属栏目，只有跨栏目导航才播放切场动画。 */
function getRouteSection(pathname: string) {
  if (pathname.startsWith('/posts')) return 'posts'
  if (pathname.startsWith('/museum')) return 'museum'
  for (const section of ['recipes', 'crafts', 'travel', 'planting', 'passport'])
    if (pathname.startsWith(`/${section}`)) return section
  return 'home'
}

/** 应用外壳：组合全站组件并注册 URL 与页面的对应关系；新增页面在 Routes 中接入。 */
export function App() {
  const location = useLocation()
  const previousSection = useRef(getRouteSection(location.pathname))
  /** 保留正在显示的地址，跨栏目时延迟替换以配合过场动画。 */
  const [displayLocation, setDisplayLocation] = useState(location)
  const [loadingVisible, setLoadingVisible] = useState(false)
  const [loadingActive, setLoadingActive] = useState(true)

  // 监听路由变化：同栏目直接替换，跨栏目安排遮罩与内容替换计时器；离开时清理。
  useLayoutEffect(() => {
    const nextSection = getRouteSection(location.pathname)
    if (previousSection.current === nextSection) {
      setDisplayLocation(location)
      return
    }
    previousSection.current = nextSection
    setLoadingActive(true)
    setLoadingVisible(false)

    let visibleFrame = 0
    const enterFrame = window.requestAnimationFrame(() => {
      visibleFrame = window.requestAnimationFrame(() => setLoadingVisible(true))
    })
    const swapTimer = window.setTimeout(() => setDisplayLocation(location), 480)
    const closeTimer = window.setTimeout(() => setLoadingActive(false), 820)
    const removeTimer = window.setTimeout(() => {
      setLoadingVisible(false)
    }, 1450)
    return () => {
      window.cancelAnimationFrame(enterFrame)
      window.cancelAnimationFrame(visibleFrame)
      window.clearTimeout(swapTimer)
      window.clearTimeout(closeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [location])

  // 新页面显示后滚动到锚点或回到顶部，避免沿用上一页的滚动位置。
  useLayoutEffect(() => {
    if (displayLocation.hash) {
      const frame = requestAnimationFrame(() =>
        document
          .getElementById(displayLocation.hash.slice(1))
          ?.scrollIntoView({ behavior: 'smooth' }),
      )
      return () => cancelAnimationFrame(frame)
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
      <Header pathname={displayLocation.pathname} />
      <Suspense fallback={null}>
        <IslandCat3D />
      </Suspense>
      {/* 在这里注册页面路由：静态路径对应列表，带 :slug 的路径对应单条详情。 */}
      <div
        className={`route-transition${displayLocation.pathname === '/' ? '' : ' route-inner'}`}
        key={displayLocation.pathname}
      >
        <Suspense
          fallback={
            <p className="empty-section" role="status">
              正在打开内容…
            </p>
          }
        >
          <Routes location={displayLocation}>
            <Route path="/" element={<HomePage />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/posts/:slug" element={<PostDetailPage />} />
            <Route path="/museum" element={<MuseumPage />} />
            <Route path="/museum/:category/:slug" element={<CollectionDetailPage />} />

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
