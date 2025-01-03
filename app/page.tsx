import { HeroSection } from "@/components/landing/hero-section"
import { AboutSection } from "@/components/landing/about-section"
import { CoachesSection } from "@/components/landing/coaches-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { ContactSection } from "@/components/landing/contact-section"

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <CoachesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <ContactSection />
    </main>
  )
}
