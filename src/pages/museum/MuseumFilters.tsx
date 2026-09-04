import { categoryLabels, collectionCategories, type CollectionCategory } from './museum.data'

/** 博物馆筛选值：all 显示全部，其余值匹配 category。 */
type Filter = 'all' | CollectionCategory

/** 博物馆专属分类按钮；按钮数据来自 category，页面负责重置页码。 */
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
