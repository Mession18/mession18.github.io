import { useEffect, useMemo, useState } from 'react'
import { sceneWind } from '../shared/wind'

/** 页面支持的天气种类，与 CSS data-weather 选择器保持对应。 */
export type WeatherKind = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunder'
/** 雨雪强度的三个等级，用于粒子数量和动画变化。 */
export type WeatherIntensity = 'light' | 'moderate' | 'heavy'

type WeatherState = {
  forecast: {
    date: string
    code: number | null
    low: number | null
    high: number | null
    rain: number | null
  }[]
  forecastLoading: boolean
  city: string
  temperature: number
  windSpeed: number
  windGusts: number
  windDirection: number
  weatherCode: number
  precipitation: number
  snowfall: number
  timezone: string
  latitude: number
  longitude: number
  located: boolean
  loading: boolean
}

/** 定位失败时明确使用上海坐标及其时区，不能将未知坐标与电脑时区混用。 */
const fallbackTimezone = 'Asia/Shanghai'

function weatherKind(code: number): WeatherKind {
  if (code >= 95) return 'thunder'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 1 && code <= 3) return 'cloudy'
  return 'clear'
}

/** 结合天气代码和雨雪量确定视觉强度；阈值调整会影响粒子效果。 */
function weatherIntensity(
  code: number,
  kind: WeatherKind,
  precipitation: number,
  snowfall: number,
): WeatherIntensity {
  if (kind === 'thunder' || code === 65 || code === 75 || code === 82 || code === 86) return 'heavy'
  if (kind === 'snow') {
    if (snowfall >= 2.5) return 'heavy'
    return snowfall >= 1 || code === 73 ? 'moderate' : 'light'
  }
  if (kind === 'rain') {
    if (precipitation >= 8) return 'heavy'
    return precipitation >= 4 || code === 63 || code === 81 ? 'moderate' : 'light'
  }
  return 'light'
}

/** 根据 IP 获取地区和天气，并以当地时区更新时钟；请求失败保留初始场景。 */
export function useLocalWeather() {
  const [now, setNow] = useState(new Date())
  const [state, setState] = useState<WeatherState>({
    forecast: [],
    forecastLoading: true,
    city: '风铃岛',
    temperature: 28,
    windSpeed: 8,
    windGusts: 8,
    windDirection: 0,
    weatherCode: 0,
    precipitation: 0,
    snowfall: 0,
    timezone: fallbackTimezone,
    latitude: 31.23,
    longitude: 121.47,
    located: false,
    loading: true,
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // IP 只定位一次；后续天气刷新继续使用这组坐标。
  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      controller.abort()
      setState((current) => ({ ...current, loading: false, forecastLoading: false }))
    }, 10_000)
    async function locate() {
      try {
        const geoResponse = await fetch('https://get.geojs.io/v1/ip/geo.json', {
          signal: controller.signal,
        })
        if (!geoResponse.ok) throw new Error('Location lookup failed')
        const geo = (await geoResponse.json()) as {
          city?: string
          region?: string
          latitude?: string | number
          longitude?: string | number
          timezone?: string
        }
        const latitude = Number(geo.latitude)
        const longitude = Number(geo.longitude)
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
          throw new Error('Location coordinates unavailable')
        if (controller.signal.aborted) return
        setState((current) => ({
          ...current,
          latitude,
          longitude,
          located: true,
          city: geo.city || geo.region || '当前位置',
          timezone: geo.timezone || fallbackTimezone,
        }))
      } catch (error) {
        if ((error as Error).name !== 'AbortError')
          setState((current) => ({ ...current, loading: false, forecastLoading: false }))
      }
    }
    void locate().finally(() => window.clearTimeout(timeout))
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  // 每 15 分钟刷新实况风雨与气温；独立请求有超时，失败保留上一份数据。
  useEffect(() => {
    if (!state.located) return
    let activeController: AbortController | undefined
    let timeout = 0
    async function loadWeather() {
      const controller = new AbortController()
      activeController = controller
      timeout = window.setTimeout(() => {
        controller.abort()
        setState((current) => ({ ...current, loading: false, forecastLoading: false }))
      }, 10_000)
      try {
        const query = new URLSearchParams({
          latitude: String(state.latitude),
          longitude: String(state.longitude),
          current:
            'temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,rain,snowfall',
          wind_speed_unit: 'kmh',
          // 日历复用这次请求的七日预报，切换月份不重复请求，也不伪造历史天气。
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
          forecast_days: '7',
          timezone: 'auto',
        })
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
          signal: controller.signal,
        })
        if (!weatherResponse.ok) throw new Error('Weather lookup failed')
        const weather = (await weatherResponse.json()) as {
          daily?: {
            time: string[]
            weather_code: (number | null)[]
            temperature_2m_min: (number | null)[]
            temperature_2m_max: (number | null)[]
            precipitation_probability_max: (number | null)[]
          }
          timezone?: string
          current?: {
            temperature_2m?: number
            weather_code?: number
            wind_speed_10m?: number
            wind_gusts_10m?: number
            wind_direction_10m?: number
            precipitation?: number
            snowfall?: number
          }
        }
        if (controller.signal.aborted) return
        setState((current) => {
          const wind = sceneWind({
            windSpeed: weather.current?.wind_speed_10m ?? current.windSpeed,
            windGusts: weather.current?.wind_gusts_10m,
            windDirection: weather.current?.wind_direction_10m ?? current.windDirection,
          })
          return {
            ...current,
            forecastLoading: false,
            forecast: (weather.daily?.time ?? []).map((date, index) => ({
              date,
              code: weather.daily?.weather_code?.[index] ?? null,
              low: weather.daily?.temperature_2m_min?.[index] ?? null,
              high: weather.daily?.temperature_2m_max?.[index] ?? null,
              rain: weather.daily?.precipitation_probability_max?.[index] ?? null,
            })),
            temperature: weather.current?.temperature_2m ?? current.temperature,
            windSpeed: Math.round(wind.speed),
            windGusts: Math.round(wind.gusts),
            windDirection: wind.direction,
            weatherCode: weather.current?.weather_code ?? 0,
            precipitation: weather.current?.precipitation ?? 0,
            snowfall: weather.current?.snowfall ?? 0,
            timezone: weather.timezone || current.timezone,
            loading: false,
          }
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError')
          setState((current) => ({ ...current, loading: false, forecastLoading: false }))
      } finally {
        window.clearTimeout(timeout)
      }
    }
    void loadWeather()
    const interval = window.setInterval(() => void loadWeather(), 15 * 60_000)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
      activeController?.abort()
    }
  }, [state.located, state.latitude, state.longitude])

  return useMemo(() => {
    const kind = weatherKind(state.weatherCode)
    const intensity = weatherIntensity(state.weatherCode, kind, state.precipitation, state.snowfall)
    return {
      ...state,
      now,
      kind,
      intensity,
    }
  }, [now, state])
}
