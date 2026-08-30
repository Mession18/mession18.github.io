import { CloudSun, X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import type { TimePeriod, WeatherKind } from '../hooks/useLocalWeather'

const weatherOptions: Array<{ value: WeatherKind; label: string }> = [
  { value: 'clear', label: '晴天' },
  { value: 'cloudy', label: '多云' },
  { value: 'fog', label: '雾' },
  { value: 'rain', label: '下雨' },
  { value: 'snow', label: '下雪' },
  { value: 'thunder', label: '雷雨' },
]

const periodOptions: Array<{ value: TimePeriod; label: string }> = [
  { value: 'dawn', label: '凌晨' },
  { value: 'morning', label: '上午' },
  { value: 'noon', label: '中午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' },
]

export function WeatherTestPanel() {
  const enabled =
    import.meta.env.DEV || new URLSearchParams(window.location.search).has('weather-test')
  const [open, setOpen] = useState(false)
  const { weather, weatherOverride, setWeatherOverride } = useTheme()
  if (!enabled) return null

  const selectedKind = weatherOverride?.kind ?? weather.kind
  const selectedPeriod = weatherOverride?.period ?? weather.period
  const updateWeather = (kind: WeatherKind) => setWeatherOverride({ kind, period: selectedPeriod })
  const updatePeriod = (period: TimePeriod) => setWeatherOverride({ kind: selectedKind, period })

  return (
    <aside className={`weather-test-panel${open ? ' is-open' : ''}`} aria-label="临时天气测试">
      <button
        className="weather-test-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {open ? <X size={17} /> : <CloudSun size={19} />}
        <span>{open ? '关闭测试' : '天气测试'}</span>
      </button>
      {open && (
        <div className="weather-test-content">
          <header>
            <b>天气场景测试</b>
            <small>{weatherOverride ? '正在使用模拟天气' : '当前为实时天气'}</small>
          </header>
          <div className="weather-test-options">
            {weatherOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={weatherOverride?.kind === option.value ? 'active' : ''}
                onClick={() => updateWeather(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label>
            时间段
            <select
              value={selectedPeriod}
              onChange={(event) => updatePeriod(event.target.value as TimePeriod)}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="weather-test-reset"
            type="button"
            disabled={!weatherOverride}
            onClick={() => setWeatherOverride(null)}
          >
            恢复实时天气
          </button>
        </div>
      )}
    </aside>
  )
}
