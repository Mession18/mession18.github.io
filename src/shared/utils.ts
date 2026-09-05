import type { CSSProperties } from 'react'
import { getPosition, getTimes, getMoonPosition, getMoonIllumination } from 'suncalc'
import { resolveColor, type IslandColor } from './config'

/** 把 YYYY-MM-DD 拆为中文年月日；不完整的值按原文显示。 */
export function formatChineseDate(date?: string) {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${year}年${Number(month)}月${Number(day)}日`
}

/** 组合开始与结束日期；只有一个日期或两者相同则避免重复显示。 */
export function formatDateRange(startDate?: string, finalDate?: string) {
  if (!startDate) return finalDate ?? ''
  if (!finalDate || finalDate === startDate) return startDate
  return `${startDate} - ${finalDate}`
}

/** 把日期拆成年份与月日两部分，方便工作台左右台历分别排版。 */
export function splitDisplayDate(date?: string) {
  if (!date) return undefined
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return { year: date, monthDay: '' }
  return { year, monthDay: `${Number(month)}月${Number(day)}日` }
}

/** 构建时收集所有栏目的正文和封面图片；新增栏目无需再维护逐栏目路径清单。 */
const attachmentFiles = import.meta.glob(
  '../content/**/*.{png,jpg,jpeg,webp,gif,svg,avif,PNG,JPG,JPEG,WEBP,GIF,SVG,AVIF}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>

/** 图片 URL 查找表：同时存储标准化路径和可解码路径，以兼容中文及空格文件名。 */
const normalizedAssets = new Map<string, string>()
/** 逐项建立图片路径索引；解码失败仍保留原始文件名，不中断构建。 */
for (const [path, url] of Object.entries(attachmentFiles)) {
  const normalized = path.replaceAll('\\', '/')
  normalizedAssets.set(normalized, url)
  try {
    normalizedAssets.set(decodeURI(normalized), url)
  } catch {
    // Keep the original key when a filename contains a literal percent sign.
  }
}

/** 把 Markdown 相对图片地址转换为构建 URL，同时兼容 public、旧 src/collections 和外部地址。 */
export function resolveMarkdownImage(src: string, sourceDir?: string) {
  if (/^public\//i.test(src)) return `/${src.replace(/^public\//i, '')}`
  if (sourceDir && /^\/src\//i.test(src)) {
    const relativePath = src
      .replace(/^\/src\/(?:content\/)?/i, '')
      .replace(/^collections\//, 'museum/')
    const direct = normalizedAssets.get(`../content/${relativePath}`)
    if (direct) return direct
  }
  if (!sourceDir || /^(?:[a-z]+:|\/|#)/i.test(src)) return src
  let relativePath = src.replaceAll('\\', '/').replace(/^\.\//, '')
  try {
    relativePath = decodeURI(relativePath)
  } catch {
    // React Markdown may already provide a decoded path.
  }
  const direct = normalizedAssets.get(`../content/${sourceDir}/${relativePath}`)
  if (direct) return direct
  return (
    normalizedAssets.get(`../content/${sourceDir}/image/${relativePath}`) ??
    normalizedAssets.get(`../content/${sourceDir}/images/${relativePath}`) ??
    src
  )
}

/** 支持 tags: [木工, 手作]、tags: 木工, 手作 和 YAML 多行列表。 */
export function parseMarkdownTags(frontmatter: string): string[] {
  const values: string[] = []
  let inTags = false
  for (const line of frontmatter.split(/\r?\n/)) {
    const inline = line.match(/^tags:\s*(.*)$/)
    if (inline) {
      inTags = !inline[1].trim()
      values.push(...inline[1].replace(/^\[|\]$/g, '').split(','))
    } else if (inTags) {
      const item = line.match(/^\s*-\s*(.+)$/)
      if (item) values.push(item[1])
      else if (line.trim()) inTags = false
    }
  }
  return [
    ...new Set(values.map((value) => value.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)),
  ]
}

/** SVG 仅作为界面图标使用，不计入文章或藏品的有效预览图片。 */
export function isDisplayImage(src?: string): src is string {
  return Boolean(src && !/\.svg(?:$|\?)/i.test(src))
}

/** 把不适合预览的地址转为 undefined，让页面进入自己的缺图分支。 */
export function displayImageOrUndefined(src?: string) {
  return isDisplayImage(src) ? src : undefined
}

/** 普通内容的主题色字段，与公共色板使用相同类型。 */
export type PostColor = IslandColor

/** 普通文章、手工、菜谱、旅行和种植共用的数据模型；字段来自 Markdown 头部及正文。 */
export type Post = {
  slug: string
  date: string
  publishedAt: string
  startDate?: string
  finalDate?: string
  readingTime: number
  tag: string
  tags: string[]
  title: string
  excerpt: string
  color: PostColor
  icon: string
  customIcon?: string
  previewImage?: string
  detailImage?: string
  content: string
  sourceDir: string
}

/** 解析普通内容：跳过模板、校验日期与摘要、解析标签和图片，并生成阅读时间等衍生字段。 */
export function parseMarkdown(path: string, source: string, defaultTag = '岛民文章'): Post | null {
  /** 以文件名生成 slug，下划线开头视为模板；随后分离头部元信息和正文。 */
  const filename = path.split('/').pop() ?? ''
  if (filename.startsWith('_')) return null
  const slug = filename.replace(/\.md$/, '')
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`文章 ${filename} 缺少 Markdown 头部信息`)
  /** 解析头部键值字段；正文不参与元数据解析，标签列表由专门函数处理。 */
  const metadata: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const key = line.slice(0, separator).trim()
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    metadata[key] = value
  }
  /** 合并 tags 列表与兼容的单个 tag 字段，并去掉重复标签。 */
  const tags = [
    ...new Set([...parseMarkdownTags(match[1]), ...(metadata.tag ? [metadata.tag] : [])]),
  ]
  const content = match[2].trim()
  /** 从内容路径提取所属栏目，用它解析该 Markdown 的相对图片地址。 */
  const sourceDir = path.match(/content\/([^/]+)\//)?.[1] ?? 'posts'
  const startDate = metadata.date || undefined
  const finalDate = metadata.finaldate || undefined
  /** 优先使用开始日期作为显示及排序日期；手工额外要求必须填写开工 date。 */
  const publishedAt = startDate || finalDate
  if (!publishedAt || !metadata.excerpt)
    throw new Error(`文章 ${filename} 必须填写 date 或 finaldate，并填写 excerpt`)
  if (sourceDir === 'crafts' && !startDate)
    throw new Error(`手工 ${filename} 必须填写开工时间 date`)
  const title = metadata.title || slug
  const color = resolveColor(metadata.color) as PostColor
  const wordCount = content.replace(/\s+/g, '').length
  return {
    slug,
    date: publishedAt.slice(5).replace('-', ' / '),
    publishedAt,
    startDate,
    finalDate,
    readingTime: Number(metadata.readingTime) || Math.max(1, Math.ceil(wordCount / 400)),
    tag: tags[0] || defaultTag,
    tags: tags.length ? tags : [defaultTag],
    title,
    excerpt: metadata.excerpt,
    color,
    icon: metadata.icon || '🌊',
    customIcon: metadata.icon || undefined,
    previewImage: metadata.previewImage
      ? resolveMarkdownImage(metadata.previewImage, sourceDir)
      : undefined,
    detailImage: metadata.detailImage
      ? resolveMarkdownImage(metadata.detailImage, sourceDir)
      : undefined,
    content,
    sourceDir,
  }
}

/** 列表封面优先 previewImage，未设置则使用详情图。 */
export function getPostPreviewImage(post: Post) {
  return post.previewImage || post.detailImage
}

/** 列表封面增加 SVG 过滤，缺少有效照片时由栏目显示占位。 */
export function getPostDisplayImage(post: Post) {
  return displayImageOrUndefined(getPostPreviewImage(post))
}

/** 详情页优先 detailImage，未设置则使用封面。 */
export function getPostDetailImage(post: Post) {
  return post.detailImage || post.previewImage
}

/** 一张底图的标识、图片地址和布局名；布局名与 CSS data-stand-layout 联动。 */
export type Stand = {
  id: string
  /** 不填写图片时继续使用页面原本的 CSS 外观（如明信片）。 */
  image?: string
  /** 对应本页 styles.css 中的 data-stand-layout 选择器。 */
  layout?: string
}

/** 一组标签到图片池的映射；默认 any，all 要求该组每个标签同时存在。 */
export type StandRule = {
  tags: readonly string[]
  match?: 'any' | 'all'
  pool: readonly Stand[]
}

/** 各栏目展示配置契约：文案、替换词、默认池、标签规则和可选空位池。 */
export type PresentationConfig = {
  messages: {
    missing: readonly string[]
    empty: readonly string[]
    tokens?: Readonly<Record<string, readonly string[]>>
  }
  stands: {
    default: readonly Stand[]
    /** 合并所有命中且非空的标签图片集；同一底图只保留一次。 */
    byTags: readonly StandRule[]
    /** 不填写或为空时，空位使用 default 图片集。 */
    empty?: readonly Stand[]
  }
}

/** 从本栏目的自动图片池按文件名取子集；中文、空格文件名先编码再匹配。
 * 不存在的文件会被忽略，返回空集时 selectStand 继续匹配下一条有效规则。
 * 示例：standPoolByFiles(workbenches, ['base.png', 'dark.png'])。
 */
export function standPoolByFiles<T extends Stand>(
  pool: readonly T[],
  filenames: readonly string[],
): T[] {
  const names = new Set(filenames.map((filename) => encodeURIComponent(filename)))
  return pool.filter((stand) => names.has(stand.image?.split('/').pop() ?? ''))
}

/** 纯选择函数，random 可注入，便于验证标签合并和随机边界。 */
export function selectStand(
  config: PresentationConfig,
  tags: readonly string[] = [],
  random: () => number = Math.random,
  empty = false,
): Stand {
  /** 统一去掉标签首尾空格；文章有多个标签时合并每条命中规则的候选底图。 */
  const normalized = new Set(tags.map((tag) => tag.trim()))
  const taggedPool: Stand[] = []
  if (!empty) {
    const seen = new Set<string>()
    for (const candidate of config.stands.byTags) {
      if (!candidate.tags.length || !candidate.pool.length) continue
      const matches =
        candidate.match === 'all'
          ? candidate.tags.every((tag) => normalized.has(tag.trim()))
          : candidate.tags.some((tag) => normalized.has(tag.trim()))
      if (!matches) continue
      for (const stand of candidate.pool) {
        const key = stand.image ?? stand.id
        if (seen.has(key)) continue
        seen.add(key)
        taggedPool.push(stand)
      }
    }
  }
  /** 空位优先独立池，普通卡片优先标签池，最后回退默认池；无图时使用 CSS 外观。 */
  const pool =
    empty && config.stands.empty?.length
      ? config.stands.empty
      : taggedPool.length
        ? taggedPool
        : config.stands.default
  if (!pool.length) return { id: 'css-default', layout: 'default' }
  /** 把随机数映射为图片池下标，并限制范围以处理随机边界。 */
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  return pool[index]
}

/** 把选中的底图写成卡片 data 属性和 --stand-image CSS 变量，连接选图逻辑与外观。 */
export function standAttributes(stand: Stand) {
  return {
    'data-stand': stand.id,
    'data-stand-layout': stand.layout ?? 'default',
    'data-stand-image': Boolean(stand.image) || undefined,
    style: stand.image
      ? ({ '--stand-image': `url(${JSON.stringify(stand.image)})` } as CSSProperties)
      : undefined,
  }
}

/** Fisher–Yates 洗牌：线性遍历副本，每个元素等机会落在任一位置。
 * 首页换一批和文案抽签共用此实现；传入固定 random 可验证边界，原数组不会被修改。
 */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

/** 同一个文案列表抽完一轮再洗牌，避免长期固定使用首条文案。 */
const messageBags = new WeakMap<readonly string[], string[]>()
/** 复用文案抽签袋；抽完后重新洗牌，保证每轮覆盖全部文案。 */
function drawMessage(items: readonly string[]) {
  /** 从上次尚未抽完的文案袋继续抽取，空袋再复制并洗牌。 */
  let bag = messageBags.get(items)
  if (!bag?.length) {
    bag = shuffled(items)
    messageBags.set(items, bag)
  }
  return bag.pop() ?? ''
}

/** 抽取缺图或空位文案，并把 {占位词} 替换成配置中的随机词语。 */
export function drawContentMessage(config: PresentationConfig, kind: 'missing' | 'empty') {
  return drawMessage(config.messages[kind]).replace(/\{([^}]+)\}/g, (token, key: string) => {
    const values = config.messages.tokens?.[key]
    return values?.length ? drawMessage(values) : token
  })
}

/** 按定位时区取得日历日期与分钟数，不受访客电脑的时区设置影响。 */
export function zonedClock(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const part = (name: string) => parts.find((entry) => entry.type === name)!.value
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  }
}

/** 把滑条分钟数显示为 00:00–24:00；1440 明确表示所选日期结束的午夜。 */
export function clockLabel(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
}

/** 定位时区的日历时间转 UTC。夏令时重复小时取较早一次；缺失小时顺延到有效时间。 */
export function dateAtZone(date: string, minutes: number, timezone: string) {
  const wall = Date.parse(`${date}T00:00:00Z`) + minutes * 60_000
  const wallStamp = (instant: number) => {
    const clock = zonedClock(new Date(instant), timezone)
    return Date.parse(`${clock.date}T00:00:00Z`) + clock.minutes * 60_000
  }
  // 前后各一天覆盖夏令时跳变前后的偏移，避免只按当前偏移推算其他季节。
  const offsets = [
    ...new Set(
      [-1, 0, 1].map((day) => {
        const probe = wall + day * 86_400_000
        return wallStamp(probe) - probe
      }),
    ),
  ]
  const candidates = offsets.map((offset) => wall - offset).sort((a, b) => a - b)
  const exact = candidates.find((instant) => wallStamp(instant) === wall)
  return new Date(exact ?? candidates.find((instant) => wallStamp(instant) > wall) ?? candidates[0])
}

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

/** 农历使用浏览器内置中国历；固定在 UTC 正午转换日期，避免浏览器时区造成串日。 */
const chineseCalendar = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})
export function calendarDay(date: string) {
  const instant = new Date(`${date}T12:00:00Z`)
  const parts = chineseCalendar.formatToParts(instant)
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  const digits = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const lunarDay =
    day <= 10
      ? `初${digits[day - 1]}`
      : day < 20
        ? `十${digits[day - 11]}`
        : day === 20
          ? '二十'
          : day < 30
            ? `廿${digits[day - 21]}`
            : '三十'
  // 节日只匹配正常农历月份，闰月不会重复过节；除夕通过次日是否正月初一判定。
  const solar: Record<string, string> = {
    '01-01': '元旦',
    '05-01': '劳动节',
    '06-01': '儿童节',
    '10-01': '国庆节',
  }
  const lunar: Record<string, string> = {
    '正月-1': '春节',
    '正月-15': '元宵节',
    '五月-5': '端午节',
    '七月-7': '七夕',
    '八月-15': '中秋节',
    '九月-9': '重阳节',
    '腊月-8': '腊八节',
  }
  instant.setUTCDate(instant.getUTCDate() + 1)
  const tomorrow = chineseCalendar.formatToParts(instant)
  const eve =
    tomorrow.some((part) => part.type === 'month' && part.value === '正月') &&
    tomorrow.some((part) => part.type === 'day' && part.value === '1')
  const festival = [solar[date.slice(5)], lunar[`${month}-${day}`], eve ? '除夕' : '']
    .filter(Boolean)
    .join(' · ')
  return { lunar: `${month}${lunarDay}`, short: day === 1 ? month : lunarDay, festival }
}
