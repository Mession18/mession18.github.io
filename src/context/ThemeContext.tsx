import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocalWeather, type TimePeriod } from '../hooks/useLocalWeather'
import type { WeatherIntensity, WeatherKind } from '../hooks/useLocalWeather'

export type ThemeMode = 'day' | 'auto' | 'night'
export type WeatherOverride = {
  kind: WeatherKind
  intensity: WeatherIntensity
  period: TimePeriod
} | null

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  effectiveTheme: 'day' | 'night'
  scenePeriod: TimePeriod
  weather: ReturnType<typeof useLocalWeather>
  weatherOverride: WeatherOverride
  setWeatherOverride: (override: WeatherOverride) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const liveWeather = useLocalWeather()
  const [weatherOverride, setWeatherOverride] = useState<WeatherOverride>(null)
  const [mode, setMode] = useState<ThemeMode>('auto')
  const weather = useMemo(
    () =>
      weatherOverride
        ? { ...liveWeather, ...weatherOverride, loading: false, city: '天气测试岛' }
        : liveWeather,
    [liveWeather, weatherOverride],
  )
  const isNaturalNight = weather.period === 'dawn' || weather.period === 'evening'
  const effectiveTheme = weatherOverride
    ? isNaturalNight
      ? 'night'
      : 'day'
    : mode === 'auto'
      ? isNaturalNight
        ? 'night'
        : 'day'
      : mode
  const scenePeriod: TimePeriod =
    weatherOverride !== null
      ? weather.period
      : mode === 'day'
        ? 'morning'
        : mode === 'night'
          ? 'evening'
          : weather.period

  useEffect(() => {
    window.localStorage.setItem('island-theme', mode)
    document.documentElement.dataset.theme = effectiveTheme
    document.documentElement.dataset.themeMode = mode
    document.documentElement.dataset.weather = weather.kind
  }, [effectiveTheme, mode, weather.kind])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      effectiveTheme,
      scenePeriod,
      weather,
      weatherOverride,
      setWeatherOverride,
    }),
    [mode, effectiveTheme, scenePeriod, weather, weatherOverride],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
