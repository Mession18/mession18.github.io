import type { SkyState, ThemeContextValue } from '../../../context/ThemeState'
import { sceneWind } from '../../../shared/wind'
import { islandFestival } from './island-festivals'

function blendHex(from: string, to: string, progress: number) {
  return `#${[1, 3, 5]
    .map((start) => {
      const a = parseInt(from.slice(start, start + 2), 16)
      const b = parseInt(to.slice(start, start + 2), 16)
      return Math.round(a + (b - a) * progress)
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`
}

/** 北半球装饰季节；3 月 20 日至 4 月 20 日为固定樱花窗口，并非当地花期预报。
 * date 使用共享天空状态的当地 YYYY-MM-DD，时间预览和跨年都不读取电脑日期。
 */
export function islandSeason(date: string) {
  const month = Number(date.slice(5, 7))
  const season: 'spring' | 'summer' | 'autumn' | 'winter' =
    month >= 3 && month <= 5
      ? 'spring'
      : month >= 6 && month <= 8
        ? 'summer'
        : month >= 9 && month <= 11
          ? 'autumn'
          : 'winter'
  const monthDay = date.slice(5)
  const blossom = monthDay >= '03-20' && monthDay <= '04-20'
  const palette = {
    spring: {
      foliage: ['#a8c973', '#89b664', '#b7d784', '#c2dc93', '#7ca95a'],
      flowers: ['#ffd5df', '#fff1bb', '#c6b2e3', '#f3a8c5'],
      grass: '#a3c577',
      pine: '#659864',
    },
    summer: {
      foliage: ['#77b955', '#559943', '#90c767', '#a0ce70', '#4d8d40'],
      flowers: ['#ffe485', '#f49b82', '#d4b0e9', '#fff1cf'],
      grass: '#8aba5b',
      pine: '#467b56',
    },
    autumn: {
      foliage: ['#c98043', '#ac623c', '#e4a94e', '#d68e48', '#a96b43'],
      flowers: ['#f1c760', '#cd824f', '#e7aa98', '#f4dfb3'],
      grass: '#b2a569',
      pine: '#668154',
    },
    winter: {
      foliage: ['#859782', '#6b8274', '#9eaa98', '#aeb8a4', '#647e70'],
      flowers: ['#e5eff2', '#b5c9df', '#c8bfd9', '#f0e6d3'],
      grass: '#a5b5a3',
      pine: '#527266',
    },
  }[season]
  // 初秋金黄，霜降前后进入红叶盛期；颜色连续变化，不在月初突然换色。
  const autumnProgress =
    season === 'autumn'
      ? Math.max(0, Math.min(1, ((month - 9) * 30 + Number(date.slice(8, 10)) - 1) / 65))
      : 0
  const maple = ['#bc3f33', '#932f30', '#e46b37', '#cd4937', '#a33539']
  return {
    season,
    blossom,
    ...palette,
    foliage: blossom
      ? ['#f7b7cb', '#ed94b5', '#ffd1de', '#ffc2d8', '#dc80a4']
      : palette.foliage.map((color, i) => blendHex(color, maple[i], autumnProgress)),
  }
}

/** 饭点按场景当地时间；冬季或当前/预览气温严格低于 10°C 时全天生火。 */
export function chimneySmoking(date: string, minutes: number, temperature?: number) {
  if (islandSeason(date).season === 'winter' || (Number.isFinite(temperature) && temperature! < 10))
    return true
  return [
    [390, 540],
    [660, 810],
    [1050, 1200],
  ].some(([start, end]) => minutes >= start && minutes < end)
}

/** 同一份实况/预览状态驱动 3D 场景；覆盖天气时不读取仍属于实况的降水量。 */
export function islandSceneState(
  sky: SkyState,
  weather: Pick<ThemeContextValue['weather'], 'kind' | 'intensity' | 'windSpeed'> &
    Partial<Pick<ThemeContextValue['weather'], 'windGusts' | 'windDirection' | 'temperature'>>,
) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  const daylight = clamp((sky.sun.altitude + 6) / 18)
  const day = daylight * daylight * (3 - 2 * daylight)
  const night = 1 - day
  const strength = { light: 0.3, moderate: 0.65, heavy: 1 }[weather.intensity]
  const snow = weather.kind === 'snow' ? strength : 0
  const wet = weather.kind === 'thunder' ? 1 : weather.kind === 'rain' ? strength : 0
  const wind = sceneWind(weather)
  // 灯光独立于天文夜色：黄昏逐渐亮起，阴暗雷暴或强风雨雪也会开灯。
  const dusk = clamp((10 - sky.sun.altitude) / 10)
  const eveningLamps = dusk * dusk * (3 - 2 * dusk)
  const squall = clamp((wind.strength - 0.25) / 0.45)
  const stormDarkness =
    weather.kind === 'thunder' ? 1 : Math.max(snow, wet) * squall * squall * (3 - 2 * squall)
  const lamps = 1 - (1 - eveningLamps) * (1 - stormDarkness * 0.92)
  const transmission = { clear: 1, cloudy: 0.55, fog: 0.2, rain: 0.32, snow: 0.5, thunder: 0.16 }[
    weather.kind
  ]
  // SunCalc 2 的角度是度，方位自北顺时针；场景东方在左、南方朝镜头。
  const source = sky.isNight ? sky.moon : sky.sun
  const azimuth = (source.azimuth * Math.PI) / 180
  const altitude = (source.altitude * Math.PI) / 180
  const horizontal = Math.cos(altitude) * 18
  const lightPosition: [number, number, number] = [
    -Math.sin(azimuth) * horizontal,
    Math.max(2, Math.sin(altitude) * 18),
    -Math.cos(azimuth) * horizontal,
  ]
  const moonlight = clamp((sky.moon.altitude + 1) / 12) * sky.illumination.fraction
  // 保留少量环境光，使月亮落山后仍能看清小屋轮廓；直射月光随月相减弱。
  const directIntensity =
    transmission * (day * 3.1 + night * moonlight * 0.65) * (1 - stormDarkness * day * 0.2)
  const ambientIntensity =
    (0.48 + day * (0.9 + (1 - transmission) * 0.2)) * (1 - stormDarkness * day * 0.24)
  const warm = clamp((sky.sun.altitude + 3) / 20)
  const sunColor = [255, 190 + warm * 54, 145 + warm * 66]
  const lightColor = `#${[163, 194, 255]
    .map((channel, index) =>
      Math.round(channel + (sunColor[index] - channel) * day)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
  const fogDensity = {
    clear: 0.004,
    cloudy: 0.009,
    fog: 0.065,
    rain: 0.013,
    snow: 0.016,
    thunder: 0.022,
  }[weather.kind]
  return {
    flora: islandSeason(sky.date),
    festival: islandFestival(sky.date),
    smoke: chimneySmoking(sky.date, sky.minutes, weather.temperature),
    thunder: weather.kind === 'thunder',
    day,
    night,
    lamps,
    snow,
    wet,
    wind,
    lightPosition,
    directIntensity,
    ambientIntensity,
    lightColor,
    fogDensity: fogDensity + (snow || wet) * wind.strength * 0.015,
  }
}
