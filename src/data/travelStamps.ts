export type TravelStamp = {
  place: string
  region: string
  countryOrRegion: string
  date: string
  mark?: string
  countryCode?: string
  color: 'green' | 'blue' | 'red' | 'violet'
  shape?: 'round' | 'square'
  rotation?: number
  note?: string
}

// 每增加一条记录，护照签证页就会自动排版；每页最多显示 6 枚章。
// countryOrRegion 用于年鉴统计：国内城市填“中国”，香港、澳门等可分别填写“香港”“澳门”。
export const travelStamps: TravelStamp[] = [
  {
    place: '烟台',
    region: '中国 · 山东',
    countryOrRegion: '中国',
    date: '2001.08.18',
    mark: '🏠',
    color: 'green',
    shape: 'square',
    rotation: -8,
    note: '常驻地',
  },
  {
    place: '北京',
    region: '中国 · 北京',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🏯',
    color: 'red',
    shape: 'square',
    rotation: -6,
  },
  {
    place: '天津',
    region: '中国 · 天津',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🎡',
    color: 'blue',
    shape: 'square',
    rotation: 5,
  },
  {
    place: '沈阳',
    region: '中国 · 辽宁',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🏛️',
    color: 'red',
    shape: 'square',
    rotation: -3,
  },
  {
    place: '丽江',
    region: '中国 · 云南',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🏔️',
    color: 'blue',
    shape: 'square',
    rotation: 7,
  },
  {
    place: '香格里拉',
    region: '中国 · 云南',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🛕',
    color: 'violet',
    shape: 'square',
    rotation: -8,
  },
  {
    place: '重庆',
    region: '中国 · 重庆',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🚠',
    color: 'red',
    shape: 'square',
    rotation: 4,
  },
  {
    place: '济南',
    region: '中国 · 山东',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '⛲',
    color: 'blue',
    shape: 'square',
    rotation: -5,
  },
  {
    place: '南京',
    region: '中国 · 江苏',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🧱',
    color: 'red',
    shape: 'square',
    rotation: 6,
  },
  {
    place: '威海',
    region: '中国 · 山东',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '⚓',
    color: 'blue',
    shape: 'square',
    rotation: -7,
  },
  {
    place: '青岛',
    region: '中国 · 山东',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '🍺',
    color: 'green',
    shape: 'square',
    rotation: 5,
  },
  {
    place: '泰安',
    region: '中国 · 山东',
    countryOrRegion: '中国',
    date: '填写日期',
    mark: '⛰️',
    color: 'green',
    shape: 'square',
    rotation: -4,
  },
  {
    place: '首尔',
    region: '韩国 · 首尔',
    countryOrRegion: '韩国',
    date: '填写日期',
    countryCode: 'kr',
    color: 'violet',
    rotation: 7,
  },
]
