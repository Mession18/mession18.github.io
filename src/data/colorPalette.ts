/** Markdown 可填写的主题色编码。新增色彩时只需在这里加入编码并补充对应 CSS。 */
export const colorPalette = ['mint', 'sunshine', 'sky', 'sun', 'rose', 'lavender'] as const
export type IslandColor = string

export function resolveColor(
  value: string | undefined,
  fallback: IslandColor = 'mint',
): IslandColor {
  const normalized = value?.trim().toLowerCase() as IslandColor | undefined
  if (normalized && colorPalette.includes(normalized as never)) return normalized
  if (normalized && /^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized
  return fallback
}

export function colorClass(value: string) {
  return colorPalette.includes(value as never) ? value : 'mint'
}

export function colorStyle(value: string) {
  return /^#[0-9a-f]{3,8}$/i.test(value) ? { backgroundColor: value } : undefined
}
