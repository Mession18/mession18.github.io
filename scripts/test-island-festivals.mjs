import assert from 'node:assert/strict'
import { loadModule } from './load-module.mjs'

const { islandFestival } = await loadModule('/src/pages/home/sections/island-festivals.ts')
const { calendarDay } = await loadModule('/src/shared/dates.ts')
const id = (date) => islandFestival(date)?.id ?? null
const shift = (date, days) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)

// 2027 正月为 ICU4C 的已知偏差，修正在共享农历源，节日无需自己的特殊分支。
for (const [date, lunar] of [
  ['2027-02-04', '腊月廿八'],
  ['2027-02-05', '腊月廿九'],
  ['2027-02-06', '正月初一'],
  ['2027-02-07', '正月初二'],
  ['2027-02-20', '正月十五'],
  ['2027-03-07', '正月三十'],
  ['2027-03-08', '二月初一'],
])
  assert.equal(calendarDay(date).lunar, lunar)
assert.match(calendarDay('2027-02-05').festival, /除夕/)
assert.match(calendarDay('2027-02-06').festival, /春节/)
assert.match(calendarDay('2027-02-20').festival, /元宵节/)

// 官方日期核对：https://www.hko.gov.hk/tc/gts/time/calendar/text/files/T2026c.txt
// https://www.hko.gov.hk/tc/gts/time/calendar/text/files/T2027c.txt
for (const [date, expected, before, after] of [
  ['2026-02-17', 'spring-festival', 1, 11],
  ['2027-02-06', 'spring-festival', 1, 11],
  ['2026-03-03', 'lantern-festival', 2, 2],
  ['2027-02-20', 'lantern-festival', 2, 2],
  ['2026-06-19', 'dragon-boat', 2, 2],
  ['2027-06-09', 'dragon-boat', 2, 2],
  ['2026-09-25', 'mid-autumn', 2, 2],
  ['2027-09-15', 'mid-autumn', 2, 2],
  ['2026-10-18', 'double-ninth', 2, 2],
  ['2027-10-08', 'double-ninth', 2, 2],
  ['2024-04-04', 'qingming', 1, 1],
  ['2026-04-05', 'qingming', 1, 1],
  ['2027-04-05', 'qingming', 1, 1],
  ['1901-04-05', 'qingming', 1, 1],
  ['1902-04-06', 'qingming', 1, 1],
  ['2100-04-05', 'qingming', 1, 1],
]) {
  for (let offset = -before; offset <= after; offset++)
    assert.equal(id(shift(date, offset)), expected, `${date} ${offset}`)
  assert.notEqual(id(shift(date, -before - 1)), expected)
  assert.notEqual(id(shift(date, after + 1)), expected)
}
for (const date of ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'])
  assert.equal(id(date), 'new-year')
for (const date of ['2026-12-18', '2026-12-25', '2026-12-26']) assert.equal(id(date), 'christmas')
for (const date of ['2026-12-17', '2026-12-27', '2026-12-29', '2027-01-04'])
  assert.equal(id(date), null)
assert.equal(id('2026-02-28'), 'spring-festival')
assert.equal(id('2026-03-01'), 'lantern-festival')
assert.equal(id('2027-02-17'), 'spring-festival')
assert.equal(id('2027-02-18'), 'lantern-festival')
for (let day = 0; day <= 8; day++) assert.equal(id(shift('2026-10-25', day)), 'halloween')
assert.equal(id('2026-10-24'), null)
assert.equal(id('2026-11-03'), null)
// 2025 重阳落在万圣窗口中，前后两天也保留传统节日装饰。
assert.match(calendarDay('2025-10-29').festival, /重阳节/)
for (let day = -2; day <= 2; day++) assert.equal(id(shift('2025-10-29', day)), 'double-ninth')
assert.equal(id('2025-10-26'), 'halloween')
assert.equal(id('2025-11-01'), 'halloween')
// 1900 超出官方清明表范围；无证据时不猜测。无效输入不进入 Intl 农历格式化。
for (const date of ['1900-04-05', '', 'bad-date', '2026-02-30', '2026-2-05'])
  assert.equal(id(date), null)
for (const [date, month, expected] of [
  ['2009-06-27', '闰五月', null],
  ['1995-10-09', '闰八月', null],
  ['2014-11-01', '闰九月', 'halloween'],
  ['2262-03-06', '闰正月', null],
]) {
  assert(calendarDay(date).lunar.startsWith(month), `${date}: fixture must be leap month`)
  assert.equal(id(date), expected, `${date}: lunar holiday must not repeat in leap month`)
}
console.log('通过：农历/元宵窗口、传统节日优先于万圣、清明官方日期、跨年、无效日期及闰月不重复。')
