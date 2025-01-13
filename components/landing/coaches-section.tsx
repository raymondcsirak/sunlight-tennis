import Image from "next/image"

const coaches = [
  {
    name: "Zsolt",
    role: "Antrenor Juniori",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-1.jpg",
    specialization: "Specializată în dezvoltarea tinerelor talente"
  },
  {
    name: "Antonia",
    role: "Antrenor Principal",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-2.jpg",
    specialization: "Specialist în tehnici avansate de joc"
  },
  {
    name: "Toni",
    role: "Antrenor de Performanță",
    image: "https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/coach-3.jpg",
    specialization: "Expert în pregătire fizică și strategie"
  }
]

export function CoachesSection() {
  return (
    <div className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Dezvoltă-ți abilitățile cu echipa academiei
          </h2>
          <p className="text-muted-foreground text-lg">
            Antrenorii noștri profesioniști sunt aici să te ghideze în călătoria ta spre excelență în tenis.
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