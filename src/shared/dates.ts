/** 把 YYYY-MM-DD 拆为中文年月日；不完整的值按原文显示。 */
export function formatChineseDate(date?: string) {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${year}年${Number(month)}月${Number(day)}日`
}

/** 组合开始与结束日期；只有一个日期或两者相同则避免重复显示。 */
export function formatDateRange(startDate?: string, finalDate?: string) {
  if (!startDate) return finalDate ?? ''
  if (!finalDate || finalDate === startDate) return startDate
  return `${startDate} - ${finalDate}`
}

/** 把日期拆成年份与月日两部分，方便工作台左右台历分别排版。 */
export function splitDisplayDate(date?: string) {
  if (!date) return undefined
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return { year: date, monthDay: '' }
  return { year, monthDay: `${Number(month)}月${Number(day)}日` }
}

/** 按定位时区取得日历日期与分钟数，不受访客电脑的时区设置影响。 */
export function zonedClock(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const part = (name: string) => parts.find((entry) => entry.type === name)!.value
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  }
}

/** 把滑条分钟数显示为 00:00–24:00；1440 明确表示所选日期结束的午夜。 */
export function clockLabel(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
}

/** 定位时区的日历时间转 UTC。夏令时重复小时取较早一次；缺失小时顺延到有效时间。 */
export function dateAtZone(date: string, minutes: number, timezone: string) {
  const wall = Date.parse(`${date}T00:00:00Z`) + minutes * 60_000
  const wallStamp = (instant: number) => {
    const clock = zonedClock(new Date(instant), timezone)
    return Date.parse(`${clock.date}T00:00:00Z`) + clock.minutes * 60_000
  }
  // 前后各一天覆盖夏令时跳变前后的偏移，避免只按当前偏移推算其他季节。
  const offsets = [
    ...new Set(
      [-1, 0, 1].map((day) => {
        const probe = wall + day * 86_400_000
        return wallStamp(probe) - probe
      }),
    ),
  ]
  const candidates = offsets.map((offset) => wall - offset).sort((a, b) => a - b)
  const exact = candidates.find((instant) => wallStamp(instant) === wall)
  return new Date(exact ?? candidates.find((instant) => wallStamp(instant) > wall) ?? candidates[0])
}

/** 农历使用浏览器内置中国历；固定在 UTC 正午转换日期，避免浏览器时区造成串日。 */
const chineseCalendar = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})
function chineseDateParts(instant: Date) {
  const date = instant.toISOString().slice(0, 10)
  // ICU4C（包括 78.3）把 2027 正月起点算晚一天；换 UTC/上海时区都不能修复。
  // HKO 官方该月为 2/6–3/7；这里统一修复日历与“看次日”的除夕判定。
  // https://www.hko.gov.hk/tc/gts/time/calendar/text/files/T2027c.txt
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1912511#c8
  // ponytail: 只修正已核对的月份；其他历史区间需官方逐月验证后再扩展。
  if (date >= '2027-02-06' && date < '2027-03-08') {
    return {
      month: '正月',
      day: Math.floor((instant.getTime() - Date.UTC(2027, 1, 6)) / 86_400_000) + 1,
    }
  }
  const parts = chineseCalendar.formatToParts(instant)
  return {
    month: parts.find((part) => part.type === 'month')?.value ?? '',
    day: Number(parts.find((part) => part.type === 'day')?.value),
  }
}
export function calendarDay(date: string) {
  const instant = new Date(`${date}T12:00:00Z`)
  const { month, day } = chineseDateParts(instant)
  const digits = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const lunarDay =
    day <= 10
      ? `初${digits[day - 1]}`
      : day < 20
        ? `十${digits[day - 11]}`
        : day === 20
          ? '二十'
          : day < 30
            ? `廿${digits[day - 21]}`
            : '三十'
  // 节日只匹配正常农历月份，闰月不会重复过节；除夕通过次日是否正月初一判定。
  const solar: Record<string, string> = {
    '01-01': '元旦',
    '05-01': '劳动节',
    '06-01': '儿童节',
    '10-01': '国庆节',
  }
  const lunar: Record<string, string> = {
    '正月-1': '春节',
    '正月-15': '元宵节',
    '五月-5': '端午节',
    '七月-7': '七夕',
    '八月-15': '中秋节',
    '九月-9': '重阳节',
    '腊月-8': '腊八节',
  }
  instant.setUTCDate(instant.getUTCDate() + 1)
  const tomorrow = chineseDateParts(instant)
  const eve = tomorrow.month === '正月' && tomorrow.day === 1
  const festival = [solar[date.slice(5)], lunar[`${month}-${day}`], eve ? '除夕' : '']
    .filter(Boolean)
    .join(' · ')
  return { lunar: `${month}${lunarDay}`, short: day === 1 ? month : lunarDay, festival }
}
