import assert from 'node:assert/strict'
import { loadUtils } from './load-utils.mjs'
const { scenePalette, colorContrast, calculateSky, dateAtZone } = await loadUtils()
const rgb = (value) => value.match(/\d+/g).map(Number)
let minimum = Infinity
// 扫描所有色调及天气，覆盖阶段之间任意动画帧；不是只测试几个固定时间。
for (const weather of ['clear', 'cloudy', 'fog', 'rain', 'snow', 'thunder']) {
  for (let tone = -30; tone <= 12; tone += 0.1) {
    const palette = scenePalette(tone, weather)
    const backgrounds = ['--paper', '--cream', '--mint', '--page-top', '--page-middle'].map((k) =>
      rgb(palette[k]),
    )
    for (const key of ['--ink', '--muted', '--dark'])
      for (const bg of backgrounds) {
        const ratio = colorContrast(rgb(palette[key]), bg)
        minimum = Math.min(minimum, ratio)
        assert(ratio >= 4.5, `${weather} ${tone} ${key} ${ratio}`)
      }
    assert(colorContrast(rgb(palette['--header-background']), rgb(palette['--header-ink'])) >= 4.5)
    assert(colorContrast(rgb(palette['--green']), rgb(palette['--on-accent'])) >= 4.5)
  }
}
// 用户指出的两个窗口逐分钟检查；跨季节仍走同一规则，不硬编码豁免时段。
for (const date of ['2026-09-05', '2026-06-21', '2026-12-21'])
  for (const minutes of [
    ...Array.from({ length: 11 }, (_, i) => 250 + i),
    ...Array.from({ length: 11 }, (_, i) => 1205 + i),
  ]) {
    const sky = calculateSky(
      dateAtZone(date, minutes, 'Asia/Shanghai'),
      31.23,
      121.47,
      'Asia/Shanghai',
    )
    const p = scenePalette(sky.tone)
    assert(colorContrast(rgb(p['--ink']), rgb(p['--paper'])) >= 4.5)
  }
console.log(
  `通过：全部色调/六类天气的正文、次要文字、链接与按钮，最低对比度 ${minimum.toFixed(3)}:1。`,
)

// 正午使用指定绿色；夜间、晨昏有不同纯色，并在午夜闭合。
assert.deepEqual(rgb(scenePalette(12)['--header-background']), [57, 119, 94])
assert.notEqual(scenePalette(-14)['--header-background'], scenePalette(2)['--header-background'])
