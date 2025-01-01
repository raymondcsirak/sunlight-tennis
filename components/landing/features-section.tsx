import { CalendarDays, Users, Trophy, Clock } from "lucide-react"

const features = [
  {
    name: "Easy Court Booking",
    description:
      "Book your preferred court in seconds with our intuitive booking system.",
    icon: CalendarDays,
  },
  {
    name: "Find Tennis Partners",
    description:
      "Connect with players of similar skill levels and expand your tennis network.",
    icon: Users,
  },
  {
    name: "Track Progress",
    description:
      "Monitor your performance, track matches, and earn achievements as you improve.",
    icon: Trophy,
  },
  {
    name: "Real-time Availability",
    description:
      "See court availability and player status updates in real-time.",
    icon: Clock,
  },
]

export function FeaturesSection() {
  return (
    <div className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need to Enjoy Tennis
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Our platform provides all the tools you need to make the most of your tennis experience.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">
                    {feature.name}
                  </h3>
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