export type CollectionCategory = 'photos' | 'games' | 'books' | 'music'
export type CollectionColor = 'mint' | 'sun' | 'sky' | 'rose' | 'lavender'

export type CollectionItem = {
  id: string
  slug: string
  category: CollectionCategory
  title: string
  subtitle: string
  year: string
  rating: number
  icon: string
  image?: string
  color: CollectionColor
  excerpt: string
  content: string
}

export const categoryLabels: Record<CollectionCategory, string> = {
  photos: '照片',
  games: '游戏',
  books: '书籍',
  music: '音乐',
}

export const collections: CollectionItem[] = [
  {
    id: 'G-001',
    slug: 'animal-crossing',
    category: 'games',
    title: '动物森友会',
    subtitle: '一座可以随时回去的小岛',
    year: '2026',
    rating: 5,
    icon: '🏝️',
    color: 'mint',
    excerpt: '每天看看天气，和岛民聊几句话，再慢慢整理自己的小屋。',
    content:
      '## 收藏理由\n\n它最迷人的地方，是允许人按照自己的速度生活。偶尔离开没有关系，回来的时候，小岛仍然会认真地欢迎你。\n\n> 不必完成所有事情，也能度过很好的一天。\n\n喜欢收集家具、观察季节变化，也喜欢那些没有目的地的岛上散步。',
  },
  {
    id: 'G-002',
    slug: 'stardew-valley',
    category: 'games',
    title: '星露谷物语',
    subtitle: '四季循环里的慢生活',
    year: '2025',
    rating: 4.8,
    icon: '🌾',
    image: '/images/collections/stardewvalley.png',
    color: 'sun',
    excerpt: '种田、钓鱼、认识小镇居民，错过的事情明年还会再来。',
    content:
      '## 收藏理由\n\n刚开始总想安排好每一分钟，后来才发现，农场生活并不是一场效率比赛。\n\n雨天去钓鱼，冬天整理仓库，在像素世界里也能找到安静的节奏。',
  },
  {
    id: 'B-001',
    slug: 'the-little-prince',
    category: 'books',
    title: '小王子',
    subtitle: '写给大人的童话',
    year: '2024',
    rating: 4.9,
    icon: '🌟',
    color: 'lavender',
    excerpt: '有些重要的东西，需要用心才能看见。',
    content:
      '## 收藏理由\n\n每个年龄重新阅读，都会注意到不同的句子。关于相遇、陪伴、告别，也关于如何保留一点孩子般的认真。\n\n书很薄，却适合在许多个夜晚重新打开。',
  },
  {
    id: 'M-001',
    slug: 'sunny-walk-playlist',
    category: 'music',
    title: '晴天散步歌单',
    subtitle: '适合戴着耳机慢慢走',
    year: '2026',
    rating: 4.7,
    icon: '🎧',
    color: 'sky',
    excerpt: '没有固定目的地时，音乐就是散步的路线。',
    content:
      '## 收藏理由\n\n这是一张会不断变化的私人歌单。收录适合晴天、海边、公园和傍晚街道的音乐。\n\n听见其中某一首时，也会想起当时走过的路。',
  },
  {
    id: 'P-001',
    slug: 'island-summer',
    category: 'photos',
    title: '岛上的夏日',
    subtitle: '花与冰柠檬水',
    year: '2026.08',
    rating: 4.8,
    icon: '🌼',
    color: 'rose',
    excerpt: '把明亮、炎热和傍晚的风留在一张照片里。',
    content:
      '## 照片背后\n\n夏天的颜色很满。黄色的小花、绿色的树叶，还有玻璃杯外凝结的水珠。\n\n照片不一定需要记录大事，它只要能把某一刻带回来就足够了。',
  },
  {
    id: 'P-002',
    slug: 'on-the-way',
    category: 'photos',
    title: '散步途中',
    subtitle: '走过很多次的小路',
    year: '2026.07',
    rating: 4.6,
    icon: '🌳',
    color: 'mint',
    excerpt: '熟悉的路也会因为光线和季节变得不一样。',
    content:
      '## 照片背后\n\n这条路已经走过很多次，但那天树影的位置刚刚好。\n\n拍照以后才发现，日常并不是重复，而是一些很缓慢的变化。',
  },
]
