export function formatChineseDate(date?: string) {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${year}年${Number(month)}月${Number(day)}日`
}

export function formatDateRange(startDate?: string, finalDate?: string) {
  if (!startDate) return finalDate ?? ''
  if (!finalDate || finalDate === startDate) return startDate
  return `${startDate} - ${finalDate}`
}

export function splitDisplayDate(date?: string) {
  if (!date) return undefined
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return { year: date, monthDay: '' }
  return { year, monthDay: `${Number(month)}月${Number(day)}日` }
}
