import type { CSSProperties } from 'react'

export type Stand = { id: string; image?: string; layout?: string }
export type StandRule = {
  tags: readonly string[]
  match?: 'any' | 'all'
  pool: readonly Stand[]
}
export type PresentationConfig = {
  messages: {
    missing: readonly string[]
    empty: readonly string[]
    tokens?: Readonly<Record<string, readonly string[]>>
  }
  stands: {
    default: readonly Stand[]
    byTags: readonly StandRule[]
    empty?: readonly Stand[]
  }
}

export function standPoolByFiles<T extends Stand>(
  pool: readonly T[],
  filenames: readonly string[],
) {
  const names = new Set(filenames.map((filename) => encodeURIComponent(filename)))
  return pool.filter((stand) => names.has(stand.image?.split('/').pop() ?? ''))
}

/** `家常菜.png` 自动匹配 `家常菜` 标签；基础图不参与标签映射。 */
export function standRulesByImageNames<T extends Stand>(
  pool: readonly T[],
  basicFilenames: readonly string[],
): StandRule[] {
  const basicNames = new Set(basicFilenames.map((filename) => encodeURIComponent(filename)))
  return pool.flatMap((stand) => {
    const encodedFilename = stand.image?.split('/').pop()
    if (!encodedFilename || basicNames.has(encodedFilename)) return []
    const filename = decodeURIComponent(encodedFilename)
    const extensionAt = filename.lastIndexOf('.')
    const tag = (extensionAt > 0 ? filename.slice(0, extensionAt) : filename).trim()
    return tag ? [{ tags: [tag], pool: [stand] }] : []
  })
}

export function selectStand(
  config: PresentationConfig,
  tags: readonly string[] = [],
  random: () => number = Math.random,
  empty = false,
): Stand {
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
  const pool =
    empty && config.stands.empty?.length
      ? config.stands.empty
      : taggedPool.length
        ? taggedPool
        : config.stands.default
  if (!pool.length) return { id: 'css-default', layout: 'default' }
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  return pool[index]
}

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

export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

const messageBags = new WeakMap<readonly string[], string[]>()
function drawMessage(items: readonly string[]) {
  let bag = messageBags.get(items)
  if (!bag?.length) {
    bag = shuffled(items)
    messageBags.set(items, bag)
  }
  return bag.pop() ?? ''
}

export function drawContentMessage(config: PresentationConfig, kind: 'missing' | 'empty') {
  return drawMessage(config.messages[kind]).replace(/\{([^}]+)\}/g, (token, key: string) => {
    const values = config.messages.tokens?.[key]
    return values?.length ? drawMessage(values) : token
  })
}
