import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { getPlayerStats } from "@/app/_components/player-stats/actions"
import { CalendarView } from './_components/calendar-view'

interface ScheduleItem {
  id: string
  type: 'court_booking' | 'training_session' | 'match'
  title: string
  start_time: string
  end_time: string
  status: string
  metadata: Record<string, any>
}

interface CourtBooking {
  id: string
  start_time: string
  end_time: string
  booking_status: string
  court: {
    name: string
    surface: string
  }
}

interface TrainingSession {
  id: string
  start_time: string
  end_time: string
  status: string
  coach: {
    name: string
    role: string
  }
}

interface Match {
  id: string
  status: string
  match_request: {
    preferred_date: string
    preferred_time: string
    duration: string
    court: {
      name: string
      surface: string
    }
  }
  player1: {
    full_name: string
  }
  player2: {
    full_name: string
  }
}

async function getScheduleItems(userId: string): Promise<ScheduleItem[]> {
  const cookieStore = cookies()
  const supabase = await createClient()

  // Get user's court bookings
  const { data: courtBookings } = await supabase
    .from('court_bookings')
    .select(`
      id,
      start_time,
      end_time,
      booking_status,
      court:courts(
        name,
        surface
      )
    `)
    .eq('user_id', userId)
    .eq('booking_status', 'confirmed')
    .returns<CourtBooking[]>()

  // Get user's training sessions
  const { data: trainingSessions } = await supabase
    .from('training_sessions')
    .select(`
      id,
      start_time,
      end_time,
      status,
      coach:coaches(
        name,
        role
      )
    `)
    .eq('student_id', userId)
    .eq('status', 'confirmed')
    .returns<TrainingSession[]>()

  // Get user's matches
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      match_request!inner(
        preferred_date,
        preferred_time,
        duration,
        court:courts(
          name,
          surface
        )
      ),
      player1:profiles!matches_player1_id_fkey(
        full_name
      ),
      player2:profiles!matches_player2_id_fkey(
        full_name
      )
    `)
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('status', 'scheduled')
    .returns<Match[]>()

  // Transform the data into a unified format
  const scheduleItems: ScheduleItem[] = [
    ...(courtBookings?.map(booking => ({
      id: booking.id,
      type: 'court_booking' as const,
      title: `Court Booking: ${booking.court.name}`,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.booking_status,
      metadata: {
        court: booking.court
      }
    })) || []),
    ...(trainingSessions?.map(session => ({
      id: session.id,
      type: 'training_session' as const,
      title: `Training with ${session.coach.name}`,
      start_time: session.start_time,
      end_time: session.end_time,
      status: session.status,
      metadata: {
        coach: session.coach
      }
    })) || []),
    ...(matches?.map(match => ({
      id: match.id,
      type: 'match' as const,
      title: `Match vs ${match.player1.full_name === userId ? match.player2.full_name : match.player1.full_name}`,
      start_time: `${match.match_request.preferred_date}T${match.match_request.preferred_time}`,
      end_time: new Date(new Date(`${match.match_request.preferred_date}T${match.match_request.preferred_time}`).getTime() + parseInt(match.match_request.duration) * 60000).toISOString(),
      status: match.status,
      metadata: {
        court: match.match_request.court,
        opponent: match.player1.full_name === userId ? match.player2 : match.player1
      }
    })) || [])
  ]

  return scheduleItems
}

export default async function SchedulePage() {
  const cookieStore = cookies()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { data: playerXp } = await supabase
    .from('player_xp')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // Get player stats
  const stats = await getPlayerStats(user!.id)

  // Get schedule items
  const scheduleItems = await getScheduleItems(user!.id)

  return (
    <ProfileLayout 
      user={user!} 
      profile={profile} 
      playerXp={playerXp}
      playerStats={stats}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Schedule</h1>
        </div>

        <CalendarView scheduleItems={scheduleItems} userId={user!.id} />
      </div>
    </ProfileLayout>
  )
} 