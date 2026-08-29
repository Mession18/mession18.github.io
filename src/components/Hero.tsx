import { ArrowRight, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, LoaderCircle, MoonStar, Sun } from 'lucide-react'
import { type TimePeriod, type WeatherKind } from '../hooks/useLocalWeather'
import { useTheme } from '../context/ThemeContext'

const weatherLabels: Record<WeatherKind, string> = { clear: '晴朗', cloudy: '多云', fog: '有雾', rain: '下雨', snow: '下雪', thunder: '雷雨' }
const periodLabels: Record<TimePeriod, string> = { dawn: '凌晨', morning: '上午', noon: '中午', afternoon: '下午', evening: '晚上' }

function getMoonPhase(date: Date) {
  const synodicMonth = 29.530588853
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const days = (date.getTime() - knownNewMoon) / 86_400_000
  const phase = ((days / synodicMonth) % 1 + 1) % 1
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
  return <svg className="hero-moon" viewBox="0 0 100 100" role="img" aria-label={`今日月相：${moon.name}`}><defs><clipPath id="moonlit-face"><path d={lightPath} /></clipPath></defs><circle className="moon-disc" cx="50" cy="50" r="44" /><path className="moon-light" d={lightPath} /><g clipPath="url(#moonlit-face)"><circle className="moon-crater crater-one" cx="39" cy="34" r="5" /><circle className="moon-crater crater-two" cx="61" cy="61" r="7" /><circle className="moon-crater crater-three" cx="34" cy="68" r="3" /></g></svg>
}

function WeatherIcon({ kind, period, loading }: { kind: WeatherKind; period: TimePeriod; loading: boolean }) {
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
    <section className={`hero weather-${weather.kind} time-${scenePeriod}${weather.loading ? ' weather-pending' : ''}`} id="top">
      <div className="sky-stars" aria-hidden="true" />
      <div className="cloud cloud-a" /><div className="cloud cloud-b" />
      <div className="cloud cloud-c" aria-hidden="true" />
      <div className="weather-effects" aria-hidden="true"><div className="precipitation" /><div className="fog-bank fog-one" /><div className="fog-bank fog-two" /><div className="lightning-bolt" /></div>
      <div className="hero-copy"><p className="eyebrow"><span>●</span> ISLAND LETTER · NO. 01</p><h1>慢慢生活，<br /><em>好好记录。</em></h1><p className="intro">这里是风铃岛。收集日常的小事、喜欢的游戏，<br />还有每一个值得记住的晴天。</p><a href="#journal" className="primary">去岛上逛逛 <ArrowRight size={18} /></a></div>
      <div className="island-scene" aria-label="树木环绕的宁静海岛平原"><div className="hero-sun" aria-hidden="true" /><Moon /><div className="horizon-forest" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div><div className="ground"><i /><i /><i /><i /><i /></div><div className="tree t1"><i className="trunk" /><span className="crown"><b /><b /><b /></span></div><div className="tree pine t2"><i className="trunk" /><span className="crown"><b /><b /><b /></span></div><div className="house"><i className="roof" /><i className="chimney" /><span className="gable" /><span className="attic-window" /><span className="window left-window" /><span className="window right-window" /><b className="door" /><span className="step" /></div></div>
      <div className="weather"><WeatherIcon kind={weather.kind} period={scenePeriod} loading={weather.loading} /><span><b>{weather.temperature}°C · {weather.city}</b>{weather.loading ? '正在获取当地天气' : `${weatherLabels[weather.kind]} · ${windLabel}`}</span><time>{periodLabels[weather.period]} {weather.time}</time></div>
    </section>
  )
}
