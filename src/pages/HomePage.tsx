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
      <Museum />
      <Passport />
      <Bottle />
    </>
  )
}
