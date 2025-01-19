// Importuri pentru sectiunile paginii de landing
import { HeroSection } from "@/components/landing/hero-section"
import { AboutSection } from "@/components/landing/about-section"
import { CoachesSection } from "@/components/landing/coaches-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { ContactSection } from "@/components/landing/contact-section"

// Fortam pagina sa fie complet statica pentru performanta optima
export const dynamic = 'force-static'

// Configurarea metadatelor specifice pentru pagina principala
export const metadata = {
  title: 'SunlightTennis - Tennis Club Management Platform',
  description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
}

// Componenta principala pentru pagina de landing
export default function Home() {
  return (
    // Container principal cu flexbox pentru aranjarea sectiunilor vertical
    <main className="flex min-h-screen flex-col">
      {/* Sectiunea hero cu elementele principale de atractie */}
      <HeroSection />
      {/* Sectiunea despre noi cu informatii despre club */}
      <AboutSection />
      {/* Sectiunea cu antrenorii nostri */}
      <CoachesSection />
      {/* Sectiunea cu functionalitati si beneficii */}
      <FeaturesSection />
      {/* Sectiunea cu testimoniale de la clienti */}
      <TestimonialsSection />
      {/* Sectiunea de contact si formular */}
      <ContactSection />
    </main>
  )
}
