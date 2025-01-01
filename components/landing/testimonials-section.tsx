import Image from "next/image"
import { Quote } from "lucide-react"

const testimonials = [
  {
    content: "The facilities are top-notch and the community is amazing. I've improved my game significantly since joining.",
    author: "Maria Popescu",
    role: "Amateur Player",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/testimonial-1.jpg"
  },
  {
    content: "Best tennis club in Bucharest! The court booking system is seamless, and the trainers are world-class.",
    author: "Alexandru Ionescu",
    role: "Professional Player",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/testimonial-2.jpg"
  },
  {
    content: "Found amazing tennis partners through their matching system. The experience has been fantastic!",
    author: "Elena Dragomir",
    role: "Club Member",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/testimonial-3.jpg"
  }
]

export function TestimonialsSection() {
  return (
    <div className="relative py-24 bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/tennis-pattern.jpg"
          alt="Tennis pattern"
          fill
          className="object-cover brightness-[0.3]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Members Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community of tennis enthusiasts and experience the difference
            that makes us the leading tennis club in Bucharest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background/80 backdrop-blur-sm rounded-lg p-8 relative shadow-lg hover:shadow-xl transition-shadow"
            >
              <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/40" />
              <p className="text-muted-foreground mb-6 leading-relaxed">{testimonial.content}</p>
              <div className="flex items-center">
                <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                  />
                </div>
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