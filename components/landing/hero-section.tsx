import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/hero-tennis.jpg"
          alt="Tennis player in action"
          fill
          className="object-cover brightness-[0.90]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white space-y-1">
            <span className="block">STILUL DE VIAȚĂ</span>
            <span className="block text-primary">CARE TE MENȚINE</span>
            <span className="block">ENERGIZAT</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-lg">
            Cu o listă diversă de membri, echipamente profesionale și numeroase terenuri îngrijite,
            SunlightTennis este destinația perfectă pentru sport și recreere!
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="text-lg h-14 px-8 bg-primary hover:bg-primary/90"
              asChild
            >
              <Link href="/sign-in">REZERVĂ UN TEREN</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">10+</div>
              <div className="text-sm text-gray-300 mt-1">Terenuri Profesionale</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">15+</div>
              <div className="text-sm text-gray-300 mt-1">Antrenori Experți</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">500+</div>
              <div className="text-sm text-gray-300 mt-1">Membri Activi</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">18</div>
              <div className="text-sm text-gray-300 mt-1">Ani de Experiență</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 