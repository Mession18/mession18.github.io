import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocalWeather } from '../hooks/useLocalWeather'
import { ThemeContext, type WeatherOverride } from './ThemeState'

/** 合并真实天气与面板覆盖，按最终时间段计算日夜并提供统一场景状态。 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  /** 读取实时天气；临时覆盖优先于自动模式，测试面板可在不改系统时间的情况下预览。 */
  const liveWeather = useLocalWeather()
  const [weatherOverride, setWeatherOverride] = useState<WeatherOverride>(null)
  const weather = useMemo(
    () =>
      weatherOverride
        ? { ...liveWeather, ...weatherOverride, loading: false, city: '天气测试岛' }
        : liveWeather,
    [liveWeather, weatherOverride],
  )
  const isNaturalNight = weather.period === 'dawn' || weather.period === 'evening'
  /** 场景只由实时天气或面板覆盖决定；旧三档开关已无界面入口，不再保存闲置状态。 */
  const effectiveTheme = isNaturalNight ? 'night' : 'day'
  const scenePeriod = weather.period

  // 把主题与天气状态同步为根元素 data 属性，CSS 据此切换配色和场景。
  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme
    document.documentElement.dataset.weather = weather.kind
    document.documentElement.dataset.scenePeriod = scenePeriod
  }, [effectiveTheme, scenePeriod, weather.kind])

  const value = useMemo(
    () => ({
      scenePeriod,
      weather,
      weatherOverride,
      setWeatherOverride,
    }),
    [scenePeriod, weather, weatherOverride],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
