import { calendarDay } from '../../../shared/dates'

// 香港天文台公历/农历对照表的清明日期，逐年读取官方文本：1901–2100（UTC+8）。
// https://www.hko.gov.hk/tc/gts/time/conversion.htm
// https://www.hko.gov.hk/tc/gts/time/calendar/text/files/T2026c.txt
// 每一位为该年 4 月的日期；范围外不猜测节气。这里只决定装饰窗口，不是放假日历。
const QINGMING_DAYS =
  '56655665566555655565556555655565556555655565555555555555555555555555555555545554555455545554555455545554555445544554455445544554455445544554445444544454445444544454445444544444444444444444444444444445'

const lunarFestivals = [
  { id: 'lantern-festival', label: '元宵', name: '元宵节', before: 2, after: 2 },
  { id: 'spring-festival', label: '新春', name: '春节', before: 1, after: 11 },
  { id: 'dragon-boat', label: '端午', name: '端午节', before: 2, after: 2 },
  { id: 'mid-autumn', label: '中秋', name: '中秋节', before: 2, after: 2 },
  { id: 'double-ninth', label: '重阳', name: '重阳节', before: 2, after: 2 },
] as const

/** 装饰日历：元旦 12/30–1/3，圣诞 12/18–26；新春除夕–正月十二，元宵正月十三–十七。
 * 农历匹配复用 calendarDay，所以不会在闰月重复触发；清明为节气当日前后一天。
 * 万圣 10/25–11/2；与重阳装饰窗口重叠时，传统农历节日优先。
 */
export function islandFestival(date: string) {
  const instant = new Date(`${date}T12:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(instant.getTime()) ||
    instant.toISOString().slice(0, 10) !== date
  )
    return null
  const monthDay = date.slice(5)
  if (monthDay >= '12-30' || monthDay <= '01-03') return { id: 'new-year', label: '元旦' } as const
  if (monthDay >= '12-18' && monthDay <= '12-26') return { id: 'christmas', label: '圣诞' } as const
  const year = instant.getUTCFullYear()
  const qingming = Number(QINGMING_DAYS[year - 1901])
  if (instant.getUTCMonth() === 3 && Math.abs(instant.getUTCDate() - qingming) <= 1)
    return { id: 'qingming', label: '清明' } as const
  // 最多检查 14 个日历日期，保持农历换算只有共享工具这一处来源。
  for (let offset = -11; offset <= 2; offset++) {
    const day = new Date(instant.getTime() + offset * 86_400_000).toISOString().slice(0, 10)
    const names = calendarDay(day).festival.split(' · ')
    const match = lunarFestivals.find(
      ({ name, before, after }) => offset >= -after && offset <= before && names.includes(name),
    )
    if (match) return { id: match.id, label: match.label }
  }
  if (monthDay >= '10-25' && monthDay <= '11-02')
    return { id: 'halloween', label: '万圣节' } as const
  return null
}
