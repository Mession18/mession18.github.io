import { Bottle } from '../components/Bottle'
import { Hero } from '../components/Hero'
import { Journal } from '../components/Journal'
import {
  CraftHomeSection,
  PlantingHomeSection,
  RecipeHomeSection,
  TravelHomeSection,
} from '../components/HomeContentSections'
import { Museum } from '../components/Museum'
import { Passport } from '../components/Passport'

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
      {/* 护照不是独立页面：导航 /#about 指向此组件的 id="about"。样式：styles/passport.css */}
      <Passport />
      <Bottle />
    </>
  )
}
