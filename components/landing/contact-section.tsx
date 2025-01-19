// Marcam componenta ca fiind client-side
"use client"

// Importuri pentru componentele UI si iconite
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Mail, Phone } from "lucide-react"

// Componenta pentru sectiunea de contact din pagina de landing
export function ContactSection() {
  return (
    // Container principal cu fundal semi-transparent
    <div className="bg-muted/50 py-24">
      {/* Container pentru continut cu latimea maxima limitata */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid cu doua coloane pentru informatii de contact si formular */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Sectiunea cu informatii de contact */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Contactează-ne
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Ai întrebări despre serviciile noastre? Suntem aici să te ajutăm.
            </p>

            {/* Lista cu detalii de contact si iconite */}
            <div className="mt-8 space-y-6">
              {/* Adresa cu iconita */}
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-primary" />
                <span className="ml-4 text-foreground">
                  Strada Mușcatelor 9, Satu Mare, România
                </span>
              </div>
              {/* Telefon cu iconita */}
              <div className="flex items-center">
                <Phone className="h-6 w-6 text-primary" />
                <span className="ml-4 text-foreground">+40 123 456 789</span>
              </div>
              {/* Email cu iconita */}
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-primary" />
                <span className="ml-4 text-foreground">
                  contact@sunlighttennis.ro
                </span>
              </div>
            </div>
          </div>

          {/* Formular de contact */}
          <form className="space-y-6">
            {/* Grid pentru campurile de nume si prenume */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Camp pentru prenume */}
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-foreground"
                >
                  Prenume
                </label>
                <Input
                  type="text"
                  name="first-name"
                  id="first-name"
                  autoComplete="given-name"
                  className="mt-1"
                />
              </div>
              {/* Camp pentru nume */}
              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-foreground"
                >
                  Nume
                </label>
                <Input
                  type="text"
                  name="last-name"
                  id="last-name"
                  autoComplete="family-name"
                  className="mt-1"
                />
              </div>
            </div>
            {/* Camp pentru email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                className="mt-1"
              />
            </div>
            {/* Camp pentru mesaj */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-foreground"
              >
                Mesaj
              </label>
              <Textarea
                id="message"
                name="message"
                rows={4}
                className="mt-1"
              />
            </div>
            {/* Buton de trimitere cu efect de hover si active */}
            <Button 
              type="submit" 
              className="w-full transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Trimite Mesaj
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 