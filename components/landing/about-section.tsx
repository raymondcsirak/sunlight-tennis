import Image from "next/image"

export function AboutSection() {
  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Being fast in tennis is everything.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna nibh sed viverra erat ultrices. 
            Nisl aliquet aliquam urna tortor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/tennis-action.jpg"
              alt="Tennis in action"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-4">
              Lorem ipsum dolor sit amet
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
              Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">25+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">1000+</div>
                <div className="text-sm text-muted-foreground">Students Trained</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 