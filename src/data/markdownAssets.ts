const attachmentFiles = import.meta.glob(
  [
    '../posts/image/**/*',
    '../posts/images/**/*',
    '../crafts/image/**/*',
    '../crafts/images/**/*',
    '../recipes/image/**/*',
    '../recipes/images/**/*',
    '../planting/image/**/*',
    '../planting/images/**/*',
    '../travel/image/**/*',
    '../travel/images/**/*',
    '../collections/image/**/*',
    '../collections/images/**/*',
  ],
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>

const normalizedAssets = new Map<string, string>()
for (const [path, url] of Object.entries(attachmentFiles)) {
  const normalized = path.replaceAll('\\', '/')
  normalizedAssets.set(normalized, url)
  try {
    normalizedAssets.set(decodeURI(normalized), url)
  } catch {
    // Keep the original key when a filename contains a literal percent sign.
  }
}

export function resolveMarkdownImage(src: string, sourceDir?: string) {
  if (!sourceDir || /^(?:[a-z]+:|\/|#)/i.test(src)) return src
  let relativePath = src.replaceAll('\\', '/').replace(/^\.\//, '')
  try {
    relativePath = decodeURI(relativePath)
  } catch {
    // React Markdown may already provide a decoded path.
  }
  const direct = normalizedAssets.get(`../${sourceDir}/${relativePath}`)
  if (direct) return direct
  return (
    normalizedAssets.get(`../${sourceDir}/image/${relativePath}`) ??
    normalizedAssets.get(`../${sourceDir}/images/${relativePath}`) ??
    src
  )
}
