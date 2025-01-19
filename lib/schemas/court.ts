// Import pentru biblioteca Zod folosita pentru validarea datelor
import { z } from 'zod'

// Scheme pentru enumerari
// Tipurile de suprafete disponibile pentru terenuri
export const SurfaceTypeSchema = z.enum(['clay', 'hard', 'grass', 'artificial'])
// Statusurile posibile pentru o rezervare
export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled'])
// Statusurile posibile pentru o plata
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded'])

// Schema pentru datele unui teren de tenis
export const CourtSchema = z.object({
  id: z.string().uuid(),                    // ID-ul unic al terenului
  name: z.string().min(1),                  // Numele terenului (minim 1 caracter)
  surface: SurfaceTypeSchema,               // Tipul suprafetei
  is_indoor: z.boolean(),                   // Daca este teren acoperit
  hourly_rate: z.number().positive(),       // Tariful pe ora
  image_url: z.string().url().nullable(),   // URL-ul imaginii (optional)
  is_active: z.boolean(),                   // Daca terenul este activ
  created_at: z.string().datetime(),        // Data crearii
  updated_at: z.string().datetime(),        // Data ultimei actualizari
})

// Schema pentru o rezervare de teren
export const CourtBookingSchema = z.object({
  id: z.string().uuid(),                    // ID-ul unic al rezervarii
  court_id: z.string().uuid(),              // ID-ul terenului rezervat
  user_id: z.string().uuid(),               // ID-ul utilizatorului care a facut rezervarea
  start_time: z.string().datetime(),        // Data si ora de inceput
  end_time: z.string().datetime(),          // Data si ora de sfarsit
  players_count: z.number().int().min(1).max(4), // Numarul de jucatori (1-4)
  status: BookingStatusSchema,              // Statusul rezervarii
  payment_status: PaymentStatusSchema,      // Statusul platii
  amount: z.number().positive(),            // Suma de plata
  created_at: z.string().datetime(),        // Data crearii
  updated_at: z.string().datetime(),        // Data ultimei actualizari
})

// Schema pentru crearea unei noi rezervari
export const CreateBookingSchema = z.object({
  courtId: z.string().uuid(),               // ID-ul terenului de rezervat
  startTime: z.string().datetime(),         // Data si ora de inceput dorita
  endTime: z.string().datetime(),           // Data si ora de sfarsit dorita
  players: z.number().int().min(1).max(4),  // Numarul de jucatori (1-4)
}).refine(
  // Validare: ora de sfarsit trebuie sa fie dupa ora de inceput
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
).refine(
  // Validare: durata rezervarii nu poate depasi 2 ore
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours <= 2;
  },
  {
    message: "Booking duration cannot exceed 2 hours",
    path: ["endTime"],
  }
);

// Tipuri TypeScript derivate din scheme
export type Court = z.infer<typeof CourtSchema>
export type CourtBooking = z.infer<typeof CourtBookingSchema>
export type CreateBooking = z.infer<typeof CreateBookingSchema>
export type SurfaceType = z.infer<typeof SurfaceTypeSchema>
export type BookingStatus = z.infer<typeof BookingStatusSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema> 