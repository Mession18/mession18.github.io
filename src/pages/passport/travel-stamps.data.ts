import type { Post } from '../../shared/utils'
import { countryCodeForChineseName } from '../../shared/country-flags'
import { travel } from '../travel/travel.data'

/** 旅行章字段说明：地点、国家地区、起止日期、色彩及可选国旗等。 */
export type TravelStamp = {
  id?: string
  province?: string
  city: string
  countryOrRegion: string
  startDate: string
  endDate?: string
  countryCode?: string
  color: 'green' | 'blue' | 'red' | 'violet'
  rotation?: number
  note?: string
}

// 手动章继续在这里添加；startDate/endDate 使用 YYYY.MM.DD，全部章会按 startDate 排序。
// countryOrRegion 填简体中文国家或地区名，国旗与方章/圆章形状会自动识别；每页最多 6 枚。
export const travelStamps: TravelStamp[] = [
  {
    province: '山东',
    city: '烟台',
    countryOrRegion: '中国',
    startDate: '2001.08.18',
    color: 'green',
    rotation: -8,
    note: '常驻地',
  },
  {
    city: '北京',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'red',
    rotation: -6,
  },
  {
    city: '天津',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'blue',
    rotation: 5,
  },
  {
    province: '辽宁',
    city: '沈阳',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'red',
    rotation: -3,
  },
  {
    province: '云南',
    city: '丽江',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'blue',
    rotation: 7,
  },
  {
    province: '云南',
    city: '香格里拉',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'violet',
    rotation: -8,
  },
  {
    city: '重庆',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'red',
    rotation: 4,
  },
  {
    province: '山东',
    city: '济南',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'blue',
    rotation: -5,
  },
  {
    province: '江苏',
    city: '南京',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'red',
    rotation: 6,
  },
  {
    province: '山东',
    city: '威海',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'blue',
    rotation: -7,
  },
  {
    province: '山东',
    city: '青岛',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'green',
    rotation: 5,
  },
  {
    province: '山东',
    city: '泰安',
    countryOrRegion: '中国',
    startDate: '填写日期',
    color: 'green',
    rotation: -4,
  },
  {
    province: '首尔特别市',
    city: '首尔',
    countryOrRegion: '韩国',
    startDate: '填写日期',
    color: 'violet',
    rotation: 7,
  },
]

const postColorToStampColor: Record<string, TravelStamp['color']> = {
  mint: 'green',
  sunshine: 'red',
  sun: 'red',
  sky: 'blue',
  rose: 'red',
  lavender: 'violet',
}

/** 旅游文章自动转换为旅行章；专用 stamp 字段缺省时从文章标签、日期和主题色推导。 */
export function travelPostToStamp(post: Post): TravelStamp {
  const countryOrRegion = post.tags[0] ?? '未分类'
  return {
    id: `travel-${post.slug}`,
    province: post.province,
    city: post.city ?? post.title,
    countryOrRegion,
    startDate: post.startDate?.replaceAll('-', '.') ?? post.publishedAt.replaceAll('-', '.'),
    endDate: post.finalDate?.replaceAll('-', '.'),
    countryCode: countryCodeForChineseName(countryOrRegion),
    color: post.stampColor ?? postColorToStampColor[post.color] ?? 'green',
    rotation: post.stampRotation,
    note: post.stampNote,
  }
}

function stampStartTime(stamp: TravelStamp) {
  const normalized = stamp.startDate.replaceAll('.', '-')
  return /^\d{4}-\d{2}-\d{2}$/u.test(normalized)
    ? Date.parse(`${normalized}T00:00:00Z`)
    : Number.POSITIVE_INFINITY
}

/** 补齐手工章的国旗与形状，并与文章章按开始日期从早到晚统一排序。 */
export const passportTravelStamps = [...travelStamps, ...travel.map(travelPostToStamp)]
  .map((stamp) => ({
    ...stamp,
    countryCode: stamp.countryCode ?? countryCodeForChineseName(stamp.countryOrRegion),
  }))
  .sort((left, right) => stampStartTime(left) - stampStartTime(right))
