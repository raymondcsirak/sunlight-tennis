import { z } from 'zod'

// Enum schemas
export const UserStatusSchema = z.enum(['online', 'playing', 'away'])
export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled'])
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded'])
export const MatchStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
export const SurfaceTypeSchema = z.enum(['clay', 'hard', 'grass', 'artificial'])

// Profile schema
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2).max(100),
  skill_level: z.number().min(1).max(10),
  avatar_url: z.string().url().nullable(),
  status: UserStatusSchema,
  last_seen: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Court schema
export const CourtSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  surface: SurfaceTypeSchema,
  is_indoor: z.boolean(),
  hourly_rate: z.number().positive(),
  location: z.any(), // PostGIS Point type
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Booking schema
export const BookingSchema = z.object({
  id: z.string().uuid(),
  court_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  status: BookingStatusSchema,
  payment_status: PaymentStatusSchema,
  amount: z.number().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Match schema
export const MatchSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  player1_id: z.string().uuid(),
  player2_id: z.string().uuid(),
  score: z.string().nullable(),
  status: MatchStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Achievement schema
export const AchievementSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.string(),
  metadata: z.record(z.any()),
  earned_at: z.string().datetime(),
  created_at: z.string().datetime()
})

// Types
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