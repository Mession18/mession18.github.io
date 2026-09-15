import {
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  TreePalm,
  Waves,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type PointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import './book.css'

export type PassportLeaf = {
  id: string
  label: string
  content: ReactNode
  landscape?: boolean
  acrylic?: boolean
  insideCover?: boolean
}
export type PassportSpread = {
  id: string
  label: string
  firstPage: number
  leaves?: PassportLeaf[]
  content?: ReactNode
}
type BookView = {
  id: string
  label: string
  kind: 'cover' | 'pages' | 'map' | 'back'
  firstPage?: number
  leaves?: PassportLeaf[]
  content?: ReactNode
}
type PageTurn = { from: BookView; to: BookView; direction: 'next' | 'prev' }
const compactQuery = '(max-width: 700px)'
const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribeTo = (query: string) => (callback: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
const subscribeCompact = subscribeTo(compactQuery)
const subscribeMotion = subscribeTo(motionQuery)
const getCompact = () => window.matchMedia(compactQuery).matches
const getReducedMotion = () => window.matchMedia(motionQuery).matches
const getServerSnapshot = () => false

function CoverArtwork({ back = false }: { back?: boolean }) {
  return (
    <>
      <div className="passport-cover-border" aria-hidden="true" />
      <span className="passport-cover-island">
        风铃岛<span>WINDCHIME ISLAND</span>
      </span>
      <div className="passport-cover-emblem" aria-hidden="true">
        <TreePalm strokeWidth={1} />
        <Waves strokeWidth={1} />
      </div>
      {!back && (
        <div className="passport-cover-title">
          <h3>岛民护照</h3>
          <p>ISLANDER PASSPORT</p>
        </div>
      )}
      <div className="passport-cover-owner">
        MESSION<span>温柔的椰子</span>
      </div>
    </>
  )
}
export function PassportCoverPreview() {
  return (
    <section className="passport section passport-home-preview" id="about">
      <div className="passport-intro">
        <h2>岛民护照</h2>
        <p>把自己与世界的相遇，收进一本护照。</p>
      </div>
      <Link className="passport-cover passport-home-cover" to="/passport" aria-label="打开岛民护照">
        <CoverArtwork />
        <span className="passport-cover-open">
          打开护照
          <ArrowUpRight size={16} />
        </span>
        <span className="passport-cover-code">WCI · 0818</span>
      </Link>
    </section>
  )
}
function PassportCover({ back = false, onOpen }: { back?: boolean; onOpen?: () => void }) {
  return (
    <div className={'passport-cover' + (back ? ' passport-cover-back' : '')}>
      <CoverArtwork back={back} />
      <button
        className="passport-cover-open"
        type="button"
        onClick={onOpen}
        tabIndex={onOpen ? 0 : -1}
      >
        {back ? '翻回内页' : '打开护照'}
        <ArrowUpRight size={16} aria-hidden="true" />
      </button>
      <span className="passport-cover-code">WCI · 0818</span>
    </div>
  )
}
/** 沿用 760 × 499 横向内容，按整张书页适配尺寸。 */
function LandscapePage({
  leaf,
  compact,
  onRotate,
}: {
  leaf: PassportLeaf
  compact: boolean
  onRotate: () => void
}) {
  const slot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = slot.current
    if (!element) return
    const resize = () => {
      const width = element.clientWidth,
        height = element.clientHeight
      const scale = compact
        ? Math.min(width / 760, height / 499)
        : Math.min(width / 499, height / 760)
      element.style.setProperty('--card-scale', String(scale))
      if (scale > 0) {
        element.style.setProperty('--card-width', (compact ? width : height) / scale + 'px')
        element.style.setProperty('--card-height', (compact ? height : width) / scale + 'px')
      }
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    return () => observer.disconnect()
  }, [compact])
  return (
    <div
      ref={slot}
      className={'passport-landscape-slot' + (leaf.acrylic ? ' is-acrylic' : '')}
      role={compact ? undefined : 'button'}
      tabIndex={compact ? undefined : 0}
      aria-label={compact ? undefined : '旋转护照，横向阅读' + leaf.label}
      onClick={compact ? undefined : onRotate}
      onKeyDown={
        compact
          ? undefined
          : (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onRotate()
              }
            }
      }
    >
      <div className="passport-landscape-card">{leaf.content}</div>
    </div>
  )
}
export function PassportBook({ spreads }: { spreads: PassportSpread[] }) {
  const compact = useSyncExternalStore(subscribeCompact, getCompact, getServerSnapshot)
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getServerSnapshot)
  const views: BookView[] = [{ id: 'cover', label: '封面', kind: 'cover' }]
  for (const spread of spreads) {
    if (compact && spread.leaves) {
      spread.leaves.forEach((leaf, index) =>
        views.push({
          id: leaf.id,
          label: leaf.label,
          kind: 'pages',
          firstPage: spread.firstPage + index,
          leaves: [leaf],
        }),
      )
    } else views.push({ ...spread, kind: spread.leaves ? 'pages' : 'map' })
  }
  views.push({ id: 'back', label: '封底', kind: 'back' })
  const [currentId, setCurrentId] = useState('cover')
  const [turn, setTurn] = useState<PageTurn | null>(null)
  const [visitedMaps, setVisitedMaps] = useState<string[]>([])
  const [rotated, setRotated] = useState(false)
  const turnLock = useRef(false)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const regionId = useId()
  const currentIndex = Math.max(
    0,
    views.findIndex(
      (view) => view.id === currentId || view.leaves?.some((leaf) => leaf.id === currentId),
    ),
  )
  const current = views[currentIndex]
  const target = turn?.to ?? current
  const totalPages = spreads.at(-1)!.firstPage + 1
  const mobileLandscape = compact && target.leaves?.some((leaf) => leaf.landscape)
  useLayoutEffect(() => {
    const element = viewport.current
    if (!element) return
    const resize = () => {
      const width = element.clientWidth
      element.style.setProperty('--book-width', width + 'px')
      element.style.setProperty(
        '--book-height',
        (compact
          ? mobileLandscape
            ? (width * 499) / 760
            : 610
          : Math.max(610, Math.min(690, width * 0.65))) + 'px',
      )
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    return () => observer.disconnect()
  }, [compact, mobileLandscape])
  useEffect(() => {
    if (!turn) return
    const timeout = window.setTimeout(() => {
      setCurrentId(turn.to.id)
      setTurn(null)
      turnLock.current = false
    }, 850)
    return () => window.clearTimeout(timeout)
  }, [turn])
  function turnTo(view: BookView | undefined) {
    if (!view || view.id === current.id || turnLock.current) return
    if (view.kind === 'map')
      setVisitedMaps((ids) => (ids.includes(view.id) ? ids : [...ids, view.id]))
    if (reducedMotion) {
      setCurrentId(view.id)
      return
    }
    turnLock.current = true
    setTurn({
      from: current,
      to: view,
      direction: views.indexOf(view) > currentIndex ? 'next' : 'prev',
    })
  }
  function finishTurn() {
    if (!turn) return
    setCurrentId(turn.to.id)
    setTurn(null)
    turnLock.current = false
  }
  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) return
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5)
      turnTo(views[currentIndex + (dx < 0 ? 1 : -1)])
  }
  function renderView(view: BookView, preview = false) {
    if (view.kind === 'cover' || view.kind === 'back')
      return (
        <PassportCover
          back={view.kind === 'back'}
          onOpen={
            preview ? undefined : () => turnTo(view.kind === 'back' ? views.at(-2) : views[1])
          }
        />
      )
    if (view.kind === 'map')
      return <div className="passport-spread-paper passport-map-spread">{view.content}</div>
    return (
      <div className="passport-spread-paper">
        {view.leaves?.map((leaf, index) => (
          <article
            className={
              'passport-leaf' +
              (((view.firstPage ?? 1) + index) % 2 ? ' is-left-page' : ' is-right-page') +
              (leaf.landscape ? ' is-landscape-leaf' : '') +
              (leaf.acrylic ? ' is-acrylic-leaf' : '') +
              (leaf.insideCover ? ' is-inside-cover' : '')
            }
            key={leaf.id}
            aria-label={leaf.label + '，第 ' + ((view.firstPage ?? 1) + index) + ' 页'}
          >
            {leaf.landscape ? (
              <LandscapePage
                leaf={leaf}
                compact={compact}
                onRotate={() => setRotated((value) => !value)}
              />
            ) : (
              leaf.content
            )}
          </article>
        ))}
      </div>
    )
  }
  const chapters = [
    { id: 'cover', label: '封面' },
    { id: 'identity', label: '资料页' },
    { id: 'visa-0', label: '签证页' },
    { id: 'world-map', label: '世界地图' },
    { id: 'china-map', label: '中国地图' },
    { id: 'summary', label: '旅行年鉴' },
  ]
  const lastPage = current.firstPage
    ? current.firstPage + (current.kind === 'map' ? 1 : (current.leaves?.length ?? 1) - 1)
    : 0
  return (
    <div
      className={'passport-reader' + (compact ? ' is-compact' : '')}
      style={
        {
          '--leaf-left-clip': 'url(#' + regionId + '-left)',
          '--leaf-right-clip': 'url(#' + regionId + '-right)',
          '--spread-clip': 'url(#' + regionId + '-spread)',
        } as CSSProperties
      }
      onKeyDown={(event) => {
        if (
          (event.target as HTMLElement).closest('.journey-atlas, input, textarea, select') ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault()
          turnTo(views[currentIndex + (event.key === 'ArrowRight' ? 1 : -1)])
        }
      }}
    >
      <svg width="0" height="0" className="passport-shape-definitions" aria-hidden="true">
        <defs>
          <clipPath id={regionId + '-left'} clipPathUnits="objectBoundingBox">
            <path d="M.038 0 Q0 0 0 .03 L0 .97 Q0 1 .038 1 L.88 .993 Q.96 .991 1 .975 L1 .025 Q.96 .009 .88 .007 Z" />
          </clipPath>
          <clipPath id={regionId + '-right'} clipPathUnits="objectBoundingBox">
            <path d="M0 .025 Q.04 .009 .12 .007 L.962 0 Q1 0 1 .03 L1 .97 Q1 1 .962 1 L.12 .993 Q.04 .991 0 .975 Z" />
          </clipPath>
          <clipPath id={regionId + '-spread'} clipPathUnits="objectBoundingBox">
            <path d="M.019 0 Q0 0 0 .03 L0 .97 Q0 1 .019 1 L.44 .993 Q.48 .991 .5 .975 Q.52 .991 .56 .993 L.981 1 Q1 1 1 .97 L1 .03 Q1 0 .981 0 L.56 .007 Q.52 .009 .5 .025 Q.48 .009 .44 .007 Z" />
          </clipPath>
        </defs>
      </svg>
      <nav className="passport-chapters" aria-label="护照章节">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            aria-controls={regionId}
            aria-current={
              current.id === chapter.id || current.leaves?.some((leaf) => leaf.id === chapter.id)
                ? 'page'
                : undefined
            }
            disabled={!!turn}
            onClick={() =>
              turnTo(
                views.find(
                  (view) =>
                    view.id === chapter.id || view.leaves?.some((leaf) => leaf.id === chapter.id),
                ),
              )
            }
          >
            {chapter.label}
          </button>
        ))}
        {!compact && (
          <button
            className="passport-rotate-control"
            type="button"
            onClick={() => setRotated((value) => !value)}
            aria-label={rotated ? '转回竖向护照' : '旋转护照横向阅读'}
            aria-pressed={rotated}
            disabled={!!turn}
          >
            <RotateCw size={18} />
          </button>
        )}
      </nav>
      <div
        ref={viewport}
        className={'passport-book-viewport' + (rotated && !compact ? ' is-rotated' : '')}
        onPointerDown={(event) => {
          if (
            (event.pointerType !== 'touch' && !compact) ||
            event.button !== 0 ||
            (event.target as HTMLElement).closest(
              'button, [role="button"], a, .journey-atlas-loupe, .journey-atlas-ticket, .journey-atlas-index',
            )
          )
            return
          if (event.pointerType === 'mouse') event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          pointerStart.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={endSwipe}
        onPointerCancel={() => {
          pointerStart.current = null
        }}
      >
        <div className="passport-book-orientation">
          <div
            id={regionId}
            className={
              'passport-book-stage' +
              (target.kind === 'cover'
                ? ' is-front-closed'
                : target.kind === 'back'
                  ? ' is-back-closed'
                  : '') +
              (turn ? ' is-turning' : '')
            }
            role="region"
            aria-label="可翻阅的岛民护照"
            aria-busy={!!turn}
            tabIndex={0}
          >
            {views.map((view) => {
              const active = view.id === current.id,
                incoming = turn?.to.id === view.id
              if (view.kind === 'map' && !visitedMaps.includes(view.id)) return null
              return (
                <div
                  key={view.id}
                  style={
                    compact
                      ? {
                          height: view.leaves?.some((leaf) => leaf.landscape)
                            ? 'calc(var(--book-width) * 0.656579)'
                            : '610px',
                        }
                      : undefined
                  }
                  className={
                    'passport-book-view view-' +
                    view.kind +
                    (active ? ' is-active' : '') +
                    (active && turn ? ' is-outgoing outgoing-' + turn.direction : '') +
                    (incoming ? ' is-incoming incoming-' + turn.direction : '')
                  }
                  inert={!active || !!turn}
                  aria-hidden={!active || !!turn}
                  onAnimationEnd={(event) => {
                    if (compact && active && event.target === event.currentTarget) finishTurn()
                  }}
                >
                  {renderView(view)}
                </div>
              )
            })}
            {turn && !compact && (
              <div
                className={'passport-turning-leaf turn-' + turn.direction}
                aria-hidden="true"
                inert
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget) finishTurn()
                }}
              >
                <div
                  className={
                    'passport-turn-face turn-face-front face-' +
                    (turn.direction === 'next' ? 'right' : 'left') +
                    (turn.from.kind === 'cover' || turn.from.kind === 'back'
                      ? ' face-cover'
                      : ' face-paper')
                  }
                >
                  <div className={'passport-turn-content view-' + turn.from.kind}>
                    {renderView(turn.from, true)}
                  </div>
                </div>
                <div
                  className={
                    'passport-turn-face turn-face-back face-' +
                    (turn.direction === 'next' ? 'left' : 'right') +
                    (turn.to.kind === 'cover' || turn.to.kind === 'back'
                      ? ' face-cover'
                      : ' face-paper')
                  }
                >
                  <div className={'passport-turn-content view-' + turn.to.kind}>
                    {renderView(turn.to, true)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="passport-pagination">
        <button
          type="button"
          onClick={() => turnTo(views[currentIndex - 1])}
          disabled={currentIndex === 0 || !!turn}
          aria-label="上一页"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="passport-page-status" aria-live="polite" aria-atomic="true">
          <b>
            {current.firstPage
              ? String(current.firstPage).padStart(2, '0') +
                (lastPage > current.firstPage ? ' — ' + String(lastPage).padStart(2, '0') : '') +
                ' / ' +
                totalPages
              : current.label}
          </b>
          <span>{current.firstPage ? current.label : '风铃岛 · MESSION'}</span>
        </div>
        <button
          type="button"
          onClick={() => turnTo(views[currentIndex + 1])}
          disabled={currentIndex === views.length - 1 || !!turn}
          aria-label="下一页"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <p className="passport-reading-hint">
        <BookOpen size={14} />
        {compact ? '左右滑动翻屏，也可以点击箭头' : '点击资料页旋转护照 · 使用箭头翻阅'}
      </p>
    </div>
  )
}
