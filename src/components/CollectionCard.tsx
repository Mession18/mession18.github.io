import { ArrowUpRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabels, type CollectionItem } from '../data/collections'

export function CollectionCard({ item }: { item: CollectionItem }) {
  return <article className="collection-card"><Link className={`collection-cover collection-${item.color}`} to={`/museum/${item.category}/${item.slug}`}>{item.image ? <img src={item.image} alt={item.title} /> : <span>{item.icon}</span>}<small>{categoryLabels[item.category]}</small></Link><div className="collection-card-body"><div><span>{item.year}</span><span className="collection-rating"><Star size={12} fill="currentColor" /> {item.rating}</span></div><h2><Link to={`/museum/${item.category}/${item.slug}`}>{item.title}</Link></h2><p>{item.excerpt}</p><Link className="collection-open" to={`/museum/${item.category}/${item.slug}`}>查看藏品 <ArrowUpRight size={15} /></Link></div></article>
}
