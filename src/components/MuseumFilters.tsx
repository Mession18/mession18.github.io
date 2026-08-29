import { categoryLabels, type CollectionCategory } from '../data/collections'

type Filter = 'all' | CollectionCategory

export function MuseumFilters({
  value,
  onChange,
}: {
  value: Filter
  onChange: (value: Filter) => void
}) {
  const filters: Filter[] = ['all', 'photos', 'games', 'books', 'music']
  return (
    <div className="museum-filters" aria-label="藏品分类">
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
