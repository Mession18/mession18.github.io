import { useEffect, useMemo, useState } from 'react'

/** 页面支持的天气种类，与 CSS data-weather 选择器保持对应。 */
export type WeatherKind = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunder'
/** 雨雪强度的三个等级，用于粒子数量和动画变化。 */
export type WeatherIntensity = 'light' | 'moderate' | 'heavy'
/** 首屏支持的五个时间段，与 data-scene-period 对应。 */
export type TimePeriod = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening'

/** 天气接口原始数据及加载状态，后续据此计算中文时钟和场景。 */
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

/** 把天气服务的数字代码转换成页面支持的天气分类。 */
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
  /** 维护当前时刻和天气初始值，请求失败时仍可显示完整首屏。 */
  const [now, setNow] = useState(new Date())
  const [state, setState] = useState<WeatherState>({
    forecast: [],
    forecastLoading: true,
    city: '风铃岛',
    temperature: 28,
    windSpeed: 8,
    weatherCode: 0,
    precipitation: 0,
    snowfall: 0,
    timezone: fallbackTimezone,
    latitude: 31.23,
    longitude: 121.47,
    located: false,
    loading: true,
  })

  // 每 30 秒更新本地时钟，卸载时停止计时器。
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // 先用 IP 定位再请求该坐标的天气；中止控制器在卸载时取消未完成请求。
  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      controller.abort()
      setState((current) => ({ ...current, loading: false, forecastLoading: false }))
    }, 10_000)
    async function loadWeather() {
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
        setState((current) => ({
          ...current,
          latitude,
          longitude,
          located: true,
          city: geo.city || geo.region || '当前位置',
          timezone: geo.timezone || fallbackTimezone,
        }))
        const query = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          current: 'temperature_2m,weather_code,wind_speed_10m,precipitation,rain,snowfall',
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
            precipitation?: number
            snowfall?: number
          }
        }
        setState({
          forecastLoading: false,
          forecast: (weather.daily?.time ?? []).map((date, index) => ({
            date,
            code: weather.daily?.weather_code?.[index] ?? null,
            low: weather.daily?.temperature_2m_min?.[index] ?? null,
            high: weather.daily?.temperature_2m_max?.[index] ?? null,
            rain: weather.daily?.precipitation_probability_max?.[index] ?? null,
          })),
          latitude,
          longitude,
          located: true,
          city: geo.city || geo.region || '当前位置',
          temperature: Math.round(weather.current?.temperature_2m ?? 28),
          windSpeed: Math.round(weather.current?.wind_speed_10m ?? 8),
          weatherCode: weather.current?.weather_code ?? 0,
          precipitation: weather.current?.precipitation ?? 0,
          snowfall: weather.current?.snowfall ?? 0,
          timezone: weather.timezone || geo.timezone || fallbackTimezone,
          loading: false,
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError')
          setState((current) => ({ ...current, loading: false, forecastLoading: false }))
      }
    }
    void loadWeather().finally(() => window.clearTimeout(timeout))
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return useMemo(() => {
    let kind = weatherKind(state.weatherCode)
    const intensity = weatherIntensity(state.weatherCode, kind, state.precipitation, state.snowfall)
    if (kind === 'rain' && intensity === 'heavy') kind = 'thunder'
    return {
      ...state,
      now,
      kind,
      intensity,
    }
  }, [now, state])
}
