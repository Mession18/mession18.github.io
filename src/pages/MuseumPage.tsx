import { useState } from 'react'
import { CollectionCard } from '../components/CollectionCard'
import { MuseumFilters } from '../components/MuseumFilters'
import { collections, type CollectionCategory } from '../data/collections'

type Filter = 'all' | CollectionCategory

export function MuseumPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const visibleItems =
    filter === 'all' ? collections : collections.filter((item) => item.category === filter)
  return (
    <div className="museum-page page-surface">
      <header className="page-heading museum-page-heading">
        <p className="eyebrow">ISLAND COLLECTION</p>
        <h1>岛上的小小博物馆</h1>
        <p>收藏那些让心里亮起一盏小灯的东西。</p>
      </header>
      <MuseumFilters value={filter} onChange={setFilter} />
      <section className="collection-grid" aria-live="polite">
        {visibleItems.map((item) => (
          <CollectionCard key={item.slug} item={item} />
        ))}
      </section>
    </div>
  )
}
