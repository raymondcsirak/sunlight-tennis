// Imports for UI components and utilities
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

// Component for the main hero section of the landing page
export function HeroSection() {
  return (
    // Main container with full screen height and centering
    <div className="relative min-h-screen flex items-center">
      {/* Background image with contrast overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/hero-tennis.jpg"
          alt="Tennis player in action"
          fill
          className="object-cover brightness-[0.90]"
          priority
        />
        {/* Gradient for improved text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-transparent" />
      </div>

      {/* Main content with title and description */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xxl">
          {/* Main title with animated text on three lines */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white space-y-1">
            <span className="block">STILUL DE VIAȚĂ</span>
            <span className="block text-primary">CARE TE MENȚINE</span>
            <span className="block">ENERGIZAT</span>
          </h1>
          {/* Main description */}
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-lg">
            Cu o listă diversă de membri, echipamente profesionale și numeroase terenuri îngrijite,
            Sunlight Tennis Club este destinația perfectă pentru sport și recreere!
          </p>
          {/* Main call-to-action button */}
          <div className="mt-8">
            <Button
              size="lg"
              className="text-lg h-14 px-8 bg-primary hover:bg-primary/90 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              asChild
            >
              <Link href="/sign-up">REZERVĂ UN TEREN</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics section with semi-transparent background */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Grid for statistics with 4 columns on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Statistics for courts */}
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">4+</div>
              <div className="text-sm text-gray-300 mt-1">Terenuri Profesionale</div>
            </div>
            {/* Statistics for coaches */}
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">3</div>
              <div className="text-sm text-gray-300 mt-1">Antrenori Experți</div>
            </div>
            {/* Statistics for members */}
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">500+</div>
              <div className="text-sm text-gray-300 mt-1">Membri Activi</div>
            </div>
            {/* Statistics for experience */}
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">20+</div>
              <div className="text-sm text-gray-300 mt-1">Ani de Experiență</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 