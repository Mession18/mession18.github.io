import { CloudSun, X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../context/useTheme'
import type { TimePeriod, WeatherIntensity, WeatherKind } from '../../hooks/useLocalWeather'

/** 天气测试按钮的类型、强度和中文名称；它们用于预览视觉效果。 */
const weatherOptions: Array<{ kind: WeatherKind; intensity: WeatherIntensity; label: string }> = [
  { kind: 'clear', intensity: 'light', label: '晴天' },
  { kind: 'cloudy', intensity: 'light', label: '多云' },
  { kind: 'fog', intensity: 'light', label: '雾' },
  { kind: 'rain', intensity: 'light', label: '小雨' },
  { kind: 'rain', intensity: 'moderate', label: '中雨' },
  { kind: 'thunder', intensity: 'heavy', label: '暴雨' },
  { kind: 'snow', intensity: 'light', label: '小雪' },
  { kind: 'snow', intensity: 'moderate', label: '中雪' },
  { kind: 'snow', intensity: 'heavy', label: '暴雪' },
]

/** 时间段测试选项，决定太阳、月亮及首屏配色。 */
const periodOptions: Array<{ value: TimePeriod; label: string }> = [
  { value: 'dawn', label: '凌晨' },
  { value: 'morning', label: '上午' },
  { value: 'noon', label: '中午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' },
]

/** 临时覆盖真实天气和时间段，关闭覆盖后恢复自动场景。 */
export function WeatherTestPanel() {
  /** 管理面板是否展开；只影响当前组件的界面状态。 */
  const [open, setOpen] = useState(false)
  const { weather, weatherOverride, setWeatherOverride } = useTheme()
  const selectedKind = weatherOverride?.kind ?? weather.kind
  const selectedIntensity = weatherOverride?.intensity ?? weather.intensity
  const selectedPeriod = weatherOverride?.period ?? weather.period
  const updateWeather = (kind: WeatherKind, intensity: WeatherIntensity) =>
    setWeatherOverride({ kind, intensity, period: selectedPeriod })
  const updatePeriod = (period: TimePeriod) =>
    setWeatherOverride({ kind: selectedKind, intensity: selectedIntensity, period })

  return (
    <aside className={`weather-test-panel${open ? ' is-open' : ''}`} aria-label="场景调节">
      <button
        className="weather-test-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {open ? <X size={17} /> : <CloudSun size={19} />}
      </button>
      {open && (
        <div className="weather-test-content">
          <header>
            <b>天气与时间</b>
            <small>{weatherOverride ? '手动场景' : '实时跟随'}</small>
          </header>
          <div className="weather-test-options">
            {weatherOptions.map((option) => (
              <button
                key={`${option.kind}-${option.intensity}`}
                type="button"
                className={
                  weatherOverride?.kind === option.kind &&
                  weatherOverride.intensity === option.intensity
                    ? 'active'
                    : ''
                }
                onClick={() => updateWeather(option.kind, option.intensity)}
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
