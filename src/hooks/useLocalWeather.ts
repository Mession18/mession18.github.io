import { useEffect, useMemo, useState } from 'react'

export type WeatherKind = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunder'
export type TimePeriod = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening'

type WeatherState = {
  city: string
  temperature: number
  windSpeed: number
  weatherCode: number
  timezone: string
  loading: boolean
}

const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'

function weatherKind(code: number): WeatherKind {
  if (code >= 95) return 'thunder'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 1 && code <= 3) return 'cloudy'
  return 'clear'
}

function timePeriod(hour: number): TimePeriod {
  if (hour < 6) return 'dawn'
  if (hour < 11) return 'morning'
  if (hour < 14) return 'noon'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function useLocalWeather() {
  const [now, setNow] = useState(new Date())
  const [state, setState] = useState<WeatherState>({ city: '风铃岛', temperature: 28, windSpeed: 8, weatherCode: 0, timezone: fallbackTimezone, loading: true })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function loadWeather() {
      try {
        const geoResponse = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controller.signal })
        if (!geoResponse.ok) throw new Error('Location lookup failed')
        const geo = await geoResponse.json() as { city?: string; region?: string; latitude?: string | number; longitude?: string | number; timezone?: string }
        const latitude = Number(geo.latitude)
        const longitude = Number(geo.longitude)
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Location coordinates unavailable')
        const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,weather_code,wind_speed_10m', timezone: 'auto' })
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: controller.signal })
        if (!weatherResponse.ok) throw new Error('Weather lookup failed')
        const weather = await weatherResponse.json() as { timezone?: string; current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number } }
        setState({ city: geo.city || geo.region || '当前位置', temperature: Math.round(weather.current?.temperature_2m ?? 28), windSpeed: Math.round(weather.current?.wind_speed_10m ?? 8), weatherCode: weather.current?.weather_code ?? 0, timezone: weather.timezone || geo.timezone || fallbackTimezone, loading: false })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState((current) => ({ ...current, loading: false }))
      }
    }
    loadWeather()
    return () => controller.abort()
  }, [])

  return useMemo(() => {
    const hourText = new Intl.DateTimeFormat('en-GB', { timeZone: state.timezone, hour: '2-digit', hour12: false }).format(now)
    const hour = Number(hourText) % 24
    return {
      ...state,
      time: new Intl.DateTimeFormat('zh-CN', { timeZone: state.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(now),
      kind: weatherKind(state.weatherCode),
      period: timePeriod(hour),
    }
  }, [now, state])
}
