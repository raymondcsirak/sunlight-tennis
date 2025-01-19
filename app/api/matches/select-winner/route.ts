import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AchievementService } from '@/lib/services/achievement.service'

// Schema pentru validarea datelor de intrare
const SelectWinnerSchema = z.object({
  matchId: z.string().uuid(),         // ID-ul meciului
  selectedWinnerId: z.string().uuid() // ID-ul jucatorului selectat ca castigator
})

// Ruta POST pentru selectarea castigatorului unui meci
// POST /api/matches/select-winner
export async function POST(req: Request) {
  try {
    console.log('Starting winner selection process...')
    // Initializare client Supabase pentru server
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Verifica autentificarea utilizatorului
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('User authenticated:', user.id)

    // Valideaza datele de intrare
    const body = await req.json()
    console.log('Request body:', body)
    const result = SelectWinnerSchema.safeParse(body)
    if (!result.success) {
      console.error('Validation error:', result.error.format())
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { matchId, selectedWinnerId } = result.data
    console.log('Validated input:', { matchId, selectedWinnerId })

    // Obtine detaliile meciului
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, player1:player1_id(*), player2:player2_id(*)')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      console.error('Match error:', matchError)
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }
    console.log('Match found:', match)

    // Verifica daca utilizatorul este jucator in acest meci
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      console.error('User not in match:', { userId: user.id, match })
      return NextResponse.json(
        { error: 'You are not a player in this match' },
        { status: 403 }
      )
    }

    // Verifica daca castigatorul selectat este jucator in acest meci
    if (selectedWinnerId !== match.player1_id && selectedWinnerId !== match.player2_id) {
      console.error('Invalid winner:', { selectedWinnerId, match })
      return NextResponse.json(
        { error: 'Selected winner must be a player in this match' },
        { status: 400 }
      )
    }

    // Inregistreaza selectia castigatorului
    console.log('Recording selection...')
    const { data: selectionData, error: selectionError } = await supabase
      .from('match_winner_selections')
      .upsert({
        match_id: matchId,
        selector_id: user.id,
        selected_winner_id: selectedWinnerId
      }, {
        onConflict: 'match_id,selector_id',
        ignoreDuplicates: false
      })
      .select()

    if (selectionError) {
      console.error('Selection error:', selectionError)
      console.error('Selection attempt:', {
        match_id: matchId,
        selector_id: user.id,
        selected_winner_id: selectedWinnerId
      })
      return NextResponse.json(
        { error: 'Failed to record selection', details: selectionError.message },
        { status: 500 }
      )
    }
    console.log('Selection recorded:', selectionData)

    // Obtine selectiile ambilor jucatori
    const { data: selections, error: selectionsError } = await supabase
      .from('match_winner_selections')
      .select('selector_id, selected_winner_id')
      .eq('match_id', matchId)

    if (selectionsError) {
      console.error('Selections error:', selectionsError)
      return NextResponse.json(
        { error: 'Failed to get selections' },
        { status: 500 }
      )
    }
    console.log('All selections:', selections)

    // Verifica daca ambii jucatori au selectat si sunt de acord
    if (selections.length === 2) {
      const [selection1, selection2] = selections
      const bothAgree = selection1.selected_winner_id === selection2.selected_winner_id
      console.log('Both players selected:', { bothAgree, selection1, selection2 })

      if (bothAgree) {
        // Actualizeaza castigatorul meciului
        console.log('Updating match winner...')
        const { error: updateError } = await supabase
          .from('matches')
          .update({
            winner_id: selection1.selected_winner_id,
            xp_awarded: false
          })
          .eq('id', matchId)

        if (updateError) {
          console.error('Update error:', updateError)
          return NextResponse.json(
            { error: 'Failed to update match winner' },
            { status: 500 }
          )
        }

        // Creeaza notificari pentru ambii jucatori
        console.log('Creating completion notifications...')
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: match.player1_id,
              type: 'match_completed',
              title: 'Match Result Confirmed',
              message: match.player1_id === selection1.selected_winner_id
                ? 'Congratulations! You won the match!'
                : 'Match completed. Better luck next time!',
              data: { match_id: matchId, winner_id: selection1.selected_winner_id }
            },
            {
              user_id: match.player2_id,
              type: 'match_completed',
              title: 'Match Result Confirmed',
              message: match.player2_id === selection1.selected_winner_id
                ? 'Congratulations! You won the match!'
                : 'Match completed. Better luck next time!',
              data: { match_id: matchId, winner_id: selection1.selected_winner_id }
            }
          ])

        if (notificationError) {
          console.error('Notification error:', notificationError)
        }

        // Verifica realizarile pentru ambii jucatori
        const achievementService = new AchievementService()
        
        // Verifica realizarile pentru castigator
        await achievementService.checkAndAwardAchievements({
          type: 'match_won',
          userId: selection1.selected_winner_id
        })

        // Verifica realizarile pentru ambii jucatori pentru meci jucat
        await Promise.all([
          achievementService.checkAndAwardAchievements({
            type: 'match_played',
            userId: match.player1_id
          }),
          achievementService.checkAndAwardAchievements({
            type: 'match_played',
            userId: match.player2_id
          })
        ])

        return NextResponse.json({
          status: 'completed',
          winner_id: selection1.selected_winner_id
        })
      } else {
        // Creeaza notificari de disputa
        console.log('Creating dispute notifications...')
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: match.player1_id,
              type: 'match_dispute',
              title: 'Match Result Dispute',
              message: 'There is a disagreement about the match result. Both players selected different winners. Please discuss and update your selections.',
              data: { match_id: matchId }
            },
            {
              user_id: match.player2_id,
              type: 'match_dispute',
              title: 'Match Result Dispute',
              message: 'There is a disagreement about the match result. Both players selected different winners. Please discuss and update your selections.',
              data: { match_id: matchId }
            }
          ])

        if (notificationError) {
          console.error('Dispute notification error:', notificationError)
        }

        return NextResponse.json({
          status: 'disputed',
          message: 'Players selected different winners'
        })
      }
    }

    console.log('Only one selection recorded so far')
    // Doar un jucator a selectat pana acum
    return NextResponse.json({
      status: 'pending',
      message: 'Waiting for other player\'s selection'
    })

  } catch (error) {
    // Gestioneaza si logheaza erorile
    console.error('Error in select winner:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 