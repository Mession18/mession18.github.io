import { Bottle } from '../components/Bottle'
import { Hero } from '../components/Hero'
import { Journal } from '../components/Journal'
import { IslandDirectory } from '../components/IslandDirectory'
import { Museum } from '../components/Museum'
import { Passport } from '../components/Passport'

export function HomePage() {
  return (
    <>
      <Hero />
      <Journal />
      <Museum />
      <IslandDirectory />
      <Passport />
      <Bottle />
    </>
  )
}
import { Divider } from 'animal-island-ui'
