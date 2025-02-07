// Imports for image components and icons
import Image from "next/image"
import { Quote } from "lucide-react"

// Array with testimonial data from members
const testimonials = [
  {
    content: "Facilitățile sunt de top și comunitatea este extraordinară. Mi-am îmbunătățit semnificativ jocul de când m-am alăturat.",
    author: "Maria Popescu",
    role: "Jucător Amator",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/testimonial-1.jpg"
  },
  {
    content: "Cel mai bun club de tenis din Satu Mare! Sistemul de rezervare a terenurilor este impecabil, iar antrenorii sunt de clasă mondială.",
    author: "Alexandru Ionescu",
    role: "Jucător Profesionist",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/testimonial-2.jpg"
  },
  {
    content: "Am găsit parteneri de tenis extraordinari prin sistemul lor de potrivire. Experiența a fost fantastică!",
    author: "Elena Dragomir",
    role: "Membru Club",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/testimonial-3.jpg"
  }
]

// Component for testimonials section of the landing page
export function TestimonialsSection() {
  return (
    // Main container with relative positioning for overlay
    <div className="relative py-24 bg-background">
      {/* Background image with tennis pattern and darkening effect */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/tennis-pattern.jpg"
          alt="Tennis pattern"
          fill
          className="object-cover brightness-[0.3]"
        />
      </div>

      {/* Content container positioned above background */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title and description section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ce Spun Membrii Noștri
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Alătură-te comunității noastre de pasionați de tenis și experimentează diferența
            care ne face cel mai important club de tenis din Satu Mare.
          </p>
        </div>

        {/* Grid for testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Iterate through testimonials array for display */}
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background/80 backdrop-blur-sm rounded-lg p-8 relative shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Quote icon for design */}
              <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/40" />
              {/* Testimonial content */}
              <p className="text-muted-foreground mb-6 leading-relaxed">{testimonial.content}</p>
              {/* Author information section */}
              <div className="flex items-center">
                {/* Author profile image */}
                <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Author name and role */}
                <div className="ml-4">
                  <div className="font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 