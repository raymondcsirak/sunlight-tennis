'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'

export type CoachWithAvailability = {
  id: string
  name: string
  image_url: string | null
  hourly_rate: number
  specialization: string
  role: string
  available: boolean
}

const createTrainingSessionSchema = z.object({
  coachId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional()
})

export async function getAvailableCoaches(
  date: string,
  startTime: string,
  endTime: string
) {
  try {
    const supabase = await createClient()

    // First, get all active coaches
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select(`
        id,
        name,
        image_url,
        hourly_rate,
        specialization,
        role
      `)
      .eq('is_active', true)

    if (coachesError) throw coachesError

    // If startTime equals endTime, it's an initial fetch - return all coaches as available
    if (startTime === endTime) {
      const coachesWithAvailability: CoachWithAvailability[] = coaches.map(coach => ({
        ...coach,
        available: true
      }))
      return {
        success: true,
        coaches: coachesWithAvailability
      }
    }

    // Get all training sessions that overlap with the requested time period
    const { data: sessions, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('coach_id')
      .eq('status', 'confirmed')
      .gte('start_time', `${date}T00:00:00Z`)
      .lt('start_time', `${date}T23:59:59Z`)
      .or(`and(start_time.lte.${endTime},end_time.gt.${startTime})`)

    if (sessionsError) {
      console.error('Sessions error:', sessionsError)
      throw sessionsError
    }

    console.log('Found sessions:', sessions)

    // Create a Set of busy coach IDs for quick lookup
    const busyCoachIds = new Set(sessions?.map(s => s.coach_id) || [])

    // Mark coaches as available or not
    const coachesWithAvailability: CoachWithAvailability[] = coaches.map(coach => ({
      ...coach,
      available: !busyCoachIds.has(coach.id)
    }))

    return {
      success: true,
      coaches: coachesWithAvailability
    }
  } catch (error) {
    console.error('Error getting available coaches:', error)
    return {
      success: false,
      error: 'Failed to fetch available coaches'
    }
  }
}

export async function createTrainingSession(data: z.infer<typeof createTrainingSessionSchema>) {
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
    const { data: result, error } = await supabase.rpc('create_training_session', {
      p_student_id: user.id,
      p_coach_id: data.coachId,
      p_start_time: data.startTime,
      p_end_time: data.endTime,
      p_notes: data.notes
    })

    if (error) throw error

    if (!result?.success) {
      throw new Error('Training session creation failed')
    }

    revalidatePath('/profile/training')
    revalidatePath('/profile') // Revalidate profile to update XP display

    return {
      success: true,
      sessionId: result.session_id
    }
  } catch (error) {
    console.error('Error creating training session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create training session'
    }
  }
} 