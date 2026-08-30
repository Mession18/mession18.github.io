const flagFiles = import.meta.glob('../../node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const countryFlags = Object.fromEntries(
  Object.entries(flagFiles).map(([path, url]) => [path.split('/').pop()!.replace('.svg', ''), url]),
) as Record<string, string>
