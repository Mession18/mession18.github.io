import { useState } from 'react'
import { CollectionCard } from '../components/CollectionCard'
import { MuseumFilters } from '../components/MuseumFilters'
import { IslandPagination } from '../components/IslandPagination'
import { collections, type CollectionCategory } from '../data/collections'

type Filter = 'all' | CollectionCategory

export function MuseumPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const visibleItems =
    filter === 'all' ? collections : collections.filter((item) => item.category === filter)
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / 30))
  const pageItems = visibleItems.slice((page - 1) * 30, page * 30)
  return (
    <div className="museum-page page-surface">
      <header className="page-heading museum-page-heading">
        <p className="eyebrow">ISLAND COLLECTION</p>
        <h1>岛上的小小博物馆</h1>
        <p>收藏那些让心里亮起一盏小灯的东西。</p>
      </header>
      <MuseumFilters
        value={filter}
        onChange={(value) => {
          setFilter(value)
          setPage(1)
        }}
      />
      <section className="collection-grid" aria-live="polite">
        {pageItems.map((item) => (
          <CollectionCard key={item.slug} item={item} />
        ))}
      </section>
      <IslandPagination page={page} total={totalPages} onChange={setPage} />
    </div>
  )
}
