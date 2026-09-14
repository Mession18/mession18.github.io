// Rebuild the local atlas geometry from Natural Earth 5.1.2 (public domain).
// Run: node scripts/build-journey-map.mjs [path/to/countries.geojson]
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { geoNaturalEarth1, geoPath } from 'd3-geo'

const source =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson'
const response = process.argv[2] ? null : await fetch(source)
if (response && !response.ok) throw new Error(`Map download failed: ${response.status}`)
const data = JSON.parse(
  process.argv[2] ? await readFile(process.argv[2], 'utf8') : await response.text(),
)
const features = data.features.filter((feature) => feature.properties.ADM0_A3 !== 'ATA')
const projection = geoNaturalEarth1().fitExtent(
  [
    [86, 200],
    [1446, 835],
  ],
  { type: 'FeatureCollection', features },
)
const path = geoPath(projection).digits(2)
const countries = features.map((feature) => {
  const p = feature.properties
  const code = /^[A-Z]{2}$/.test(p.ISO_A2_EH) ? p.ISO_A2_EH.toLowerCase() : p.ADM0_A3.toLowerCase()
  return {
    id: p.ADM0_A3,
    code,
    name: p.NAME_ZH || p.NAME,
    latitude: p.LABEL_Y,
    longitude: p.LABEL_X,
    path: path(feature),
  }
})
const output = new URL('../src/pages/passport/journey-map/world.generated.json', import.meta.url)
await mkdir(new URL('.', output), { recursive: true })
await writeFile(
  output,
  JSON.stringify({
    source,
    scale: projection.scale(),
    translate: projection.translate(),
    countries,
  }),
)
console.log(
  `Atlas: ${countries.length} country/region shapes; ${Math.round(JSON.stringify(countries).length / 1024)} KB`,
)
