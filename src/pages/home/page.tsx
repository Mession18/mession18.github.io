import { Passport } from '../passport/page'
import { Bottle } from './sections/Bottle'
import { CraftHomeSection } from './sections/CraftPreview'
import { Hero } from './sections/Hero'
import { Journal } from './sections/Journal'
import { Museum } from './sections/Museum'
import { PlantingHomeSection } from './sections/PlantingPreview'
import { RecipeHomeSection } from './sections/RecipePreview'
import { TravelHomeSection } from './sections/TravelPreview'

/** 首页区域装配表；组件排列顺序就是访客从上到下看到的顺序。 */
export function HomePage() {
  return (
    <>
      <Hero />
      <Journal />
      <Museum />
      <RecipeHomeSection />
      <CraftHomeSection />
      <TravelHomeSection />
      <PlantingHomeSection />
      <Passport />
      <Bottle />
    </>
  )
}
