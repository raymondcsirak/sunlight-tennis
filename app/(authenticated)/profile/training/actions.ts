'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export type CoachWithAvailability = {
  id: string
  name: string
  role: string
  image_url: string
  specialization: string
  available: boolean
}

type Booking = {
  coach_id: string
  start_time: string
  end_time: string
}

const createTrainingSessionSchema = z.object({
  coachId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})

export async function getAvailableCoaches(
  date: string,
  startTime: string,
  endTime: string
) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    // First get all coaches
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select('*')

    if (coachesError) {
      console.error('Error fetching coaches:', coachesError)
      return { success: false, error: 'Failed to fetch coaches' }
    }

    // Then get all confirmed bookings for the given date
    const { data: bookings, error: bookingsError } = await supabase
      .from('training_sessions')
      .select('coach_id, start_time, end_time')
      .eq('status', 'confirmed')
      .gte('start_time', `${date}T00:00:00Z`)
      .lt('start_time', `${date}T23:59:59Z`)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return { success: false, error: 'Failed to fetch bookings' }
    }

    // Create a Set of coach IDs that are booked during the requested time
    const bookedCoachIds = new Set(
      bookings
        ?.filter((booking: Booking) => {
          const bookingStart = new Date(booking.start_time)
          const bookingEnd = new Date(booking.end_time)
          const requestStart = new Date(startTime)
          const requestEnd = new Date(endTime)

          return (
            (requestStart >= bookingStart && requestStart < bookingEnd) ||
            (requestEnd > bookingStart && requestEnd <= bookingEnd) ||
            (requestStart <= bookingStart && requestEnd >= bookingEnd)
          )
        })
        .map((booking: Booking) => booking.coach_id)
    )

    // Map coaches to include availability
    const coachesWithAvailability: CoachWithAvailability[] = coaches!.map((coach: any) => ({
      ...coach,
      available: !bookedCoachIds.has(coach.id)
    }))

    return { success: true, coaches: coachesWithAvailability }
  } catch (error) {
    console.error('Error in getAvailableCoaches:', error)
    return { success: false, error: 'Failed to get available coaches' }
  }
}

export async function createTrainingSession(data: z.infer<typeof createTrainingSessionSchema>) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Validate the input
    const validatedData = createTrainingSessionSchema.parse(data)

    // Create the training session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .insert([
        {
          coach_id: validatedData.coachId,
          user_id: user.id,
          start_time: validatedData.startTime,
          end_time: validatedData.endTime,
        }
      ])
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating training session:', sessionError)
      return { success: false, error: 'Failed to create training session' }
    }

    // Add XP for booking a training session
    const { error: xpError } = await supabase.rpc('add_xp', {
      user_id_input: user.id,
      xp_amount: 100,
      activity_type: 'training_session_booked'
    })

    if (xpError) {
      console.error('Error adding XP:', xpError)
    }

    return { success: true, session }
  } catch (error) {
    console.error('Error in createTrainingSession:', error)
    return { success: false, error: 'Failed to create training session' }
  }
} 