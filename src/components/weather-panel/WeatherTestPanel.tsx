import { CloudSun, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { clockLabel } from '../../shared/dates'
import { sceneWind } from '../../shared/wind'
import { useTheme } from '../../context/useTheme'
import type { WeatherIntensity, WeatherKind } from '../../hooks/useLocalWeather'

/** 天气测试按钮的类型、强度和中文名称；它们用于预览视觉效果。 */
const weatherOptions: Array<{ kind: WeatherKind; intensity: WeatherIntensity; label: string }> = [
  { kind: 'clear', intensity: 'light', label: '晴天' },
  { kind: 'cloudy', intensity: 'light', label: '多云' },
  { kind: 'fog', intensity: 'light', label: '雾' },
  { kind: 'rain', intensity: 'light', label: '小雨' },
  { kind: 'rain', intensity: 'moderate', label: '中雨' },
  { kind: 'rain', intensity: 'heavy', label: '暴雨' },
  { kind: 'thunder', intensity: 'heavy', label: '雷雨' },
  { kind: 'snow', intensity: 'light', label: '小雪' },
  { kind: 'snow', intensity: 'moderate', label: '中雪' },
  { kind: 'snow', intensity: 'heavy', label: '暴雪' },
]
const windOptions = [
  { speed: 8, gusts: 12, label: '微风' },
  { speed: 40, gusts: 60, label: '强风' },
  { speed: 72, gusts: 98, label: '暴风' },
  { speed: 110, gusts: 150, label: '极强风' },
]
const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']

/** 日期时间和天气各自可预览，关闭面板不会退出预览，恢复按钮重新跟随实时。 */
export function WeatherTestPanel() {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const {
    weather,
    sky,
    weatherOverride,
    setWeatherOverride,
    windOverride,
    setWindOverride,
    clockOverride,
    setClockOverride,
  } = useTheme()
  const wind = sceneWind(weather)
  const directionLabel = directions[Math.round(wind.direction / 45) % 8]
  const selectedDate = clockOverride?.date ?? sky.date
  const selectedMinutes = clockOverride?.minutes ?? sky.minutes

  // 点击外部或按 Escape 收起控制器，不打断当前选择的场景。
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!panel.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [])

  return (
    <aside
      ref={panel}
      className={`weather-test-panel${open ? ' is-open' : ''}`}
      aria-label="场景调节"
    >
      <button
        className="weather-test-trigger"
        type="button"
        aria-label="天气与时间"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={17} /> : <CloudSun size={19} />}
      </button>
      {open && (
        <div className="weather-test-content">
          <header>
            <b>岛屿气象室</b>
            <small>
              {clockOverride ? '时间预览' : '实时时间'} · {sky.label}
            </small>
          </header>
          <p className="weather-location">
            {weather.located ? weather.city : '上海（参考位置）'} · {weather.timezone}
          </p>
          {/* 日期与分钟在同一时区计算；24:00 对应次日 00:00，说明文字避免日期歧义。 */}
          <label>
            日期
            <input
              type="date"
              aria-label="场景日期"
              min="1900-01-01"
              max="2100-12-31"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.validity.valid && event.target.value)
                  setClockOverride({ date: event.target.value, minutes: selectedMinutes })
              }}
            />
          </label>
          <label className="weather-time-label">
            时间 <output>{clockLabel(selectedMinutes)}</output>
          </label>
          <input
            className="weather-time-slider"
            type="range"
            min="0"
            max="1440"
            step="1"
            value={selectedMinutes}
            aria-label="场景时间"
            aria-valuetext={clockLabel(selectedMinutes)}
            onChange={(event) =>
              setClockOverride({ date: selectedDate, minutes: Number(event.target.value) })
            }
          />
          <div className="weather-time-ticks">
            <span>0:00</span>
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
          {selectedMinutes === 1440 && <p className="weather-location">24:00 = 次日 00:00</p>}
          {/* 当前阶段与下一阶段按当天日出日落时间计算，不套用固定小时表。 */}
          <p className="weather-location">
            下一阶段：{sky.nextPhase.label} · {clockLabel(Math.ceil(sky.nextPhase.minute))}
          </p>
          <div className="weather-astronomy">
            <span>
              日出<b>{sky.sunrise}</b>
            </span>
            <span>
              日落<b>{sky.sunset}</b>
            </span>
            <span>
              月相<b>{sky.moonName}</b>
            </span>
          </div>
          {/* 天气预览不会请求历史或未来天气；日月位置与月相始终使用所选日期。 */}
          <div className="weather-control-heading">
            <b>天气</b>
            <small>{weatherOverride ? '手动预览' : '当前实况'}</small>
          </div>
          <div className="weather-test-options">
            {weatherOptions.map((option) => (
              <button
                key={`${option.kind}-${option.intensity}`}
                type="button"
                aria-pressed={
                  weather.kind === option.kind && weather.intensity === option.intensity
                }
                className={
                  weather.kind === option.kind && weather.intensity === option.intensity
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setWeatherOverride({ kind: option.kind, intensity: option.intensity })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="weather-control-heading weather-wind-heading">
            <b>风力</b>
            <small>{windOverride ? '风力预览' : weather.loading ? '获取中' : '当前实况'}</small>
          </div>
          <dl className="weather-wind-readings">
            <div>
              <dt>风速</dt>
              <dd>{Math.round(wind.speed)} km/h</dd>
            </div>
            <div>
              <dt>阵风</dt>
              <dd>{Math.round(wind.gusts)} km/h</dd>
            </div>
            <div>
              <dt>来向</dt>
              <dd>
                {directionLabel}风 · {Math.round(wind.direction)}°
              </dd>
            </div>
            <div>
              <dt>实况气温</dt>
              <dd>{weather.loading ? '—' : `${weather.temperature}°C`}</dd>
            </div>
          </dl>
          <div className="weather-test-options weather-wind-options">
            {windOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={
                  windOverride?.speed === option.speed && windOverride?.gusts === option.gusts
                }
                className={
                  windOverride?.speed === option.speed && windOverride?.gusts === option.gusts
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setWindOverride({
                    speed: option.speed,
                    gusts: option.gusts,
                    direction: windOverride?.direction ?? 270,
                  })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <label>
            风的来向
            <select
              aria-label="风的来向"
              value={(Math.round(wind.direction / 45) % 8) * 45}
              onChange={(event) =>
                setWindOverride({
                  speed: wind.speed,
                  gusts: wind.gusts,
                  direction: Number(event.target.value),
                })
              }
            >
              {directions.map((direction, i) => (
                <option key={direction} value={i * 45}>
                  {direction}风
                </option>
              ))}
            </select>
          </label>
          <div className="weather-test-options weather-wind-options weather-storm-options">
            {(['rain', 'snow'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  setWeatherOverride({ kind, intensity: 'heavy' })
                  setWindOverride({
                    speed: 72,
                    gusts: 98,
                    direction: windOverride?.direction ?? 270,
                  })
                }}
              >
                {kind === 'rain' ? '暴风雨' : '暴风雪'}
              </button>
            ))}
          </div>
          <p className="weather-location">风力与雨雪可分别预览。强风效果不代表已识别当地台风。</p>
          {clockOverride && (
            <p className="weather-location">日期用于天空预览；天气沿用当前实况或手动选择。</p>
          )}
          <div className="weather-reset-row">
            <button
              className="weather-test-reset"
              type="button"
              disabled={!clockOverride}
              onClick={() => setClockOverride(null)}
            >
              实时时间
            </button>
            <button
              className="weather-test-reset"
              type="button"
              disabled={!weatherOverride}
              onClick={() => setWeatherOverride(null)}
            >
              实时天气
            </button>
            <button
              className="weather-test-reset"
              type="button"
              disabled={!windOverride}
              onClick={() => setWindOverride(null)}
            >
              实时风力
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
