import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocalWeather } from '../hooks/useLocalWeather'
import { calculateSky, clockLabel, dateAtZone, scenePalette } from '../shared/utils'
import { ThemeContext, type ClockOverride, type WeatherOverride } from './ThemeState'

/** 统一真实时钟、天气覆盖和天文状态；所有页面共享相同的主题与控制器。 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const liveWeather = useLocalWeather()
  const [weatherOverride, setWeatherOverride] = useState<WeatherOverride>(null)
  const [clockOverride, setClockOverride] = useState<ClockOverride>(null)
  const { now, latitude, longitude, timezone } = liveWeather
  const sky = useMemo(
    () =>
      calculateSky(
        clockOverride ? dateAtZone(clockOverride.date, clockOverride.minutes, timezone) : now,
        latitude,
        longitude,
        timezone,
      ),
    [clockOverride, now, latitude, longitude, timezone],
  )
  const weather = useMemo(
    () => ({
      ...liveWeather,
      ...weatherOverride,
      loading: weatherOverride ? false : liveWeather.loading,
      period: sky.period,
      time: clockLabel(sky.minutes),
    }),
    [liveWeather, weatherOverride, sky],
  )

  const displayedTone = useRef<number | null>(null)

  // 时间阶段与天文状态同步；色调单独逐帧更新，保证过渡途中也经过对比度检查。
  useEffect(() => {
    const { dataset } = document.documentElement
    dataset.weather = weather.kind
    dataset.scenePeriod = sky.period
    dataset.skyStage = sky.stage
  }, [sky.period, sky.stage, weather.kind])

  useEffect(() => {
    const root = document.documentElement
    const start = displayedTone.current ?? sky.tone
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800
    const began = performance.now()
    let frame = 0
    root.dataset.paletteChanging = 'true'
    const tick = (now: number) => {
      const progress = duration ? Math.min(1, (now - began) / duration) : 1
      const eased = progress * progress * (3 - 2 * progress)
      const tone = start + (sky.tone - start) * eased
      displayedTone.current = tone
      const palette = scenePalette(tone, weather.kind)
      root.dataset.theme = palette['--text-scheme'] === 'dark' ? 'night' : 'day'
      for (const [key, value] of Object.entries(palette)) root.style.setProperty(key, value)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else
        frame = requestAnimationFrame(() => {
          delete root.dataset.paletteChanging
        })
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      delete root.dataset.paletteChanging
    }
  }, [sky.tone, weather.kind])

  const value = useMemo(
    () => ({
      scenePeriod: sky.period,
      sky,
      weather,
      weatherOverride,
      setWeatherOverride,
      clockOverride,
      setClockOverride,
    }),
    [sky, weather, weatherOverride, clockOverride],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
