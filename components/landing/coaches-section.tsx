import Image from "next/image"

const coaches = [
  {
    name: "Alex Popescu",
    role: "Head Coach",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-1.jpg",
    specialization: "Lorem ipsum dolor sit amet"
  },
  {
    name: "Maria Ionescu",
    role: "Junior Coach",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-2.jpg",
    specialization: "Consectetur adipiscing elit"
  },
  {
    name: "Stefan Popa",
    role: "Performance Coach",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-3.jpg",
    specialization: "Sed do eiusmod tempor"
  }
]

export function CoachesSection() {
  return (
    <div className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Grow your skill with academy team
          </h2>
          <p className="text-muted-foreground text-lg">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coaches.map((coach) => (
            <div key={coach.name} className="group relative">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                <Image
                  src={coach.image}
                  alt={coach.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {coach.name}
                  </h3>
                  <p className="text-primary font-medium mb-2">
                    {coach.role}
                  </p>
                  <p className="text-sm text-gray-300">
                    {coach.specialization}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 