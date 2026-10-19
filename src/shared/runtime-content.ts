/** Router builds load only the explicitly deployed snapshot before content modules run. */
export type RuntimeContent = { documents: Record<string, string | null>; candidate: string }
let catalog: RuntimeContent | undefined
export function setRuntimeContent(value: RuntimeContent) {
  catalog = value
}
export function withRuntimeContent(files: Record<string, string>, category?: string) {
  if (!catalog) return files
  const sample = Object.keys(files)[0] ?? '../../content/posts/empty.md'
  const prefix = sample.slice(0, sample.indexOf('content/') + 'content/'.length)
  const section = category ?? sample.match(/content\/([^/]+)\//)?.[1]
  const result = { ...files }
  for (const [path, source] of Object.entries(catalog.documents)) {
    if (!path.startsWith(`src/content/${section}/`)) continue
    const localPath = prefix + path.slice('src/content/'.length)
    if (source === null) delete result[localPath]
    else result[localPath] = source
  }
  return result
}
