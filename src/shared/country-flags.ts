/** 从依赖中的全部 4×3 国旗 SVG 生成 URL 索引。 */
const flagFiles = import.meta.glob('../../node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const countryFlags = Object.fromEntries(
  Object.entries(flagFiles).map(([path, url]) => [path.split('/').pop()!.replace('.svg', ''), url]),
) as Record<string, string>

const chineseRegions = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
const normalizeRegionName = (name: string) =>
  name
    .trim()
    .replaceAll(' ', '')
    .replace(/(?:特别行政区|地区)$/u, '')

/** 标准两位地区码全部由 Intl 转成简体中文；别名只补足日常中文写法。 */
const chineseNameToCode = new Map<string, string>()
for (const code of Object.keys(countryFlags).filter((value) => /^[a-z]{2}$/u.test(value))) {
  const name = chineseRegions.of(code.toUpperCase())
  if (name) chineseNameToCode.set(normalizeRegionName(name), code)
}

const regionAliases: Record<string, string> = {
  中国: 'cn',
  中国大陆: 'cn',
  大陆: 'cn',
  中华人民共和国: 'cn',
  香港: 'hk',
  中国香港: 'hk',
  澳门: 'mo',
  中国澳门: 'mo',
  台湾: 'tw',
  中国台湾: 'tw',
  韩国: 'kr',
  南韩: 'kr',
  朝鲜: 'kp',
  北朝鲜: 'kp',
  俄罗斯: 'ru',
  俄国: 'ru',
  英国: 'gb',
  美国: 'us',
}
for (const [name, code] of Object.entries(regionAliases))
  chineseNameToCode.set(normalizeRegionName(name), code)

/** 用简体中文国家或地区名查找国旗；未知名称返回 undefined。 */
export function countryCodeForChineseName(name?: string) {
  return name ? chineseNameToCode.get(normalizeRegionName(name)) : undefined
}

/** 只有中国大陆使用方章；港澳台及其他国家地区均使用圆章。 */
export function isMainlandChina(name?: string) {
  return countryCodeForChineseName(name) === 'cn'
}
