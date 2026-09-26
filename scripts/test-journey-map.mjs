import assert from 'node:assert/strict'
import { loadModule } from './load-module.mjs'

const {
  atlasGroupPins,
  atlasIndexGroups,
  buildAtlasPlaces,
  cityAtlasPins,
  formatVisit,
  isChinaPlace,
  projectLocation,
} = await loadModule('/src/pages/passport/journey-map/journey-map.data.ts')

const stamp = (countryOrRegion, city, extra = {}) => ({
  countryOrRegion,
  city,
  color: 'green',
  startDate: '填写日期',
  ...extra,
})
const places = buildAtlasPlaces([
  stamp('中国', '烟台'),
  stamp('中国', '青岛市', { province: '山东省' }),
  stamp('中国', '北京'),
  stamp('韩国', '首尔', { province: '首尔特别市' }),
  stamp('韩国', '首尔市', { startDate: '2026.09.01' }),
  stamp('待补充国家', '待补充城市'),
])

// 同城的手工占位章与文章章合并，真实日期优先；两个地图层级共享同一分组。
assert.equal(places.length, 5)
const seoul = places.find((place) => place.city === '首尔')
assert.equal(seoul.visits.length, 2)
assert.equal(seoul.visits[0].startDate, '2026.09.01')
assert.equal(formatVisit(seoul.visits[1]), '日期待补充')
const worldGroups = atlasIndexGroups(places, 'world')
assert.deepEqual(
  worldGroups.map((group) => group.label),
  ['中国', '韩国', '待补充国家'],
)
assert.equal(worldGroups[0].places.length, 3)
const worldPins = atlasGroupPins(worldGroups, 'world')
assert.deepEqual(
  worldPins.map((pin) => pin.key),
  ['cn', 'kr'],
)
assert.strictEqual(worldPins[0].places, worldGroups[0].places)

const chinaPlaces = places.filter((place) => isChinaPlace(place.code))
const chinaGroups = atlasIndexGroups(chinaPlaces, 'china')
assert.deepEqual(
  chinaGroups.map((group) => group.label),
  ['山东', '北京'],
)
const chinaPins = atlasGroupPins(chinaGroups, 'china')
assert.deepEqual(
  chinaPins.map((pin) => pin.key),
  ['cn:山东', 'cn:北京'],
)
assert.strictEqual(chinaPins[0].places, chinaGroups[0].places)
assert.equal(cityAtlasPins(chinaPlaces).length, 3)
assert(worldPins.concat(chinaPins).every((pin) => Number.isFinite(pin.x) && Number.isFinite(pin.y)))

assert.equal(projectLocation({ latitude: 91, longitude: 120 }), null)
assert.equal(projectLocation({ latitude: NaN, longitude: 120 }), null)
assert.deepEqual(atlasGroupPins(atlasIndexGroups([], 'world'), 'world'), [])
console.log('通过：地图国家/省份分组、同城合并、日期优先级、索引保留未定位城市与投影校验。')
