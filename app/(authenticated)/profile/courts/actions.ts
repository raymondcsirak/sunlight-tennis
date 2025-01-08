"use server"

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'

export type CourtWithAvailability = {
  id: string
  name: string
  surface: string
  hourly_rate: number
  image_url: string | null
  available: boolean
}

const createBookingSchema = z.object({
  courtId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  players: z.number().min(1).max(4),
})

export async function getAvailableCourts(
  date: string,
  startTime: string,
  endTime: string
) {
  try {
    const supabase = await createClient()

    // First, get all active courts
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('*')
      .eq('is_active', true)

    if (courtsError) throw courtsError

    // If startTime equals endTime, it's an initial fetch - return all courts as available
    if (startTime === endTime) {
      const courtsWithAvailability: CourtWithAvailability[] = courts.map(court => ({
        ...court,
        available: true
      }))

      return {
        success: true,
        courts: courtsWithAvailability
      }
    }

    // Then, get all bookings for the given time period
    const { data: bookings, error: bookingsError } = await supabase
      .from('court_bookings')
      .select('court_id')
      .eq('booking_status', 'confirmed')
      .neq('booking_status', 'cancelled')
      .gte('start_time', `${date}T00:00:00Z`)
      .lt('start_time', `${date}T23:59:59Z`)
      .or(
        `and(start_time.lte.${endTime},end_time.gt.${startTime})`
      )

    if (bookingsError) {
      console.error('Bookings error:', bookingsError)
      throw bookingsError
    }

    console.log('Bookings found:', bookings)

    // Create a Set of booked court IDs for quick lookup
    const bookedCourtIds = new Set(bookings.map(b => b.court_id))

    // Mark courts as available or not
    const courtsWithAvailability: CourtWithAvailability[] = courts.map(court => ({
      ...court,
      available: !bookedCourtIds.has(court.id)
    }))

    return {
      success: true,
      courts: courtsWithAvailability
    }
  } catch (error) {
    console.error('Error getting available courts:', error)
    return {
      success: false,
      error: 'Failed to fetch available courts'
    }
  }
}

export async function createBooking(data: z.infer<typeof createBookingSchema>) {
  try {
    const supabase = await createClient()

    // Get the user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not found')
    }

    // Call the stored function
    const { data: result, error } = await supabase.rpc('create_court_booking', {
      p_user_id: user.id,
      p_court_id: data.courtId,
      p_start_time: data.startTime,
      p_end_time: data.endTime,
      p_players: data.players
    })

    if (error) throw error

    if (!result?.success) {
      throw new Error('Booking creation failed')
    }

    revalidatePath('/profile/courts')
    revalidatePath('/profile') // Revalidate profile to update XP display

    return {
      success: true,
      bookingId: result.booking_id
    }
  } catch (error) {
    console.error('Error creating booking:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking'
    }
  }
} 