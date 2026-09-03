import { createContext } from 'react'
import type { TimePeriod, WeatherIntensity, WeatherKind } from '../hooks/useLocalWeather'
import type { useLocalWeather } from '../hooks/useLocalWeather'

export type ThemeMode = 'day' | 'auto' | 'night'
export type WeatherOverride = {
  kind: WeatherKind
  intensity: WeatherIntensity
  period: TimePeriod
} | null

export type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  effectiveTheme: 'day' | 'night'
  scenePeriod: TimePeriod
  weather: ReturnType<typeof useLocalWeather>
  weatherOverride: WeatherOverride
  setWeatherOverride: (override: WeatherOverride) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
