import { categoryLabels, collectionCategories, type CollectionCategory } from '../data/collections'

type Filter = 'all' | CollectionCategory

export function MuseumFilters({
  value,
  onChange,
}: {
  value: Filter
  onChange: (value: Filter) => void
}) {
  const filters: Filter[] = ['all', ...collectionCategories]
  return (
    <div className="content-filters" aria-label="藏品分类">
      {filters.map((filter) => (
        <button
          className={value === filter ? 'active' : ''}
          key={filter}
          onClick={() => onChange(filter)}
        >
          {filter === 'all' ? '全部藏品' : categoryLabels[filter]}
        </button>
      ))}
    </div>
  )
}
