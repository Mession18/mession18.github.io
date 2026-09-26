import assert from 'node:assert/strict'
import { loadModule } from './load-module.mjs'

const { islandSceneState, islandSeason, chimneySmoking } = await loadModule(
  '/src/pages/home/sections/island-scene-state.ts',
)
const { calculateSky } = await loadModule('/src/shared/sky.ts')
const { dateAtZone } = await loadModule('/src/shared/dates.ts')
const zone = 'Asia/Shanghai'
const skyAt = (date, minutes) => calculateSky(dateAtZone(date, minutes, zone), 31.23, 121.47, zone)
const clear = { kind: 'clear', intensity: 'light', windSpeed: 8, temperature: 24 }
const noonSky = skyAt('2026-06-21', 720)
const noon = islandSceneState(noonSky, clear)
const midnight = islandSceneState(skyAt('2026-06-21', 0), clear)
assert.equal(noon.day, 1)
assert.equal(midnight.night, 1)
assert(noon.directIntensity > midnight.directIntensity)
assert(noon.ambientIntensity > midnight.ambientIntensity)
assert.notEqual(noon.lightColor, midnight.lightColor)
assert.notDeepEqual(
  noon.lightPosition,
  islandSceneState(skyAt('2026-12-21', 720), clear).lightPosition,
)
assert(islandSceneState(skyAt('2026-06-21', 540), clear).lightPosition[0] < 0)
assert(islandSceneState(skyAt('2026-06-21', 900), clear).lightPosition[0] > 0)

let previousSnow = 0
for (const intensity of ['light', 'moderate', 'heavy']) {
  // 只提供面板覆盖的种类和强度，不依赖实时 precipitation/snowfall。
  const snow = islandSceneState(noonSky, { ...clear, kind: 'snow', intensity })
  assert(snow.snow > previousSnow)
  assert.equal(snow.wet, 0)
  previousSnow = snow.snow
  const rain = islandSceneState(noonSky, { ...clear, kind: 'rain', intensity })
  assert(rain.wet > 0)
  assert.equal(rain.snow, 0)
}
assert.equal(islandSceneState(noonSky, { ...clear, kind: 'thunder' }).wet, 1)
assert(islandSceneState(noonSky, { ...clear, kind: 'fog' }).directIntensity < noon.directIntensity)
assert(islandSceneState(noonSky, { ...clear, kind: 'fog' }).fogDensity > noon.fogDensity)
for (const windSpeed of [-20, 0, 8, 300, NaN, Infinity]) {
  const { wind } = islandSceneState(noonSky, { ...clear, windSpeed })
  assert(
    Object.values(wind)
      .filter((value) => typeof value === 'number')
      .every(Number.isFinite),
  )
  assert(wind.strength >= 0 && wind.strength <= 1)
}
assert.equal(noon.wind.trunk, 0, '微风只动树冠，不动树干')
assert.equal(noon.wind.debris, 0, '微风不会卷走花瓣')
const storm = islandSceneState(noonSky, {
  ...clear,
  kind: 'snow',
  intensity: 'heavy',
  windSpeed: 85,
  windGusts: 120,
})
assert(storm.wind.trunk > 0 && storm.wind.debris > 0.5)
assert(
  storm.fogDensity >
    islandSceneState(noonSky, { ...clear, kind: 'snow', intensity: 'heavy' }).fogDensity,
)
assert.equal(
  islandSceneState(noonSky, { ...clear, kind: 'rain', intensity: 'heavy' }).thunder,
  false,
)
assert.equal(islandSceneState(noonSky, { ...clear, kind: 'thunder' }).thunder, true)

// 装饰灯按可见光照独立开启；白天暴风开灯不能冒充天文夜晚。
assert.equal(noon.lamps, 0)
assert.equal(midnight.lamps, 1)
let previousLamps = 0
for (const altitude of [10, 8, 5, 2, 0, -3]) {
  const dusk = islandSceneState({ ...noonSky, sun: { ...noonSky.sun, altitude } }, clear)
  assert(dusk.lamps >= previousLamps && dusk.lamps <= 1)
  if (altitude > 0 && altitude < 10) assert(dusk.lamps > 0 && dusk.lamps < 1)
  if (altitude <= 0) assert.equal(dusk.lamps, 1)
  previousLamps = dusk.lamps
}
assert(islandSceneState(noonSky, { ...clear, kind: 'thunder' }).lamps >= 0.8)
for (const kind of ['rain', 'snow']) {
  assert.equal(islandSceneState(noonSky, { ...clear, kind }).lamps, 0)
  const ordinary = islandSceneState(noonSky, { ...clear, kind, intensity: 'heavy' })
  const windy = islandSceneState(noonSky, {
    ...clear,
    kind,
    intensity: 'heavy',
    windSpeed: 40,
    windGusts: 60,
  })
  const severe = islandSceneState(noonSky, {
    ...clear,
    kind,
    intensity: 'heavy',
    windSpeed: 72,
    windGusts: 98,
  })
  assert(ordinary.lamps < windy.lamps && windy.lamps < severe.lamps)
  assert(severe.lamps >= 0.8 && severe.lamps <= 1)
  assert.equal(severe.night, noon.night)
  assert(severe.ambientIntensity < ordinary.ambientIntensity && severe.ambientIntensity >= 0.48)
  assert(severe.directIntensity < ordinary.directIntensity)
  assert.equal(
    islandSceneState(skyAt('2026-06-21', 0), {
      ...clear,
      kind,
      intensity: 'heavy',
      windSpeed: 110,
      windGusts: 150,
    }).lamps,
    1,
  )
}
for (const date of ['2026-06-21', '2026-12-21']) {
  const polar = calculateSky(new Date(`${date}T12:00:00Z`), 89, 0, 'UTC')
  const state = islandSceneState(polar, clear)
  assert.equal(state.day + state.night, 1)
  assert(state.lightPosition.every(Number.isFinite))
  assert(
    Object.values(state)
      .filter((value) => typeof value === 'number')
      .every(Number.isFinite),
  )
}

// 季节按选择的当地日期切换，覆盖月底、跨年及樱花窗口的两侧。
for (const [date, expected] of [
  ['2024-02-29', 'winter'],
  ['2026-03-01', 'spring'],
  ['2026-05-31', 'spring'],
  ['2026-06-01', 'summer'],
  ['2026-08-31', 'summer'],
  ['2026-09-01', 'autumn'],
  ['2026-11-30', 'autumn'],
  ['2026-12-01', 'winter'],
  ['2026-12-31', 'winter'],
  ['2027-01-01', 'winter'],
])
  assert.equal(islandSeason(date).season, expected)
for (const year of [2026, 2027]) {
  assert.equal(islandSeason(`${year}-03-19`).blossom, false)
  assert.equal(islandSeason(`${year}-03-20`).blossom, true)
  assert.equal(islandSeason(`${year}-04-20`).blossom, true)
  assert.equal(islandSeason(`${year}-04-21`).blossom, false)
}
const cherry = islandSceneState({ ...noonSky, date: '2026-03-20' }, clear).flora
assert.deepEqual(cherry, islandSeason('2026-03-20'))
assert.notDeepEqual(cherry.foliage, islandSeason('2026-03-19').foliage)
assert.notDeepEqual(cherry.foliage, noon.flora.foliage)
assert.equal(islandSceneState(skyAt('2026-12-31', 1440), clear).flora.season, 'winter')
const september = islandSeason('2026-09-01').foliage
const november = islandSeason('2026-11-05').foliage
assert.notDeepEqual(september, november)
for (let i = 0; i < 5; i++) {
  const green = (color) => parseInt(color.slice(3, 5), 16)
  assert(green(november[i]) < green(september[i]), '秋叶逐渐减少绿色、变为枫红')
}
for (const [start, end] of [
  [390, 540],
  [660, 810],
  [1050, 1200],
]) {
  assert.equal(chimneySmoking('2026-06-21', start - 1, 24), false)
  assert.equal(chimneySmoking('2026-06-21', start, 24), true)
  assert.equal(chimneySmoking('2026-06-21', end - 1, 24), true)
  assert.equal(chimneySmoking('2026-06-21', end, 24), false)
}
for (const date of ['2026-12-01', '2027-01-01', '2027-02-28']) {
  for (const minutes of [0, 600, 900, 1439]) assert.equal(chimneySmoking(date, minutes, 18), true)
}
assert.equal(chimneySmoking('2026-08-01', 0, 9.9), true)
assert.equal(chimneySmoking('2026-08-01', 0, 10), false)
assert.equal(chimneySmoking('2026-08-01', 0, NaN), false)
assert.equal(islandSceneState(skyAt('2026-08-01', 0), { ...clear, temperature: 5 }).smoke, true)
console.log(
  '通过：3D 昼夜光照、季节/方位、雨雪覆盖与强度、风力边界、极昼极夜及所选日期的四季/樱花窗口。',
)

const { gardenPath, pathAtZ, COTTAGE_YAW } = await loadModule(
  '/src/pages/home/sections/island-layout.ts',
)
const { riverCenter, RIVER_HALF_WIDTH, clearOfRiver } = await loadModule(
  '/src/pages/home/sections/island-river-layout.ts',
)
// 逆旋转后小路起点必须落在门的中线和最外一级台阶上。
for (const houseX of [0.8, 6.5, 10]) {
  const start = gardenPath(0, houseX)
  assert(
    Math.abs((start.x - houseX) * Math.cos(COTTAGE_YAW) - start.z * Math.sin(COTTAGE_YAW)) < 1e-9,
  )
  assert(
    Math.abs((start.x - houseX) * Math.sin(COTTAGE_YAW) + start.z * Math.cos(COTTAGE_YAW) - 2.35) <
      1e-9,
  )
  for (let step = 0; step <= 40; step++) {
    const p = gardenPath(step / 40, houseX)
    assert(Math.abs(pathAtZ(p.z, houseX).x - p.x) < 1e-9)
    assert(p.halfWidth > 0)
    for (const gap of [4.4, 7.3])
      assert(
        Math.abs(p.x - riverCenter(p.z, houseX - gap)) > p.halfWidth + RIVER_HALF_WIDTH,
        '小路不得进入河面',
      )
  }
}
assert.notEqual(riverCenter(-4, 0), riverCenter(4, 0))
assert.equal(clearOfRiver(-4.8, -2.3, -3.6), false, '旧手机松树位置在河内')
assert.equal(clearOfRiver(-5.8, -2.3, -3.6), true, '新松树位置在河岸外')
assert.equal(clearOfRiver(-2, 4, -3.6, 0.85), false, '雨天水洼不可盖在河面上')
console.log('通过：旋转门口与小路对齐、道路连续、手机和桌面河道不与小路相交。')
