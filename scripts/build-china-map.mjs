// Province overview, South China Sea inset, and prefecture boundaries for the loupe.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { geoArea, geoConicConformal, geoMercator, geoPath } from 'd3-geo'

const source = 'https://geo.datav.aliyun.com/areas_v3/bound/'
const cache = process.argv[2] ?? join(tmpdir(), 'windchime-geoatlas')
await mkdir(cache, { recursive: true })
async function load(code) {
  const file = join(cache, code + '.json')
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    /* Fetch only missing cache entries. */
  }
  const response = await fetch(source + code + '.json')
  if (!response.ok) throw new Error(code + ': HTTP ' + response.status)
  const data = await response.json()
  await writeFile(file, JSON.stringify(data))
  return data
}
const data = await load('100000_full')
const shortName = (name) =>
  name.replace(/(?:壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/u, '')
function winding(feature) {
  if (geoArea(feature) > 2 * Math.PI) {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates
    for (const polygon of polygons) for (const ring of polygon) ring.reverse()
  }
  return feature
}
function mainland(feature) {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates
  return {
    ...feature,
    geometry: {
      type: 'MultiPolygon',
      coordinates: polygons.filter((polygon) => polygon[0].some((point) => point[1] >= 18)),
    },
  }
}
const provincesGeo = data.features.filter((feature) => feature.properties.name).map(winding)
const mainlandGeo = { type: 'FeatureCollection', features: provincesGeo.map(mainland) }
const projection = geoConicConformal()
  .parallels([25, 47])
  .rotate([-105, 0])
  .fitExtent(
    [
      [80, 155],
      [1420, 900],
    ],
    mainlandGeo,
  )
const insetBox = { x: 1240, y: 640, width: 190, height: 275 }
const extent = [
  [insetBox.x + 8, insetBox.y + 33],
  [insetBox.x + insetBox.width - 8, insetBox.y + insetBox.height - 10],
]
const insetProjection = geoMercator()
  .fitExtent(extent, {
    type: 'Polygon',
    coordinates: [
      [
        [105, 3],
        [105, 25],
        [124, 25],
        [124, 3],
        [105, 3],
      ],
    ],
  })
  .clipExtent(extent)
const path = geoPath(projection).digits(2),
  insetPath = geoPath(insetProjection).digits(2)
const provinces = provincesGeo.map((feature) => {
  const properties = feature.properties,
    center = properties.centroid ?? properties.center
  return {
    id: String(properties.adcode),
    name: properties.name,
    shortName: shortName(properties.name),
    longitude: center?.[0],
    latitude: center?.[1],
    position: center ? projection(center) : null,
    path: path(mainland(feature)),
  }
})
const inset = {
  ...insetBox,
  scale: insetProjection.scale(),
  translate: insetProjection.translate(),
  paths: data.features.map(winding).map((feature) => ({
    id: String(feature.properties.adcode),
    path: insetPath(feature),
    maritime: !feature.properties.name,
  })),
}
// The four directly administered cities and special regions are city-level areas already.
const singleCities = new Set([110000, 120000, 310000, 500000, 710000, 810000, 820000])
const cityRegions = []
for (let offset = 0; offset < provincesGeo.length; offset += 4) {
  const batch = provincesGeo.slice(offset, offset + 4)
  const collections = await Promise.all(
    batch.map(async (province) => {
      const code = province.properties.adcode
      const features = singleCities.has(code) ? [province] : (await load(code + '_full')).features
      return features
        .filter((feature) => feature.properties.name)
        .map((feature) => ({ ...winding(feature), province: shortName(province.properties.name) }))
    }),
  )
  cityRegions.push(...collections.flat())
}
// Simplify city lines to about 1 km. Province coastlines retain their original detail.
function simplify(points, tolerance = 0.009) {
  if (points.length < 4) return points
  const first = points[0],
    last = points.at(-1),
    dx = last[0] - first[0],
    dy = last[1] - first[1]
  let farthest = 0,
    distance = tolerance * tolerance
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i],
      t =
        dx || dy
          ? Math.max(
              0,
              Math.min(
                1,
                ((point[0] - first[0]) * dx + (point[1] - first[1]) * dy) / (dx * dx + dy * dy),
              ),
            )
          : 0
    const squared = (point[0] - first[0] - t * dx) ** 2 + (point[1] - first[1] - t * dy) ** 2
    if (squared > distance) {
      distance = squared
      farthest = i
    }
  }
  return farthest
    ? [
        ...simplify(points.slice(0, farthest + 1), tolerance).slice(0, -1),
        ...simplify(points.slice(farthest), tolerance),
      ]
    : [first, last]
}
const cityPaths = cityRegions
  .filter((feature) => feature.properties.adcode !== 710000)
  .map((feature) => {
    const main = mainland(feature)
    main.geometry.coordinates = main.geometry.coordinates.map((polygon) =>
      polygon.map((ring) => {
        const simplified = simplify(ring)
        return simplified.length >= 4 ? simplified : ring
      }),
    )
    const center = feature.properties.centroid ?? feature.properties.center
    return {
      id: String(feature.properties.adcode),
      name: feature.properties.name,
      province: feature.province,
      longitude: center?.[0],
      latitude: center?.[1],
      path: path(main),
      insetPath: insetPath(feature),
    }
  })
const taiwanCache = join(cache, 'taiwan-counties.geojson')
const taiwanDownload =
  'https://geo.maderaojen.me/datasets/tw-counties/releases/v1/2026-08-07.1/data.geojson'
let taiwan
try {
  taiwan = JSON.parse(await readFile(taiwanCache, 'utf8'))
} catch {
  const response = await fetch(taiwanDownload)
  if (!response.ok) throw new Error('County geometry: HTTP ' + response.status)
  taiwan = await response.json()
  await writeFile(taiwanCache, JSON.stringify(taiwan))
}
for (const feature of taiwan.features) {
  const lines =
    feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates.flat()
      : feature.geometry.coordinates
  const simplified = { type: 'MultiLineString', coordinates: lines.map((line) => simplify(line)) }
  cityPaths.push({
    id: feature.properties.COUNTYCODE,
    name: feature.properties.COUNTYNAME,
    province: '台湾',
    path: path(simplified),
    insetPath: insetPath(simplified),
  })
}
// Finish fetching and projecting both layers before updating the generated assets.
await writeFile(
  new URL('../src/pages/passport/journey-map/china.generated.json', import.meta.url),
  JSON.stringify({
    source: source + '100000_full.json',
    scale: projection.scale(),
    translate: projection.translate(),
    provinces,
    inset,
  }),
)
await writeFile(
  new URL('../src/pages/passport/journey-map/china-cities.generated.json', import.meta.url),
  JSON.stringify({
    source,
    additionalSource: 'https://data.gov.tw/dataset/7442',
    additionalDownload: taiwanDownload,
    additionalLicense: 'https://data.gov.tw/license',
    cities: cityPaths,
  }),
)
console.log(
  JSON.stringify({ provinces: provinces.length, cities: cityPaths.length, inset: insetBox }),
)
