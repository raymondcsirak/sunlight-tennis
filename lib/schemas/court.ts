// Import for Zod library used for data validation
import { z } from 'zod'

// Schemas for enums
// Available surface types for courts
export const SurfaceTypeSchema = z.enum(['clay', 'hard', 'grass', 'artificial'])
// Possible statuses for a booking
export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled'])
// Possible statuses for a payment
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded'])

// Schema for tennis court data
export const CourtSchema = z.object({
  id: z.string().uuid(),                    // Unique court ID
  name: z.string().min(1),                  // Court name (minimum 1 character)
  surface: SurfaceTypeSchema,               // Surface type
  is_indoor: z.boolean(),                   // Whether it's an indoor court
  hourly_rate: z.number().positive(),       // Hourly rate
  image_url: z.string().url().nullable(),   // Image URL (optional)
  is_active: z.boolean(),                   // Whether the court is active
  created_at: z.string().datetime(),        // Creation date
  updated_at: z.string().datetime(),        // Last update date
})

// Schema for a court booking
export const CourtBookingSchema = z.object({
  id: z.string().uuid(),                    // Unique booking ID
  court_id: z.string().uuid(),              // Court ID being booked
  user_id: z.string().uuid(),               // User ID who made the booking
  start_time: z.string().datetime(),        // Start date and time
  end_time: z.string().datetime(),          // End date and time
  players_count: z.number().int().min(1).max(4), // Number of players (1-4)
  status: BookingStatusSchema,              // Booking status
  payment_status: PaymentStatusSchema,      // Payment status
  amount: z.number().positive(),            // Payment amount
  created_at: z.string().datetime(),        // Creation date
  updated_at: z.string().datetime(),        // Last update date
})

// Schema for creating a new booking
export const CreateBookingSchema = z.object({
  courtId: z.string().uuid(),               // Court ID to book
  startTime: z.string().datetime(),         // Desired start date and time
  endTime: z.string().datetime(),           // Desired end date and time
  players: z.number().int().min(1).max(4),  // Number of players (1-4)
}).refine(
  // Validation: end time must be after start time
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
  // Validation: booking duration cannot exceed 2 hours
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

// TypeScript types derived from schemas
export type Court = z.infer<typeof CourtSchema>
export type CourtBooking = z.infer<typeof CourtBookingSchema>
export type CreateBooking = z.infer<typeof CreateBookingSchema>
export type SurfaceType = z.infer<typeof SurfaceTypeSchema>
export type BookingStatus = z.infer<typeof BookingStatusSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema> 