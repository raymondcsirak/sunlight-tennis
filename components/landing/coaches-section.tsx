import Image from "next/image"

// Array cu datele antrenorilor
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

// Componenta pentru sectiunea de antrenori din pagina de landing
export function CoachesSection() {
  return (
    // Container principal cu fundal semi-transparent
    <div className="py-24 bg-muted/30">
      {/* Container pentru continut cu margini responsive */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sectiunea de titlu si descriere centrată */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Dezvoltă-ți abilitățile cu echipa academiei
          </h2>
          <p className="text-muted-foreground text-lg">
            Antrenorii noștri profesioniști sunt aici să te ghideze în călătoria ta spre excelență în tenis.
          </p>
        </div>

        {/* Grid pentru cardurile antrenorilor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Iterare prin array-ul de antrenori pentru afisare */}
          {coaches.map((coach) => (
            <div key={coach.name} className="group relative">
              {/* Container pentru imagine cu aspect ratio 3:4 */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                {/* Imaginea antrenorului cu efect de hover */}
                <Image
                  src={coach.image}
                  alt={coach.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                {/* Gradient pentru lizibilitatea textului */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Informatii despre antrenor pozitionate peste imagine */}
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