// Required imports for route functionality
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AchievementService } from '@/lib/services/achievement.service'

// POST route for retroactive achievement checking
// POST /api/achievements/retroactive
export async function POST(req: Request) {
  try {
    // Initialize Supabase client for server
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Get all cookies
          getAll() {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          // Set cookies (not used in server components)
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // Set method was called from a Server Component.
              // Can be ignored if there's middleware for session refresh.
            }
          },
        },
      }
    )

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize achievement service and check retroactively
    const achievementService = new AchievementService()
    await achievementService.retroactivelyCheckAchievements(user.id)

    // Return success response
    return NextResponse.json({
      status: 'success',
      message: 'Achievements retroactively checked and awarded'
    })

  } catch (error) {
    // Handle and log errors
    console.error('Error in retroactive achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 