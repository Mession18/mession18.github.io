import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocalWeather, type TimePeriod } from '../hooks/useLocalWeather'
import { ThemeContext, type ThemeMode, type WeatherOverride } from './ThemeState'

/** 合并真实天气、测试覆盖及日夜模式，向所有组件提供统一主题状态。 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  /** 读取实时天气；临时覆盖优先于自动模式，测试面板可在不改系统时间的情况下预览。 */
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
  /** 根据覆盖天气、自动昼夜或手动模式决定最终 day/night 主题。 */
  const effectiveTheme = weatherOverride
    ? isNaturalNight
      ? 'night'
      : 'day'
    : mode === 'auto'
      ? isNaturalNight
        ? 'night'
        : 'day'
      : mode
  /** 手动日夜模式固定首屏时间段；自动模式使用天气地点的当地时间。 */
  const scenePeriod: TimePeriod =
    weatherOverride !== null
      ? weather.period
      : mode === 'day'
        ? 'morning'
        : mode === 'night'
          ? 'evening'
          : weather.period

  // 把主题与天气状态同步为根元素 data 属性，CSS 据此切换配色和场景。
  useEffect(() => {
    window.localStorage.setItem('island-theme', mode)
    document.documentElement.dataset.theme = effectiveTheme
    document.documentElement.dataset.themeMode = mode
    document.documentElement.dataset.weather = weather.kind
    document.documentElement.dataset.scenePeriod = scenePeriod
  }, [effectiveTheme, mode, scenePeriod, weather.kind])

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
