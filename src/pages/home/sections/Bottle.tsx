import { MessageCircle } from 'lucide-react'

/** 首页漂流瓶区的文案和装饰结构，外观在首页 bottle.css。 */
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
