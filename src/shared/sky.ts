import type { CSSProperties } from 'react'
import { getPosition, getTimes, getMoonPosition, getMoonIllumination } from 'suncalc'
import { zonedClock, dateAtZone, clockLabel } from './dates'

/** 根据太阳高度角决定配色；日落后的前三小时保留蓝紫暮色，再进入墨黑深夜。 */
export function calculateSky(instant: Date, latitude: number, longitude: number, timezone: string) {
  const clock = zonedClock(instant, timezone)
  // 用当天当地中午查询日出日落，避免凌晨归入前一个太阳日。
  const times = getTimes(dateAtZone(clock.date, 720, timezone), latitude, longitude)
  const sun = getPosition(instant, latitude, longitude)
  const moon = getMoonPosition(instant, latitude, longitude)
  const illumination = getMoonIllumination(instant)
  const beforeNoon = instant < times.solarNoon
  const afterSunset = times.sunset
    ? (instant.getTime() - times.sunset.getTime()) / 3_600_000
    : Infinity
  const stage =
    sun.altitude >= 6
      ? 'day'
      : sun.altitude >= -6
        ? beforeNoon
          ? 'sunrise'
          : 'sunset'
        : sun.altitude > -18 || (afterSunset >= 0 && afterSunset < 3)
          ? 'dusk'
          : 'night'
  const period: 'morning' | 'noon' | 'afternoon' | 'evening' =
    stage === 'night' || stage === 'dusk'
      ? 'evening'
      : stage === 'sunrise' || stage === 'sunset'
        ? 'afternoon'
        : Math.abs(instant.getTime() - times.solarNoon.getTime()) < 3_600_000
          ? 'noon'
          : 'morning'
  const phases = dailyPhases(
    times.sunrise ? zonedClock(times.sunrise, timezone).minutes : 360,
    times.sunset ? zonedClock(times.sunset, timezone).minutes : 1080,
    zonedClock(times.solarNoon, timezone).minutes,
  )
  const phaseIndex = Math.max(0, phases.findIndex((phase) => phase.minute > clock.minutes) - 1)
  const currentPhase = phases[phaseIndex]
  const nextPhase = phases[phaseIndex + 1]
  const progress = (clock.minutes - currentPhase.minute) / (nextPhase.minute - currentPhase.minute)
  const eased = progress * progress * (3 - 2 * progress)
  // 色调随阶段进度插值；极昼极夜仍使用实际太阳高度，不伪造日落后的黑夜。
  const tone =
    times.alwaysUp || times.alwaysDown
      ? sun.altitude
      : currentPhase.tone + (nextPhase.tone - currentPhase.tone) * eased
  const label = currentPhase.label
  const eventLabel = (date: Date | null) =>
    date
      ? clockLabel(zonedClock(date, timezone).minutes)
      : times.alwaysUp
        ? '极昼'
        : times.alwaysDown
          ? '极夜'
          : '今日无此事件'
  return {
    ...clock,
    instant,
    stage,
    period,
    label,
    tone,
    phases,
    nextPhase,
    sun,
    moon,
    illumination,
    isNight: sun.altitude < -0.3,
    sunrise: eventLabel(times.sunrise),
    sunset: eventLabel(times.sunset),
    moonName: ['新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'][
      Math.round(illumination.phase * 8) % 8
    ],
  }
}

/** 将真实方位/高度投影到装饰天空：东在左、西在右；地平线以下逐渐隐藏。
 * 这是适配插画的投影，不是可导航的星图；云、雾、降水继续降低可见度。
 */
export function celestialStyle(
  position: { azimuth: number; altitude: number },
  visibility: number,
): CSSProperties {
  return {
    left: `${50 - 40 * Math.sin((position.azimuth * Math.PI) / 180)}%`,
    top: `${80 - 68 * Math.pow(Math.max(0, position.altitude) / 90, 0.65)}%`,
    opacity: Math.max(0, Math.min(1, (position.altitude + 0.5) / 2)) * visibility,
  }
}

/** 全站连续色板：阶段时间线提供连续色调值，晨昏共用暖色家族；色调值越低越暗。
 * 每个锚点依次为：天空上/中/下、纸面、页面底色、正文、次要文字、强调文字、浅强调色、顶部栏纯色。
 */
export function scenePalette(tone: number, weather = 'clear') {
  const stops = [
    {
      height: -30,
      colors: [
        '#03050a',
        '#080d16',
        '#151c29',
        '#111722',
        '#080c13',
        '#e8e4dc',
        '#aaa9a5',
        '#91c9b3',
        '#315c50',
        '#111925',
      ],
    },
    {
      height: -24,
      colors: [
        '#05080e',
        '#101624',
        '#252c3c',
        '#151c26',
        '#0b1018',
        '#e8e4dc',
        '#aaa9a5',
        '#91c9b3',
        '#315c50',
        '#202c40',
      ],
    },
    {
      height: -14,
      colors: [
        '#18223d',
        '#384060',
        '#75677b',
        '#293043',
        '#202637',
        '#f1e8e3',
        '#c2b8bd',
        '#c7b9dc',
        '#4a425c',
        '#4b4563',
      ],
    },
    {
      height: -6,
      colors: [
        '#997ca8',
        '#d99b91',
        '#f2bd91',
        '#f7e5d8',
        '#efcbb9',
        '#513f46',
        '#786069',
        '#795267',
        '#e5c5bd',
        '#895765',
      ],
    },
    {
      height: 2,
      colors: [
        '#ae92b0',
        '#edac91',
        '#ffdc9c',
        '#fff0df',
        '#f7dac3',
        '#513f42',
        '#80636a',
        '#885960',
        '#efcfbc',
        '#99643d',
      ],
    },
    {
      height: 12,
      colors: [
        '#79c8c4',
        '#a9e0d1',
        '#e0edbd',
        '#fffdf8',
        '#fffaf0',
        '#4d4439',
        '#827568',
        '#38735c',
        '#b9e4cf',
        '#39775e',
      ],
    },
  ]
  const upper = stops.findIndex((stop) => tone <= stop.height)
  const right = upper < 0 ? stops.length - 1 : upper
  const left = Math.max(0, right - 1)
  const start = stops[left],
    end = stops[right]
  const amount =
    left === right
      ? 0
      : Math.max(0, Math.min(1, (tone - start.height) / (end.height - start.height)))
  // smoothstep 让锚点两端速度归零，太阳跨越阈值时不会突然换色。
  const blend = amount * amount * (3 - 2 * amount)
  const keys = [
    'sky-top',
    'sky-middle',
    'sky-bottom',
    'paper',
    'cream',
    'ink',
    'muted',
    'dark',
    'mint',
    'header-background',
  ]
  const palette = Object.fromEntries(
    keys.map((key, index) => {
      const rgb = [1, 3, 5].map((offset) => {
        const a = parseInt(start.colors[index].slice(offset, offset + 2), 16)
        const b = parseInt(end.colors[index].slice(offset, offset + 2), 16)
        const color = a + (b - a) * blend
        // 天气染色同样作用于全站渐变，避免首页罩一层灰而导航仍保持晴天色。
        const tint: Record<string, [number, number]> = {
          cloudy: [95, 0.16],
          fog: [180, 0.2],
          rain: [65, 0.3],
          snow: [190, 0.18],
          thunder: [38, 0.42],
        }
        const [gray, weight] = index < 3 ? (tint[weather] ?? [0, 0]) : [0, 0]
        return Math.round(color * (1 - weight) + gray * weight)
      })
      return [`--${key}`, `rgb(${rgb.join(' ')})`]
    }),
  )
  // 顶部栏使用同一色调坐标的独立纯色色标；全程保持深底白字。
  palette['--header-ink'] = 'rgb(255 255 255)'
  return readablePalette(palette)
}

/** 以当地午夜、日出、太阳正午、日落、次日午夜构建有序阶段。
 * minute 是当天开始分钟，tone 是交给 scenePalette 的色调坐标；同名深夜分别保留。
 * 晨间比例随午夜到日出的长度缩放，傍晚阶段随日落到午夜缩放，不使用固定日出时间。
 */
export function dailyPhases(rise: number, set: number, noon: number) {
  const morning = noon - rise
  const afternoon = set - noon
  const evening = 1440 - set
  const entries: Array<[number, string, number]> = [
    [0, '子夜', -30],
    [rise * 0.2, '深夜', -24],
    [rise * 0.42, '后半夜', -20],
    [rise * 0.62, '黎明前', -14],
    [rise * 0.7, '拂晓', -10],
    [rise * 0.77, '黎明', -6],
    [rise * 0.84, '破晓', -4],
    [rise * 0.92, '曙光', -1],
    [rise, '日出', 2],
    [rise + morning * 0.12, '清晨', 6],
    [rise + morning * 0.4, '上午', 10],
    [noon - morning * 0.08, '正午', 12],
    [noon + afternoon * 0.12, '午后', 11],
    [noon + afternoon * 0.72, '傍晚', 6],
    [noon + afternoon * 0.87, '黄昏', 2],
    [noon + afternoon * 0.95, '日暮', 0],
    [set, '日落', -2],
    [set + evening * 0.08, '薄暮', -5],
    [set + evening * 0.22, '暮色', -8],
    [set + evening * 0.38, '入夜', -12],
    [set + evening * 0.55, '初夜', -16],
    [set + evening * 0.78, '深夜', -24],
    [1440, '子夜', -30],
  ]
  return entries.map(([minute, label, tone]) => ({ minute, label, tone }))
}

/** sRGB 相对亮度及文字对比度；用于主题色测试和每一帧的可读性保护。 */
export function colorContrast(a: number[], b: number[]) {
  const luminance = (rgb: number[]) =>
    rgb.reduce((sum, value, index) => {
      const channel = value / 255
      return (
        sum +
        (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) *
          [0.2126, 0.7152, 0.0722][index]
      )
    }, 0)
  const x = luminance(a),
    y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** 天空保持原色；阅读表面与文字共同满足对比度，防止深浅插值经过灰字灰底。
 * 先确定统一文字极性，轻微调整纸面/页面/浅强调底色，再尽可能保留文字原有色相。
 */
function readablePalette(palette: Record<string, string>) {
  const parse = (key: string) => palette[key].match(/\d+/g)!.map(Number)
  const mix = (a: number[], b: number[], amount: number) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * amount))
  const black = [0, 0, 0],
    white = [255, 255, 255]
  const paper = parse('--paper')
  const ink = colorContrast(black, paper) >= colorContrast(white, paper) ? black : white
  const opposite = ink === black ? white : black
  const css = (rgb: number[]) => `rgb(${rgb.join(' ')})`
  // 为不确定的浏览器取整留余量；背景先保证极限文字色具有至少 4.7:1 对比度。
  const fit = (original: number[], toward: number[], valid: (color: number[]) => boolean) => {
    if (valid(original)) return original
    let low = 0,
      high = 1
    for (let step = 0; step < 12; step++) {
      const mid = (low + high) / 2
      if (valid(mix(original, toward, mid))) high = mid
      else low = mid
    }
    return mix(original, toward, high)
  }
  const backgrounds = {
    '--paper': paper,
    '--cream': parse('--cream'),
    '--mint': parse('--mint'),
    '--page-top': mix(paper, parse('--sky-top'), 0.42),
    '--page-middle': mix(paper, parse('--sky-middle'), 0.34),
  }
  const safe = Object.values(backgrounds).map((color) =>
    fit(color, opposite, (c) => colorContrast(ink, c) >= 4.7),
  )
  Object.keys(backgrounds).forEach((key, i) => {
    palette[key] = css(safe[i])
  })
  for (const key of ['--ink', '--muted', '--dark']) {
    palette[key] = css(
      fit(parse(key), ink, (color) => safe.every((bg) => colorContrast(color, bg) >= 4.5)),
    )
  }
  // 实色强调按钮单独配对文字，避免夜间浅按钮上仍使用白字。
  palette['--green'] = palette['--dark']
  palette['--on-accent'] = css(opposite)
  palette['--text-scheme'] = ink === black ? 'light' : 'dark'
  return palette
}
