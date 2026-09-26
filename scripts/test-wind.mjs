import assert from 'node:assert/strict'
import { loadModule } from './load-module.mjs'

const { sceneWind } = await loadModule('/src/shared/wind.ts')
const wind = (speed, gusts = speed, direction = 270) =>
  sceneWind({ windSpeed: speed, windGusts: gusts, windDirection: direction })
const calm = wind(0)
assert.equal(calm.strength, 0)
assert.equal(calm.canopy, 0)
assert.equal(wind(8, 12).trunk, 0)
assert.equal(wind(28).trunk, 0)
assert(wind(29).trunk > 0)
assert.equal(wind(40).debris, 0)
assert(wind(41).debris > 0)
assert(wind(40, 70).strength > wind(40).strength)
assert.equal(wind(8, 12).label, '微风')
assert.equal(wind(40, 60).label, '强风')
assert.equal(wind(72, 98).label, '暴风')
assert.equal(wind(110, 150).label, '极强风')
for (const [direction, x, z] of [
  [0, 0, 1],
  [90, 1, 0],
  [180, 0, -1],
  [270, -1, 0],
]) {
  const actual = wind(20, 30, direction)
  assert(Math.abs(actual.x - x) < 1e-10)
  assert(Math.abs(actual.z - z) < 1e-10)
  assert(Math.abs(Math.hypot(actual.x, actual.z) - 1) < 1e-10)
}
assert.equal(wind(20, 30, -90).direction, 270)
assert.equal(wind(20, 30, 450).direction, 90)
assert.equal(wind(20, 10).gusts, 20)
for (const value of [-100, 0, 500, NaN, Infinity, -Infinity, undefined, null]) {
  const actual = wind(value, value, value)
  for (const [key, item] of Object.entries(actual))
    if (key !== 'label') assert(Number.isFinite(item), `${key} must stay finite`)
  assert(actual.strength >= 0 && actual.strength <= 1)
  assert(actual.debris >= 0 && actual.debris <= 1)
  assert(actual.trunk >= 0 && actual.trunk <= 0.14)
  assert(actual.direction >= 0 && actual.direction < 360)
}
console.log('通过：风速/阵风阈值、树冠/树干/飞散强度、气象来向到场景流向、异常数据边界。')
