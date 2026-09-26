import { lazy, Suspense, useRef, useState, type CSSProperties } from 'react'
import { Calendar } from './Calendar'
import { celestialStyle } from '../../../shared/sky'
import { sceneWind } from '../../../shared/wind'
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
import type { SkyState } from '../../../context/ThemeState'
import type { WeatherKind } from '../../../hooks/useLocalWeather'

const IslandScene = lazy(() => import('./IslandScene'))

const weatherLabels: Record<WeatherKind, string> = {
  clear: '晴朗',
  cloudy: '多云',
  fog: '有雾',
  rain: '雨',
  snow: '雪',
  thunder: '雷雨',
}
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
        <circle className="moon-crater" cx="39" cy="34" r="5" />
        <circle className="moon-crater" cx="61" cy="61" r="7" />
        <circle className="moon-crater" cx="34" cy="68" r="3" />
      </g>
    </svg>
  )
}

function WeatherIcon({
  kind,
  period,
  loading,
  isNight,
}: {
  kind: WeatherKind
  period: SkyState['period']
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
  const wind = sceneWind(weather)
  const windDirection = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][
    Math.round(wind.direction / 45) % 8
  ]
  const windLabel = wind.label
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
      <div className="sky-stars" aria-hidden="true" />
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
      <Suspense fallback={<div className="island-scene-fallback" aria-hidden="true" />}>
        <IslandScene />
      </Suspense>
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
            {!weather.loading && (
              <small>
                {windDirection}风 · 阵风 {Math.round(wind.gusts)} km/h
              </small>
            )}
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
