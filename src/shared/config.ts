/** Markdown 可填写的主题色编码。新增色彩时只需在这里加入编码并补充对应 CSS。 */
export const colorPalette = ['mint', 'sunshine', 'sky', 'sun', 'rose', 'lavender'] as const
/** 主题色字段允许色板名称和十六进制字符串，实际显示值由 resolveColor 校验。 */
export type IslandColor = string

/** 标准化 Markdown 色值：接受内置色名或十六进制格式，不匹配则使用默认色。 */
export function resolveColor(
  value: string | undefined,
  fallback: IslandColor = 'mint',
): IslandColor {
  /** 去掉颜色首尾空格并转小写，统一后再检查内置色名或十六进制格式。 */
  const normalized = value?.trim().toLowerCase() as IslandColor | undefined
  if (normalized && colorPalette.includes(normalized as never)) return normalized
  if (normalized && /^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized
  return fallback
}

/** 把自定义颜色映射到基础 mint 类，保证缺图块仍有完整布局。 */
export function colorClass(value: string) {
  return colorPalette.includes(value as never) ? value : 'mint'
}

/** 十六进制自定义色写入行内背景；命名主题色继续由 CSS 决定。 */
export function colorStyle(value: string) {
  return /^#[0-9a-f]{3,8}$/i.test(value) ? { backgroundColor: value } : undefined
}

/** 采用普通内容模型的展台栏目键；新增同类栏目时在此扩展。 */
export type ContentSectionKey = 'recipes' | 'crafts' | 'travel' | 'planting'
/** 四个展台栏目统一每页九格。 */
export const displayPageSize = 9

/** 各栏目的“全部”筛选按钮文案。 */
export function allItemsLabel(section: ContentSectionKey) {
  const labels: Partial<Record<ContentSectionKey, string>> = {
    recipes: '全部菜品',
    crafts: '全部手工',
    travel: '全部明信片',
    planting: '全部植物',
  }
  return labels[section] ?? '全部内容'
}
/** 栏目标题、英文眉题和简介；列表页与搜索入口共享这份定义。 */
export const contentSectionInfo: Record<
  ContentSectionKey,
  { title: string; eyebrow: string; description: string }
> = {
  recipes: { title: '菜谱', eyebrow: 'ISLAND RECIPES', description: '记录值得反复品尝的味道。' },
  crafts: { title: '手工', eyebrow: 'ISLAND DIY', description: '把灵感慢慢做成看得见的东西。' },
  travel: { title: '旅游', eyebrow: 'ISLAND TRAVEL', description: '收藏一路遇见的风景与故事。' },
  planting: { title: '种植', eyebrow: 'ISLAND GARDEN', description: '记录播种、开花与收获。' },
}
