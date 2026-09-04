import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTheme } from '../../context/useTheme'

/** 粒子样式同时支持 React CSS 属性和 --x 等动画自定义变量。 */
type ParticleStyle = CSSProperties & Record<`--${string}`, string>

/** 记录单颗流星的唯一编号、起点和动画时间，用于渲染及清理。 */
type Meteor = {
  id: number
  left: number
  top: number
  duration: number
  delay: number
}

/** 返回给定区间内的随机数，让粒子位置和动画节奏有所变化。 */
function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

/** 根据全站天气生成雨雪或晴夜流星；定时任务随场景退出清理。 */
export function AmbientWeather() {
  const { mode, weather, weatherOverride } = useTheme()
  const [meteors, setMeteors] = useState<Meteor[]>([])
  const nextMeteorId = useRef(0)
  const timers = useRef<number[]>([])
  const isAutomatic = (mode === 'auto' || weatherOverride !== null) && !weather.loading
  const isClearNight =
    isAutomatic &&
    weather.kind === 'clear' &&
    (weather.period === 'dawn' || weather.period === 'evening')

  /** 一次生成雨滴的随机位置、速度和尺寸；天气强度只改变实际显示数量。 */
  const rainDrops = useMemo(
    () =>
      Array.from({ length: 84 }, (_, index) => {
        const size = randomBetween(3.5, 6)
        return {
          id: index,
          style: {
            '--x': `${randomBetween(0, 100).toFixed(2)}vw`,
            '--landing': `${randomBetween(72, 103).toFixed(1)}vh`,
            '--delay': `${randomBetween(-2.8, 0).toFixed(2)}s`,
            '--duration': `${randomBetween(0.85, 1.35).toFixed(2)}s`,
            '--size': `${size.toFixed(1)}px`,
            '--height': `${(size * 1.45).toFixed(1)}px`,
            '--opacity': randomBetween(0.2, 0.48).toFixed(2),
          } as ParticleStyle,
        }
      }),
    [],
  )

  /** 一次生成雪花的漂移和速度参数，重绘时复用以避免动画跳动。 */
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 68 }, (_, index) => {
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

  // 仅晴朗夜间安排间歇流星，场景变化或卸载时清空所有待执行计时器。
  useEffect(() => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
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
  const rainCount = weather.intensity === 'heavy' ? 84 : weather.intensity === 'moderate' ? 52 : 28
  const snowCount = weather.intensity === 'heavy' ? 68 : weather.intensity === 'moderate' ? 44 : 24
  if (!showRain && !showSnow && !isClearNight) return null

  return (
    <div className="ambient-weather" aria-hidden="true">
      {showRain && (
        <div className="ambient-rain">
          {rainDrops.slice(0, rainCount).map((drop) => (
            <i key={drop.id} style={drop.style} />
          ))}
        </div>
      )}
      {showSnow && (
        <div className="ambient-snow">
          {snowflakes.slice(0, snowCount).map((flake) => (
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
