import Image from "next/image"

export function AboutSection() {
  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            În tenis, viteza este totul.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Descoperă pasiunea pentru tenis într-un mediu profesionist și prietenos. 
            Alătură-te comunității noastre de jucători pasionați.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="https://jaioqrcuedkbqjwglmnv.supabase.co/storage/v1/object/public/images/tennis-action.jpg"
              alt="Tenis în acțiune"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-4">
              Excelență în fiecare lovitură
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
              Cu o tradiție bogată în dezvoltarea jucătorilor de tenis, oferim programe personalizate pentru toate nivelurile de experiență.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">25+</div>
                <div className="text-sm text-muted-foreground">Ani de Experiență</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">1000+</div>
                <div className="text-sm text-muted-foreground">Cursanți Antrenați</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 