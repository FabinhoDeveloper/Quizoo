import { Nav } from '../components/landing/Nav'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Features } from '../components/landing/Features'
import { Audiences } from '../components/landing/Audiences'
import { Accessibility } from '../components/landing/Accessibility'
import { Faq } from '../components/landing/Faq'
import { Cta } from '../components/landing/Cta'
import { Footer } from '../components/landing/Footer'

export function LandingPage() {
  return (
    <div className="overflow-hidden">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <Audiences />
      <Accessibility />
      <Faq />
      <Cta />
      <Footer />
    </div>
  )
}
