import assert from 'node:assert/strict'
import { loadUtils } from './load-utils.mjs'

const { calculateSky, dateAtZone, zonedClock, celestialStyle, dailyPhases, scenePalette } =
  await loadUtils()
const zone = 'Asia/Shanghai'
const sky = (date, minutes) => calculateSky(dateAtZone(date, minutes, zone), 31.23, 121.47, zone)

// 夏冬日出日落应显著不同，且同一天的太阳随分钟移动；不能退回固定小时表。
const summer = sky('2026-06-21', 720)
const winter = sky('2026-12-21', 720)
assert(summer.sunrise < winter.sunrise)
assert(summer.sunset > winter.sunset)
assert(summer.sun.altitude > winter.sun.altitude)
assert.notDeepEqual(celestialStyle(sky('2026-06-21', 600).sun, 1), celestialStyle(summer.sun, 1))
assert.equal(summer.stage, 'day')
assert.equal(sky('2026-06-21', 0).stage, 'night')
assert.equal(sky('2026-06-21', 1200).stage, 'dusk')
assert.notEqual(sky('2026-06-01', 720).moonName, sky('2026-06-15', 720).moonName)
assert.equal(celestialStyle({ altitude: -10, azimuth: 90 }, 1).opacity, 0)

// 24:00 进入下一日；跨年、夏令时重复和缺失小时都使用定位时区处理。
assert.deepEqual(zonedClock(dateAtZone('2026-12-31', 1440, zone), zone), {
  date: '2027-01-01',
  minutes: 0,
})
assert.equal(
  dateAtZone('2026-03-08', 150, 'America/New_York').toISOString(),
  '2026-03-08T07:30:00.000Z',
)
assert.equal(
  dateAtZone('2026-11-01', 90, 'America/New_York').toISOString(),
  '2026-11-01T05:30:00.000Z',
)
const polar = calculateSky(new Date('2026-06-21T12:00:00Z'), 89, 0, 'UTC')
assert.equal(polar.sunrise, '极昼')
assert.equal(polar.sunset, '极昼')
console.log('天空计算通过：季节、日月移动、月相、深夜/暮色、跨年、夏令时与极昼。')

// 完整阶段顺序及日出/日落锚点；同名深夜保留两个时段，24 点与 0 点颜色闭合。
const expected =
  '子夜 深夜 后半夜 黎明前 拂晓 黎明 破晓 曙光 日出 清晨 上午 正午 午后 傍晚 黄昏 日暮 日落 薄暮 暮色 入夜 初夜 深夜 子夜'.split(
    ' ',
  )
const phases = dailyPhases(290, 1141, 715)
assert.deepEqual(
  phases.map((p) => p.label),
  expected,
)
assert(phases.every((p, i) => i === 0 || p.minute > phases[i - 1].minute))
assert.equal(phases.find((p) => p.label === '日出').minute, 290)
assert.equal(phases.find((p) => p.label === '日落').minute, 1141)
assert.deepEqual(scenePalette(phases[0].tone), scenePalette(phases.at(-1).tone))
for (const p of summer.phases.slice(0, -1))
  assert.equal(sky('2026-06-21', Math.ceil(p.minute)).label, p.label)
assert.notDeepEqual(scenePalette(-2), scenePalette(-1))
assert.notDeepEqual(scenePalette(-2, 'clear'), scenePalette(-2, 'rain'))
console.log('通过：23 个时间节点顺序、日出日落锚点、连续色板、午夜闭合与天气染色。')
