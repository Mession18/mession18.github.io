import { createContext } from 'react'
import type {
  TimePeriod,
  useLocalWeather,
  WeatherIntensity,
  WeatherKind,
} from '../hooks/useLocalWeather'

/** 用户选择的日间、自动或夜间模式。 */
export type ThemeMode = 'day' | 'auto' | 'night'
/** 天气测试覆盖值；null 表示使用实际天气。 */
export type WeatherOverride = {
  kind: WeatherKind
  intensity: WeatherIntensity
  period: TimePeriod
} | null

/** 主题上下文公开的数据和修改方法，供 useTheme 消费。 */
export type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  effectiveTheme: 'day' | 'night'
  scenePeriod: TimePeriod
  weather: ReturnType<typeof useLocalWeather>
  weatherOverride: WeatherOverride
  setWeatherOverride: (override: WeatherOverride) => void
}

/** 主题上下文容器；实际状态由 ThemeProvider 提供。 */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
