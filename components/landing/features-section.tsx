// Imports for icons used in features section
import { CalendarDays, Users, Trophy, Clock } from "lucide-react"

// Array with main platform features data
const features = [
  {
    name: "Rezervare Simplă",
    description:
      "Rezervă terenul preferat în câteva secunde cu sistemul nostru intuitiv de rezervări.",
    icon: CalendarDays,
  },
  {
    name: "Găsește Parteneri de Tenis",
    description:
      "Conectează-te cu jucători de nivel similar și extinde-ți rețeaua de tenis.",
    icon: Users,
  },
  {
    name: "Urmărește Progresul",
    description:
      "Monitorizează-ți performanța, urmărește meciurile și câștigă realizări pe măsură ce te îmbunătățești.",
    icon: Trophy,
  },
  {
    name: "Disponibilitate în Timp Real",
    description:
      "Vezi disponibilitatea terenurilor și actualizările statusului jucătorilor în timp real.",
    icon: Clock,
  },
]

// Component for features section of the landing page
export function FeaturesSection() {
  return (
    // Main container with padding and background
    <div className="py-24 bg-background">
      {/* Content container with limited maximum width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered title and description section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tot ce ai nevoie pentru a te bucura de tenis
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Platforma noastră îți oferă toate instrumentele necesare pentru a profita la maximum de experiența ta de tenis.
          </p>
        </div>

        {/* Grid for displaying features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Iterate through features array for display */}
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                {/* Container for each feature with icon and text */}
                <div className="flex flex-col items-center">
                  {/* Feature icon with custom background and color */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  {/* Feature title */}
                  <h3 className="mt-6 text-xl font-semibold text-foreground">
                    {feature.name}
                  </h3>
                  {/* Feature description */}
                  <p className="mt-2 text-center text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 