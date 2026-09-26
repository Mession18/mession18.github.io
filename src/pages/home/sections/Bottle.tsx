import { MessageCircle } from 'lucide-react'

export function Bottle() {
  return (
    <section className="bottle section">
      <MessageCircle size={32} />
      <div>
        <h2>漂流瓶里有一封信</h2>
        <p>“愿你今天也遇见一件小小的好事。”</p>
      </div>
      <button>留下回信</button>
    </section>
  )
}
