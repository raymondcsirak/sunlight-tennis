// Mark component as client-side
"use client"

// Imports for UI components and icons
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Mail, Phone } from "lucide-react"

// Component for contact section of the landing page
export function ContactSection() {
  return (
    // Main container with semi-transparent background
    <div className="bg-muted/50 py-24">
      {/* Content container with limited maximum width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column grid for contact information and form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact information section */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Contactează-ne
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Ai întrebări despre serviciile noastre? Suntem aici să te ajutăm.
            </p>

            {/* List of contact details with icons */}
            <div className="mt-8 space-y-6">
              {/* Address with icon */}
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-primary" />
                <span className="ml-4 text-foreground">
                  Strada Mușcatelor 9, Satu Mare, România
                </span>
              </div>
              {/* Phone with icon */}
              <div className="flex items-center">
                <Phone className="h-6 w-6 text-primary" />
                <span className="ml-4 text-foreground">+40 123 456 789</span>
              </div>
              {/* Email with icon */}
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-primary" />
                <span className="ml-4 text-foreground">
                  contact@sunlighttennis.ro
                </span>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <form className="space-y-6">
            {/* Grid for first and last name fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First name field */}
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
              {/* Last name field */}
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
            {/* Email field */}
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
            {/* Message field */}
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
            {/* Submit button with hover and active effects */}
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