import { Time } from 'animal-island-ui'
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
import { type TimePeriod, type WeatherKind } from '../hooks/useLocalWeather'
import { useTheme } from '../context/ThemeContext'

const weatherLabels: Record<WeatherKind, string> = {
  clear: '晴朗',
  cloudy: '多云',
  fog: '有雾',
  rain: '下雨',
  snow: '下雪',
  thunder: '雷雨',
}
function getMoonPhase(date: Date) {
  const synodicMonth = 29.530588853
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const days = (date.getTime() - knownNewMoon) / 86_400_000
  const phase = (((days / synodicMonth) % 1) + 1) % 1
  const names = ['新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月']
  return { phase, name: names[Math.round(phase * 8) % 8] }
}

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
    points.push(`${center + cosine * edge},${center + y}`)
  }
  return `M ${points.join(' L ')} Z`
}

function Moon() {
  const moon = getMoonPhase(new Date())
  const lightPath = moonLightPath(moon.phase)
  return (
    <svg
      className="hero-moon"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`今日月相：${moon.name}`}
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

function WeatherIcon({
  kind,
  period,
  loading,
}: {
  kind: WeatherKind
  period: TimePeriod
  loading: boolean
}) {
  if (loading) return <LoaderCircle className="weather-loading" size={26} />
  if (kind === 'thunder') return <CloudLightning size={26} />
  if (kind === 'snow') return <CloudSnow size={26} />
  if (kind === 'rain') return <CloudRain size={26} />
  if (kind === 'fog') return <CloudFog size={26} />
  if (kind === 'cloudy') return <Cloud size={26} />
  if (period === 'dawn' || period === 'evening') return <MoonStar size={26} />
  if (period === 'noon') return <Sun size={26} />
  return <CloudSun size={26} />
}

export function Hero() {
  const { weather, scenePeriod } = useTheme()
  const windLabel = weather.windSpeed <= 8 ? '微风' : weather.windSpeed <= 18 ? '轻风' : '有风'
  return (
    <section
      className={`hero weather-${weather.kind} time-${scenePeriod}${weather.loading ? ' weather-pending' : ''}`}
      id="top"
    >
      <div className="sky-stars" aria-hidden="true" />
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" aria-hidden="true" />
      <div className="weather-effects" aria-hidden="true">
        <div className="fog-bank fog-one" />
        <div className="fog-bank fog-two" />
        <div className="lightning-bolt" />
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
      <div className="island-scene" aria-label="树木环绕的宁静海岛平原">
        <div className="hero-sun" aria-hidden="true" />
        <Moon />
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
          <path className="house-roof" d="M26 50H81L96 34L111 50H164L166 91H126L96 47L65 91H27Z" />
          <path className="house-gable-border" d="M96 39L132 92H60Z" />
          <path className="house-gable" d="M96 46L129 97H63Z" />
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
      <div className="weather">
        <div className="weather-summary">
          <WeatherIcon kind={weather.kind} period={scenePeriod} loading={weather.loading} />
          <span>
            <b>{weather.city}</b>
            <small>
              {weather.loading
                ? '正在获取当地天气'
                : `${weather.temperature}°C · ${weatherLabels[weather.kind]} · ${windLabel}`}
            </small>
          </span>
        </div>
        <div className="weather-clock">
          <Time type="game" className="weather-game-time" />
        </div>
      </div>
    </section>
  )
}
