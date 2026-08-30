import { Bottle } from '../components/Bottle'
import { Hero } from '../components/Hero'
import { Journal } from '../components/Journal'
import { Museum } from '../components/Museum'
import { Passport } from '../components/Passport'

export function HomePage() {
  return (
    <>
      <Hero />
      <Journal />
      <Divider type="wave-yellow" className="island-section-divider" />
      <Museum />
      <Divider type="wave-yellow" className="island-section-divider" />
      <Passport />
      <Divider type="wave-yellow" className="island-section-divider" />
      <Bottle />
    </>
  )
}
import { Divider } from 'animal-island-ui'
