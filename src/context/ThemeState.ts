import { createContext } from 'react'
import type { useLocalWeather, WeatherIntensity, WeatherKind } from '../hooks/useLocalWeather'
import type { calculateSky } from '../shared/utils'

/** 天气和日期时间分别覆盖；改变日期不冒充该日真实天气，null 恢复实时。 */
export type WeatherOverride = { kind: WeatherKind; intensity: WeatherIntensity } | null
export type ClockOverride = { date: string; minutes: number } | null
export type SkyState = ReturnType<typeof calculateSky>

/** 全站共享同一份天文计算，避免首屏、控制器和主题各自使用不同时间。 */
export type ThemeContextValue = {
  scenePeriod: SkyState['period']
  sky: SkyState
  weather: ReturnType<typeof useLocalWeather> & { period: SkyState['period']; time: string }
  weatherOverride: WeatherOverride
  setWeatherOverride: (override: WeatherOverride) => void
  clockOverride: ClockOverride
  setClockOverride: (override: ClockOverride) => void
}

/** 主题上下文容器；实际状态由 ThemeProvider 提供。 */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
