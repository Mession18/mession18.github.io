import { useRef, useState, type CSSProperties } from 'react'
import { Calendar } from './Calendar'
import { celestialStyle } from '../../../shared/utils'
import {
  ArrowRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  LoaderCircle,
  MoonStar,
  Sun,
} from 'lucide-react'
import { useTheme } from '../../../context/useTheme'
import { type TimePeriod, type WeatherKind } from '../../../hooks/useLocalWeather'

/** 天气分类对应的中文文案，首屏天气面板使用。 */
const weatherLabels: Record<WeatherKind, string> = {
  clear: '晴朗',
  cloudy: '多云',
  fog: '有雾',
  rain: '下雨',
  snow: '下雪',
  thunder: '雷雨',
}
/** 把雨雪强度转成天气名称前的小、中、大字样。 */
const intensityLabels = { light: '小', moderate: '中', heavy: '大' } as const
/** 根据月相计算月面受光区域 SVG 路径，表现盈亏变化。 */
function moonLightPath(phase: number) {
  const radius = 44
  const center = 50
  const cosine = Math.cos(phase * Math.PI * 2)
  const points: string[] = []
  const waxing = phase < 0.5
  for (let step = 0; step <= 48; step += 1) {
    const y = -radius + (radius * 2 * step) / 48
    const edge = Math.sqrt(Math.max(0, radius * radius - y * y))
    points.push(`${center + (waxing ? edge : -edge)},${center + y}`)
  }
  for (let step = 48; step >= 0; step -= 1) {
    const y = -radius + (radius * 2 * step) / 48
    const edge = Math.sqrt(Math.max(0, radius * radius - y * y))
    points.push(`${center + (waxing ? cosine : -cosine) * edge},${center + y}`)
  }
  return `M ${points.join(' L ')} Z`
}

/** 组合月面底色、纹理与受光轮廓，显示当天估算月相。 */
function Moon({ phase, name, style }: { phase: number; name: string; style: CSSProperties }) {
  const lightPath = moonLightPath(phase)
  return (
    <svg
      className="hero-moon"
      style={style}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`所选日期月相：${name}`}
    >
      <defs>
        <clipPath id="moonlit-face">
          <path d={lightPath} />
        </clipPath>
      </defs>
      <circle className="moon-disc" cx="50" cy="50" r="44" />
      <path className="moon-light" d={lightPath} />
      <g clipPath="url(#moonlit-face)">
        <circle className="moon-crater crater-one" cx="39" cy="34" r="5" />
        <circle className="moon-crater crater-two" cx="61" cy="61" r="7" />
        <circle className="moon-crater crater-three" cx="34" cy="68" r="3" />
      </g>
    </svg>
  )
}

/** 按加载状态、天气及时间段选择天气图标。 */
function WeatherIcon({
  kind,
  period,
  loading,
  isNight,
}: {
  kind: WeatherKind
  period: TimePeriod
  loading: boolean
  isNight: boolean
}) {
  if (loading) return <LoaderCircle className="weather-loading" size={26} />
  if (kind === 'thunder') return <CloudLightning size={26} />
  if (kind === 'snow') return <CloudSnow size={26} />
  if (kind === 'rain') return <CloudRain size={26} />
  if (kind === 'fog') return <CloudFog size={26} />
  if (kind === 'cloudy') return <Cloud size={26} />
  if (isNight) return <MoonStar size={26} />
  if (period === 'noon') return <Sun size={26} />
  return <CloudSun size={26} />
}

/** 首页首屏：组合天空、地景、标题、时钟和天气信息，场景由主题状态驱动。 */
export function Hero() {
  const { weather, sky, scenePeriod } = useTheme()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarAnchor = useRef<HTMLButtonElement>(null)
  // 星期使用天气定位时区，与主题日期保持一致。
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    weekday: 'long',
    timeZone: weather.timezone,
  }).format(sky.instant)
  // 降水遮挡日月，云雾降低亮度；天体地平线判断由统一投影函数处理。
  const visibility = { clear: 1, cloudy: 0.38, fog: 0.12, rain: 0, snow: 0, thunder: 0 }[
    weather.kind
  ]
  const windLabel = weather.windSpeed <= 8 ? '微风' : weather.windSpeed <= 18 ? '轻风' : '有风'
  const weatherLabel =
    weather.kind === 'thunder'
      ? '暴雨雷电'
      : weather.kind === 'rain' || weather.kind === 'snow'
        ? `${intensityLabels[weather.intensity]}${weatherLabels[weather.kind]}`
        : weatherLabels[weather.kind]
  return (
    <section
      className={`hero weather-${weather.kind} intensity-${weather.intensity} time-${scenePeriod}${weather.loading ? ' weather-pending' : ''}`}
      data-sky-stage={sky.stage}
      id="top"
    >
      {/* 天空装饰层：星星、云和天气特效，样式集中在 home/styles/scenery.css。 */}
      <div className="sky-stars" aria-hidden="true" />
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" aria-hidden="true" />
      <div className="weather-effects" aria-hidden="true">
        <div className="fog-bank fog-one" />
        <div className="fog-bank fog-two" />
        <div className="lightning-bolt" />
      </div>
      {/* 日月置于独立天空层，位置跟随真实方位与高度，不随地景缩放。 */}
      <div className="celestial-sky">
        <div className="hero-sun" aria-hidden="true" style={celestialStyle(sky.sun, visibility)} />
        <Moon
          phase={sky.illumination.phase}
          name={sky.moonName}
          style={celestialStyle(sky.moon, visibility * (sky.isNight ? 1 : 0.55))}
        />
      </div>
      {/* 首页首屏文字和入口；改标题、简介及按钮文案从这里入手。 */}
      <div className="hero-copy">
        <p className="eyebrow">
          <span>●</span> ISLAND LETTER · NO. 01
        </p>
        <h1>
          慢慢生活，
          <br />
          <em>好好记录。</em>
        </h1>
        <p className="intro">
          这里是风铃岛。收集日常的小事、喜欢的游戏，
          <br />
          还有每一个值得记住的晴天。
        </p>
        <a href="#journal" className="primary">
          去岛上逛逛 <ArrowRight size={18} />
        </a>
      </div>
      {/* 岛屿场景层：日月、树林、地面和房屋；同类树木仅排列和尺寸不同。 */}
      <div className="island-scene" aria-label="树木环绕的宁静海岛平原">
        {/* 用重复元素绘制远处树林，数量影响树木密度。 */}
        <div className="horizon-forest" aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className="ground">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="tree t1">
          <i className="trunk" />
          <span className="crown">
            <b />
            <b />
            <b />
          </span>
        </div>
        <div className="tree pine t2">
          <i className="trunk" />
          <span className="crown">
            <b />
            <b />
            <b />
          </span>
        </div>
        <svg
          className="reference-house"
          viewBox="0 0 190 160"
          role="img"
          aria-label="红色屋顶的奶油色小屋"
        >
          <rect className="house-wall" x="30" y="78" width="130" height="72" rx="1" />
          <rect className="house-chimney" x="125" y="43" width="20" height="31" rx="1" />
          <g className="house-smoke-svg" aria-hidden="true">
            <circle cx="135" cy="38" r="5" />
            <circle cx="135" cy="38" r="6" />
            <circle cx="135" cy="38" r="4" />
            <circle cx="135" cy="38" r="5" />
          </g>
          <path className="house-roof" d="M26 50H81L96 34L111 50H164L166 91H126L96 47L65 91H27Z" />
          <path className="house-gable-border" d="M96 39L132 92H60Z" />
          <path className="house-gable" d="M96 46L129 97H63Z" />
          <path className="house-roof-snow" d="M27 51H81L96 35L111 51H164M61 91L96 40L131 91" />
          <g className="house-attic-window">
            <rect x="86" y="66" width="20" height="21" rx="1" />
            <path d="M96 67V86M87 76.5H105" />
          </g>
          <g className="house-window house-window-left">
            <rect x="40" y="104" width="14" height="23" rx="1" />
            <path d="M47 105V126M41 115.5H53" />
          </g>
          <g className="house-window house-window-right">
            <rect x="137" y="104" width="14" height="23" rx="1" />
            <path d="M144 105V126M138 115.5H150" />
          </g>
          <path
            className="house-door"
            d="M79 150V114C79 103 86 97 96 97C106 97 113 103 113 114V150Z"
          />
          <circle className="house-doorknob" cx="107" cy="124" r="1.8" />
          <path className="house-foundation" d="M30 147H76V152H30ZM116 147H160V152H116Z" />
        </svg>
      </div>
      <button
        className="weather"
        ref={calendarAnchor}
        type="button"
        aria-label="打开日历与天气预报"
        aria-haspopup="dialog"
        aria-expanded={calendarOpen}
        onClick={() => setCalendarOpen((open) => !open)}
      >
        <div className="weather-summary">
          <WeatherIcon
            kind={weather.kind}
            period={scenePeriod}
            loading={weather.loading}
            isNight={sky.isNight}
          />
          <span>
            <b>{weather.city}</b>
            <small>
              {weather.loading
                ? '正在获取当地天气'
                : `${weather.temperature}°C · ${weatherLabel} · ${windLabel}`}
            </small>
          </span>
        </div>
        <div className="weather-clock">
          <time className="weather-game-time" dateTime={sky.instant.toISOString()}>
            <span className="weather-time-row">
              <small>{sky.label}</small>
              <b>{weather.time}</b>
            </span>
            <span className="weather-date-row">
              <span>{sky.date}</span>
              <span>{weekday}</span>
            </span>
          </time>
        </div>
      </button>
      {calendarOpen && <Calendar anchor={calendarAnchor} onClose={() => setCalendarOpen(false)} />}
    </section>
  )
}
