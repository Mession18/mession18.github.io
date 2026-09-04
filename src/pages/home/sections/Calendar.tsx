import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTheme } from '../../../context/useTheme'
import { calendarDay, zonedClock } from '../../../shared/utils'

/** 日历只浏览日期，不修改场景时间；月份状态在每次重新打开时回到当前场景日期。 */
export function Calendar({
  onClose,
  anchor,
}: {
  onClose: () => void
  anchor: RefObject<HTMLButtonElement | null>
}) {
  const { sky, weather } = useTheme()
  const [selected, setSelected] = useState(sky.date)
  const [month, setMonth] = useState(sky.date.slice(0, 7))
  const dialog = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 170, right: 16 })
  const today = zonedClock(weather.now, weather.timezone).date
  const [year, monthNumber] = month.split('-').map(Number)
  const start = new Date(Date.UTC(year, monthNumber - 1, 1))
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const offset = (start.getUTCDay() + 6) % 7
  const details = calendarDay(selected)
  const forecast = weather.forecast.find((day) => day.date === selected)

  // 浮层挂到 body，避免首屏 overflow 裁切；跟随入口位置，背景保持可滚动和交互。
  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect()
      if (rect)
        setPosition({
          top: Math.max(16, Math.min(rect.bottom + 10, window.innerHeight - 180)),
          right: Math.max(16, window.innerWidth - rect.right),
        })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor])
  // 点击外部或按 Esc 收起浮层；键盘关闭时将焦点还给入口。
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!dialog.current?.contains(target) && !anchor.current?.contains(target)) onClose()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        anchor.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [anchor, onClose])
  function moveMonth(direction: number) {
    const next = new Date(Date.UTC(year, monthNumber - 1 + direction, 1))
    setMonth(next.toISOString().slice(0, 7))
  }
  // 缺失预报不冒充晴天或零度，WMO 代码转换为简短中文。
  function forecastLabel(code: number | null) {
    if (code === null) return '天气暂无'
    if (code >= 95) return '雷雨'
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '雪'
    if (code >= 51) return '雨'
    if (code >= 45) return '雾'
    return code === 0 ? '晴' : '多云'
  }
  const temperature = (value: number | null) => (value === null ? '—' : `${Math.round(value)}°`)
  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      className="island-calendar"
      aria-labelledby="calendar-title"
      style={{
        top: position.top,
        right: position.right,
        maxHeight: `calc(100dvh - ${position.top + 16}px)`,
      }}
    >
      {/* 标题与月份导航独立于日期选择，支持跨年切换及返回今天。 */}
      <header>
        <div>
          <small>风铃岛 · 日历</small>
          <h2 id="calendar-title">
            {year} 年 {monthNumber} 月
          </h2>
        </div>
        <button aria-label="关闭日历" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <nav aria-label="日历月份">
        <button aria-label="上个月" disabled={month === '1900-01'} onClick={() => moveMonth(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => {
            setMonth(today.slice(0, 7))
            setSelected(today)
          }}
        >
          回到今天
        </button>
        <button aria-label="下个月" disabled={month === '2100-12'} onClick={() => moveMonth(1)}>
          <ChevronRight size={18} />
        </button>
      </nav>
      {/* 一周从周一开始；空位不进入键盘焦点，节日与农历在同一日期格内显示。 */}
      <div className="calendar-week">
        {'一二三四五六日'.split('').map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: count }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, '0')}`
          const info = calendarDay(date)
          return (
            <button
              key={date}
              aria-label={`${date} ${info.lunar} ${info.festival}`}
              aria-pressed={selected === date}
              aria-current={date === today ? 'date' : undefined}
              className={info.festival ? 'has-festival' : ''}
              onClick={() => setSelected(date)}
            >
              <b>
                {index + 1}
                {date === today && <i aria-hidden="true">·</i>}
              </b>
              <small>{info.festival || info.short}</small>
            </button>
          )
        })}
      </div>
      <section className="calendar-detail" aria-live="polite">
        <strong>
          {selected} · {details.lunar}
        </strong>
        {details.festival && <p>{details.festival}</p>}
        <p>
          {forecast
            ? `${forecastLabel(forecast.code)} · ${temperature(forecast.low)}～${temperature(forecast.high)} · 降水概率 ${forecast.rain === null ? '暂无' : `${forecast.rain}%`}`
            : '该日期暂无天气预报'}
        </p>
      </section>
      {/* 七日预报与当前模拟日期无关，始终展示接口返回的真实日期。 */}
      <section className="calendar-forecast">
        <h3>{weather.city} · 未来 7 天</h3>
        {weather.forecastLoading ? (
          <p role="status">正在获取预报…</p>
        ) : weather.forecast.length ? (
          <div className="forecast-days">
            {weather.forecast.map((day) => (
              <button
                key={day.date}
                onClick={() => {
                  setSelected(day.date)
                  setMonth(day.date.slice(0, 7))
                }}
              >
                <small>{day.date.slice(5)}</small>
                <span>{forecastLabel(day.code)}</span>
                <b>
                  {temperature(day.low)}～{temperature(day.high)}
                </b>
              </button>
            ))}
          </div>
        ) : (
          <p role="status">暂时无法获取预报，请稍后刷新重试。</p>
        )}
        <small>
          节日标记不代表调休安排 · 预报来自{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
        </small>
      </section>
    </div>,
    document.body,
  )
}
