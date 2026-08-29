import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTheme } from '../context/ThemeContext'

type ParticleStyle = CSSProperties & Record<`--${string}`, string>

type Meteor = {
  id: number
  left: number
  top: number
  duration: number
  delay: number
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function AmbientWeather() {
  const { mode, weather } = useTheme()
  const [meteors, setMeteors] = useState<Meteor[]>([])
  const nextMeteorId = useRef(0)
  const timers = useRef<number[]>([])
  const isAutomatic = mode === 'auto' && !weather.loading
  const isClearNight =
    isAutomatic &&
    weather.kind === 'clear' &&
    (weather.period === 'dawn' || weather.period === 'evening')

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        style: {
          '--x': `${randomBetween(0, 100).toFixed(2)}vw`,
          '--delay': `${randomBetween(-2.4, 0).toFixed(2)}s`,
          '--duration': `${randomBetween(0.65, 1.05).toFixed(2)}s`,
          '--length': `${randomBetween(14, 28).toFixed(0)}px`,
          '--opacity': randomBetween(0.16, 0.38).toFixed(2),
        } as ParticleStyle,
      })),
    [],
  )

  const snowflakes = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => {
        const drift = randomBetween(-45, 45)
        return {
          id: index,
          style: {
            '--x': `${randomBetween(0, 100).toFixed(2)}vw`,
            '--drift': `${drift.toFixed(0)}px`,
            '--return-drift': `${(-drift * 0.35).toFixed(0)}px`,
            '--delay': `${randomBetween(-10, 0).toFixed(2)}s`,
            '--duration': `${randomBetween(6, 11).toFixed(2)}s`,
            '--size': `${randomBetween(3, 8).toFixed(1)}px`,
            '--opacity': randomBetween(0.25, 0.62).toFixed(2),
          } as ParticleStyle,
        }
      }),
    [],
  )

  useEffect(() => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setMeteors([])
    if (!isClearNight) return

    function scheduleBurst() {
      const wait = randomBetween(8_000, 18_000)
      const timer = window.setTimeout(() => {
        const count = Math.random() < 0.72 ? 1 : 2
        const burst = Array.from({ length: count }, (_, index) => ({
          id: nextMeteorId.current++,
          left: randomBetween(18, 78),
          top: randomBetween(5, 36),
          duration: randomBetween(0.75, 1.15),
          delay: index * randomBetween(0.35, 0.75),
        }))
        setMeteors(burst)
        const clearTimer = window.setTimeout(() => setMeteors([]), 2_400)
        timers.current.push(clearTimer)
        scheduleBurst()
      }, wait)
      timers.current.push(timer)
    }

    scheduleBurst()
    return () => {
      timers.current.forEach(window.clearTimeout)
      timers.current = []
    }
  }, [isClearNight])

  if (!isAutomatic) return null

  const showRain = weather.kind === 'rain' || weather.kind === 'thunder'
  const showSnow = weather.kind === 'snow'
  if (!showRain && !showSnow && !isClearNight) return null

  return (
    <div className="ambient-weather" aria-hidden="true">
      {showRain && (
        <div className="ambient-rain">
          {rainDrops.map((drop) => (
            <i key={drop.id} style={drop.style} />
          ))}
        </div>
      )}
      {showSnow && (
        <div className="ambient-snow">
          {snowflakes.map((flake) => (
            <i key={flake.id} style={flake.style} />
          ))}
        </div>
      )}
      {isClearNight && (
        <div className="ambient-meteors">
          {meteors.map((meteor) => (
            <i
              key={meteor.id}
              style={
                {
                  '--x': `${meteor.left}vw`,
                  '--y': `${meteor.top}vh`,
                  '--duration': `${meteor.duration}s`,
                  '--delay': `${meteor.delay}s`,
                } as ParticleStyle
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
