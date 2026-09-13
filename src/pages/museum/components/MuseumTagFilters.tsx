/** 博物馆标签筛选按钮；标签直接来自 Markdown，新增标签无需维护代码清单。 */
export function MuseumTagFilters({
  tags,
  value,
  onChange,
}: {
  tags: readonly string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="content-filters" aria-label="藏品标签">
      {['all', ...tags].map((tag) => (
        <button className={value === tag ? 'active' : ''} key={tag} onClick={() => onChange(tag)}>
          {tag === 'all' ? '全部藏品' : tag}
        </button>
      ))}
    </div>
  )
}
