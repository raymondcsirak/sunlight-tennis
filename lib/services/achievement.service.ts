import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export type AchievementEvent = {
  type: 'match_won' | 'match_played' | 'training_completed' | 'level_up' | 'streak_reached'
  userId: string
  metadata?: Record<string, any>
}

export type Achievement = {
  type: string
  name: string
  description: string
  metadata?: Record<string, any>
}

export class AchievementService {
  private async getSupabase() {
    const cookieStore = cookies()
    return createClient(cookieStore)
  }

  private async getUserStats(userId: string) {
    const supabase = await this.getSupabase()
    
    const { data: stats } = await supabase
      .from('player_stats')
      .select('total_matches, won_matches')
      .eq('user_id', userId)
      .single()

    const { data: playerXp } = await supabase
      .from('player_xp')
      .select('current_level, current_streak_days')
      .eq('user_id', userId)
      .single()

    return {
      totalMatches: stats?.total_matches ?? 0,
      wonMatches: stats?.won_matches ?? 0,
      currentLevel: playerXp?.current_level ?? 1,
      streakDays: playerXp?.current_streak_days ?? 0
    }
  }

  private async checkFirstMatch(userId: string, stats: { totalMatches: number }): Promise<Achievement | null> {
    if (stats.totalMatches === 1) {
      return {
        type: 'first_match',
        name: 'First Match',
        description: 'Played your first tennis match'
      }
    }
    return null
  }

  private async checkMatchMilestone(userId: string, stats: { totalMatches: number }): Promise<Achievement | null> {
    if (stats.totalMatches === 10) {
      return {
        type: 'matches_10',
        name: 'Match Master',
        description: 'Played 10 matches'
      }
    }
    return null
  }

  private async checkStreakAchievement(userId: string, stats: { streakDays: number }): Promise<Achievement | null> {
    if (stats.streakDays === 7) {
      return {
        type: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintained a 7-day activity streak'
      }
    }
    return null
  }

  private async checkLevelAchievement(userId: string, stats: { currentLevel: number }): Promise<Achievement | null> {
    if (stats.currentLevel === 10) {
      return {
        type: 'level_10',
        name: 'Rising Star',
        description: 'Reached level 10'
      }
    }
    return null
  }

  async checkAndAwardAchievements(event: AchievementEvent): Promise<void> {
    const stats = await this.getUserStats(event.userId)
    const achievements: Achievement[] = []

    // Check relevant achievements based on event type
    switch (event.type) {
      case 'match_played':
        const firstMatch = await this.checkFirstMatch(event.userId, stats)
        if (firstMatch) achievements.push(firstMatch)

        const matchMilestone = await this.checkMatchMilestone(event.userId, stats)
        if (matchMilestone) achievements.push(matchMilestone)
        break

      case 'streak_reached':
        const streakAchievement = await this.checkStreakAchievement(event.userId, stats)
        if (streakAchievement) achievements.push(streakAchievement)
        break

      case 'level_up':
        const levelAchievement = await this.checkLevelAchievement(event.userId, stats)
        if (levelAchievement) achievements.push(levelAchievement)
        break
    }

    if (achievements.length > 0) {
      const supabase = await this.getSupabase()
      await supabase.rpc('award_achievements_with_notifications', {
        p_user_id: event.userId,
        p_achievements: achievements
      })
    }
  }
} 