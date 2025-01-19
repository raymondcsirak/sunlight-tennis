// Import pentru biblioteca Zod folosita pentru validarea datelor
import { z } from 'zod'

// Scheme pentru enumerari (valori predefinite)
// Schema pentru statusul utilizatorului
export const UserStatusSchema = z.enum(['online', 'playing', 'away'])
// Schema pentru statusul rezervarii
export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled'])
// Schema pentru statusul platii
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded'])
// Schema pentru statusul meciului
export const MatchStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
// Schema pentru tipul suprafetei de joc
export const SurfaceTypeSchema = z.enum(['clay', 'hard', 'grass', 'artificial'])

// Schema pentru profilul utilizatorului
export const ProfileSchema = z.object({
  id: z.string().uuid(),                           // ID-ul unic al profilului
  full_name: z.string().min(2).max(100),          // Numele complet (2-100 caractere)
  skill_level: z.number().min(1).max(10),         // Nivelul de experienta (1-10)
  avatar_url: z.string().url().nullable(),        // URL-ul avatarului (optional)
  status: UserStatusSchema,                       // Statusul curent al utilizatorului
  last_seen: z.string().datetime(),               // Ultima data cand a fost vazut
  created_at: z.string().datetime(),              // Data crearii profilului
  updated_at: z.string().datetime()               // Data ultimei actualizari
})

// Schema pentru terenul de tenis
export const CourtSchema = z.object({
  id: z.string().uuid(),                          // ID-ul unic al terenului
  name: z.string().min(2).max(100),              // Numele terenului (2-100 caractere)
  surface: SurfaceTypeSchema,                     // Tipul suprafetei
  is_indoor: z.boolean(),                         // Daca este teren acoperit
  hourly_rate: z.number().positive(),             // Tariful pe ora
  location: z.any(),                              // Locatia (tip PostGIS Point)
  is_active: z.boolean(),                         // Daca terenul este activ
  created_at: z.string().datetime(),              // Data crearii
  updated_at: z.string().datetime()               // Data ultimei actualizari
})

// Schema pentru rezervari
export const BookingSchema = z.object({
  id: z.string().uuid(),                          // ID-ul unic al rezervarii
  court_id: z.string().uuid(),                    // ID-ul terenului rezervat
  user_id: z.string().uuid(),                     // ID-ul utilizatorului care a facut rezervarea
  start_time: z.string().datetime(),              // Data si ora de inceput
  end_time: z.string().datetime(),                // Data si ora de sfarsit
  status: BookingStatusSchema,                    // Statusul rezervarii
  payment_status: PaymentStatusSchema,            // Statusul platii
  amount: z.number().positive(),                  // Suma de plata
  created_at: z.string().datetime(),              // Data crearii
  updated_at: z.string().datetime()               // Data ultimei actualizari
})

// Schema pentru meciuri
export const MatchSchema = z.object({
  id: z.string().uuid(),                          // ID-ul unic al meciului
  booking_id: z.string().uuid(),                  // ID-ul rezervarii asociate
  player1_id: z.string().uuid(),                  // ID-ul primului jucator
  player2_id: z.string().uuid(),                  // ID-ul celui de-al doilea jucator
  score: z.string().nullable(),                   // Scorul meciului (optional)
  status: MatchStatusSchema,                      // Statusul meciului
  created_at: z.string().datetime(),              // Data crearii
  updated_at: z.string().datetime()               // Data ultimei actualizari
})

// Schema pentru realizari
export const AchievementSchema = z.object({
  id: z.string().uuid(),                          // ID-ul unic al realizarii
  user_id: z.string().uuid(),                     // ID-ul utilizatorului
  type: z.string(),                               // Tipul realizarii
  metadata: z.record(z.any()),                    // Metadate aditionale
  earned_at: z.string().datetime(),               // Data obtinerii
  created_at: z.string().datetime()               // Data crearii
})

// Tipuri TypeScript derivate din scheme
export type UserStatus = z.infer<typeof UserStatusSchema>
export type BookingStatus = z.infer<typeof BookingStatusSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
export type MatchStatus = z.infer<typeof MatchStatusSchema>
export type SurfaceType = z.infer<typeof SurfaceTypeSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type Court = z.infer<typeof CourtSchema>
export type Booking = z.infer<typeof BookingSchema>
export type Match = z.infer<typeof MatchSchema>
export type Achievement = z.infer<typeof AchievementSchema> 