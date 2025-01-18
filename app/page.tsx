import { HeroSection } from "@/components/landing/hero-section"
import { AboutSection } from "@/components/landing/about-section"
import { CoachesSection } from "@/components/landing/coaches-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { ContactSection } from "@/components/landing/contact-section"

// Make the page completely static
export const dynamic = 'force-static'

export const metadata = {
  title: 'SunlightTennis - Tennis Club Management Platform',
  description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <AboutSection />
      <CoachesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <ContactSection />
    </main>
  )
}
