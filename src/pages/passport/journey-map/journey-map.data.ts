import { geoNaturalEarth1 } from 'd3-geo'
import { countryCodeForChineseName } from '../../../shared/country-flags'
import type { TravelStamp } from '../travel-stamps.data'
import world from './world.generated.json'

export const atlasSize = { width: 1536, height: 1024 }
export const atlasCountries = world.countries
const projection = geoNaturalEarth1()
  .scale(world.scale)
  .translate(world.translate as [number, number])
type Coordinates = { latitude: number; longitude: number }

// 按国家分别索引，避免不同国家的同名城市被定位到同一处。
const cities: Record<string, Record<string, [number, number]>> = {
  cn: {
    烟台: [121.45, 37.46],
    北京: [116.4, 39.9],
    天津: [117.2, 39.09],
    沈阳: [123.43, 41.8],
    丽江: [100.23, 26.87],
    香格里拉: [99.7, 27.83],
    重庆: [106.55, 29.56],
    济南: [117, 36.67],
    南京: [118.8, 32.06],
    威海: [122.12, 37.51],
    青岛: [120.38, 36.07],
    泰安: [117.13, 36.2],
    大理: [100.27, 25.61],
    上海: [121.47, 31.23],
    广州: [113.26, 23.13],
    深圳: [114.06, 22.54],
    成都: [104.07, 30.57],
    杭州: [120.16, 30.25],
    西安: [108.94, 34.34],
    昆明: [102.83, 24.88],
    厦门: [118.08, 24.48],
  },
  kr: { 首尔: [126.98, 37.57], 釜山: [129.08, 35.18], 济州: [126.53, 33.5] },
  hk: { 香港: [114.17, 22.32] },
  mo: { 澳门: [113.54, 22.2] },
  tw: { 台北: [121.57, 25.03] },
  jp: { 东京: [139.69, 35.68], 大阪: [135.5, 34.69], 京都: [135.77, 35.01] },
}

export type AtlasPlace = {
  key: string
  code: string
  city: string
  countryOrRegion: string
  province?: string
  position: { x: number; y: number } | null
  visits: TravelStamp[]
}
export type AtlasPin = { key: string; x: number; y: number; places: AtlasPlace[] }

export function projectLocation(coordinates: Coordinates) {
  const { latitude, longitude } = coordinates
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null
  const point = projection([longitude, latitude])
  return point ? { x: point[0], y: point[1] } : null
}

const normalizeCity = (value: string) => value.trim().replace(/(?:特别市|市)$/u, '')
export function visitTime(stamp: TravelStamp) {
  const date = stamp.startDate.replaceAll('.', '-')
  return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? Date.parse(`${date}T00:00:00Z`) : -Infinity
}
export function formatVisit(stamp: TravelStamp) {
  if (!Number.isFinite(visitTime(stamp))) return '日期待补充'
  return stamp.endDate && stamp.endDate !== stamp.startDate
    ? `${stamp.startDate} — ${stamp.endDate}`
    : stamp.startDate
}

/** 合并同一地点；保留每次旅行，手动章的占位日期不覆盖文章中的真实日期。 */
export function buildAtlasPlaces(stamps: TravelStamp[]): AtlasPlace[] {
  const places = new Map<string, AtlasPlace>()
  for (const stamp of stamps) {
    const code =
      stamp.countryCode?.toLowerCase() ??
      countryCodeForChineseName(stamp.countryOrRegion) ??
      stamp.countryOrRegion
    const city = normalizeCity(stamp.city)
    const known = cities[code]?.[city]
    const explicit =
      stamp.latitude !== undefined && stamp.longitude !== undefined
        ? projectLocation({ latitude: stamp.latitude, longitude: stamp.longitude })
        : null
    const position =
      explicit ?? (known ? projectLocation({ longitude: known[0], latitude: known[1] }) : null)
    // 内置坐标可识别的城市允许省份缺省，以合并手动首尔章与首尔文章章。
    const key = `${code}:${known ? '' : (stamp.province ?? '')}:${city}`
    const existing = places.get(key)
    if (existing) {
      existing.visits.push(stamp)
      existing.province ||= stamp.province
      if (explicit || !existing.position) existing.position = position
    } else
      places.set(key, {
        key,
        code,
        city,
        countryOrRegion: stamp.countryOrRegion,
        province: stamp.province,
        position,
        visits: [stamp],
      })
  }
  return [...places.values()].map((place) => ({
    ...place,
    visits: place.visits.sort((a, b) => visitTime(b) - visitTime(a)),
  }))
}

/** 世界视角下相邻图钉合并；展开后仍可逐一选择城市，不用偏移真实经纬度。 */
export function clusterAtlasPlaces(places: AtlasPlace[]): AtlasPin[] {
  const pins: AtlasPin[] = []
  for (const place of places) {
    if (!place.position) continue
    const { x, y } = place.position
    const pin = pins.find(
      (candidate) =>
        candidate.places[0].code === place.code &&
        Math.hypot(candidate.x - x, candidate.y - y) < 25,
    )
    if (pin) {
      const count = pin.places.length
      pin.x = (pin.x * count + x) / (count + 1)
      pin.y = (pin.y * count + y) / (count + 1)
      pin.places.push(place)
    } else pins.push({ key: place.key, x, y, places: [place] })
  }
  return pins
}

export const atlasLabels = [
  { x: 390, y: 387, lines: ['NORTH', 'AMERICA'] },
  { x: 485, y: 656, lines: ['SOUTH', 'AMERICA'] },
  { x: 789, y: 363, lines: ['EUROPE'] },
  { x: 789, y: 571, lines: ['AFRICA'] },
  { x: 1080, y: 335, lines: ['ASIA'] },
  { x: 1263, y: 717, lines: ['OCEANIA'] },
  { x: 540, y: 475, lines: ['ATLANTIC', 'OCEAN'], ocean: true },
  { x: 198, y: 551, lines: ['PACIFIC', 'OCEAN'], ocean: true },
  { x: 1380, y: 515, lines: ['PACIFIC', 'OCEAN'], ocean: true },
  { x: 1000, y: 670, lines: ['INDIAN', 'OCEAN'], ocean: true },
]
