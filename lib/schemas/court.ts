import { z } from 'zod'

export const SurfaceTypeSchema = z.enum(['clay', 'hard', 'grass', 'artificial'])
export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled'])
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded'])

export const CourtSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  surface: SurfaceTypeSchema,
  is_indoor: z.boolean(),
  hourly_rate: z.number().positive(),
  image_url: z.string().url().nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const CourtBookingSchema = z.object({
  id: z.string().uuid(),
  court_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  players_count: z.number().int().min(1).max(4),
  status: BookingStatusSchema,
  payment_status: PaymentStatusSchema,
  amount: z.number().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const CreateBookingSchema = z.object({
  courtId: z.number(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  players: z.number().int().min(1).max(4),
})

export type Court = z.infer<typeof CourtSchema>
export type CourtBooking = z.infer<typeof CourtBookingSchema>
export type CreateBooking = z.infer<typeof CreateBookingSchema>
export type SurfaceType = z.infer<typeof SurfaceTypeSchema>
export type BookingStatus = z.infer<typeof BookingStatusSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema> 