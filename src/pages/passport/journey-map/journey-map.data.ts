import { geoNaturalEarth1, geoConicConformal, geoMercator } from 'd3-geo'
import { countryCodeForChineseName } from '../../../shared/country-flags'
import type { TravelStamp } from '../travel-stamps.data'
import world from './world.generated.json'
import china from './china.generated.json'

export type AtlasVariant = 'world' | 'china'
export const chinaProvinces = china.provinces
export const chinaInset = china.inset
const chinaInsetProjection = geoMercator()
  .scale(china.inset.scale)
  .translate(china.inset.translate as [number, number])
const chinaProjection = geoConicConformal()
  .parallels([25, 47])
  .rotate([-105, 0])
  .scale(china.scale)
  .translate(china.translate as [number, number])
export const normalizeProvince = (name: string) =>
  name.trim().replace(/(?:壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/u, '')
const cityProvinces: Record<string, string> = {
  烟台: '山东',
  青岛: '山东',
  济南: '山东',
  威海: '山东',
  泰安: '山东',
  北京: '北京',
  天津: '天津',
  上海: '上海',
  重庆: '重庆',
  沈阳: '辽宁',
  南京: '江苏',
  大理: '云南',
  丽江: '云南',
  香格里拉: '云南',
  昆明: '云南',
  广州: '广东',
  深圳: '广东',
  成都: '四川',
  杭州: '浙江',
  西安: '陕西',
  厦门: '福建',
}
const regionalProvinces: Record<string, string> = { hk: '香港', mo: '澳门', tw: '台湾' }
export const isChinaPlace = (code: string) => ['cn', 'hk', 'mo', 'tw'].includes(code)

export const atlasSize = { width: 1536, height: 1024 }
export const atlasCountries = world.countries
// Enlarge the geography within the original paper artwork, keeping pins and labels aligned.
const worldLayout = { scale: 1.075, x: -57.6, y: 35 }
export const worldMapTransform = `translate(${worldLayout.x} ${worldLayout.y}) scale(${worldLayout.scale})`
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
  chinaPosition: { x: number; y: number } | null
  visits: TravelStamp[]
}
export type AtlasPin = {
  key: string
  label: string
  code: string
  x: number
  y: number
  places: AtlasPlace[]
  city?: boolean
}

export function projectLocation(coordinates: Coordinates, variant: AtlasVariant = 'world') {
  const { latitude, longitude } = coordinates
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null
  const point = (
    variant === 'china' ? (latitude < 18 ? chinaInsetProjection : chinaProjection) : projection
  )([longitude, latitude])
  if (!point) return null
  return variant === 'world'
    ? {
        x: point[0] * worldLayout.scale + worldLayout.x,
        y: point[1] * worldLayout.scale + worldLayout.y,
      }
    : { x: point[0], y: point[1] }
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
    const chinaPosition = isChinaPlace(code)
      ? projectLocation(
          {
            longitude: stamp.longitude ?? known?.[0] ?? NaN,
            latitude: stamp.latitude ?? known?.[1] ?? NaN,
          },
          'china',
        )
      : null
    // 内置坐标可识别的城市允许省份缺省，以合并手动首尔章与首尔文章章。
    const key = `${code}:${known ? '' : (stamp.province ?? '')}:${city}`
    const existing = places.get(key)
    if (existing) {
      existing.visits.push(stamp)
      existing.province ||= stamp.province
      if (explicit || !existing.position) {
        existing.position = position
        existing.chinaPosition = chinaPosition
      }
    } else
      places.set(key, {
        key,
        code,
        city,
        countryOrRegion: stamp.countryOrRegion,
        province: isChinaPlace(code)
          ? (regionalProvinces[code] ??
            normalizeProvince(stamp.province ?? cityProvinces[city] ?? '待补充省份'))
          : stamp.province,
        position,
        chinaPosition,
        visits: [stamp],
      })
  }
  return [...places.values()].map((place) => ({
    ...place,
    visits: place.visits.sort((a, b) => visitTime(b) - visitTime(a)),
  }))
}

/** 世界地图按国家／地区分组，中国地图按省份分组；放大镜沿用对应层级。 */
export function groupAtlasPlaces(
  places: AtlasPlace[],
  variant: AtlasVariant = 'world',
): AtlasPin[] {
  const groups = new Map<string, AtlasPlace[]>()
  for (const place of places) {
    if (variant === 'china' && !isChinaPlace(place.code)) continue
    const key = variant === 'china' ? 'cn:' + place.province : place.code
    groups.set(key, [...(groups.get(key) ?? []), place])
  }
  return [...groups.entries()].flatMap(([key, members]) => {
    const first = members[0]
    const byProvince = variant === 'china'
    const province = byProvince
      ? chinaProvinces.find((entry) => entry.shortName === first.province)
      : undefined
    const country = atlasCountries.find((entry) => entry.code === first.code)
    const coordinates = province ?? country
    let point =
      coordinates?.latitude !== undefined && coordinates?.longitude !== undefined
        ? projectLocation(
            { latitude: coordinates.latitude, longitude: coordinates.longitude },
            variant,
          )
        : null
    if (!point && variant === 'world') {
      const positions = members.flatMap((member) => (member.position ? [member.position] : []))
      if (positions.length)
        point = {
          x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
          y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length,
        }
    }
    return point
      ? [
          {
            key,
            label: byProvince ? (first.province ?? '中国') : first.countryOrRegion,
            code: first.code,
            ...point,
            places: members,
          },
        ]
      : []
  })
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

export function cityAtlasPins(places: AtlasPlace[]): AtlasPin[] {
  return places.flatMap((place) =>
    place.chinaPosition
      ? [
          {
            key: place.key,
            label: place.city,
            code: place.code,
            ...place.chinaPosition,
            places: [place],
            city: true,
          },
        ]
      : [],
  )
}

/** 索引按当前地图层级列出条目，城市只在选择地区后显示。 */
export function atlasIndexGroups(places: AtlasPlace[], variant: AtlasVariant) {
  const groups = new Map<
    string,
    { key: string; label: string; code: string; places: AtlasPlace[] }
  >()
  for (const place of places) {
    const key = variant === 'china' ? (place.province ?? '待补充省份') : place.code
    const group = groups.get(key) ?? {
      key,
      label: variant === 'china' ? key : place.countryOrRegion,
      code: place.code,
      places: [],
    }
    group.places.push(place)
    groups.set(key, group)
  }
  return [...groups.values()]
}
