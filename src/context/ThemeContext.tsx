import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocalWeather, type TimePeriod } from '../hooks/useLocalWeather'

export type ThemeMode = 'day' | 'auto' | 'night'

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  effectiveTheme: 'day' | 'night'
  scenePeriod: TimePeriod
  weather: ReturnType<typeof useLocalWeather>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const weather = useLocalWeather()
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = window.localStorage.getItem('island-theme')
    return saved === 'day' || saved === 'night' ? saved : 'auto'
  })
  const isNaturalNight = weather.period === 'dawn' || weather.period === 'evening'
  const effectiveTheme = mode === 'auto' ? (isNaturalNight ? 'night' : 'day') : mode
  const scenePeriod: TimePeriod = mode === 'day' ? 'morning' : mode === 'night' ? 'evening' : weather.period

  useEffect(() => {
    window.localStorage.setItem('island-theme', mode)
    document.documentElement.dataset.theme = effectiveTheme
    document.documentElement.dataset.themeMode = mode
    document.documentElement.dataset.weather = weather.kind
  }, [effectiveTheme, mode, weather.kind])

  const value = useMemo(() => ({ mode, setMode, effectiveTheme, scenePeriod, weather }), [mode, effectiveTheme, scenePeriod, weather])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
