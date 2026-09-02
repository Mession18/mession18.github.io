/** Markdown 可填写的主题色编码。新增色彩时只需在这里加入编码并补充对应 CSS。 */
export const colorPalette = ['mint', 'sunshine', 'sky', 'sun', 'rose', 'lavender'] as const
export type IslandColor = (typeof colorPalette)[number]

export function resolveColor(
  value: string | undefined,
  fallback: IslandColor = 'mint',
): IslandColor {
  const normalized = value?.trim().toLowerCase() as IslandColor | undefined
  return normalized && colorPalette.includes(normalized) ? normalized : fallback
}
