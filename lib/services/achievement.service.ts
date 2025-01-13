import { createBrowserClient } from "@supabase/ssr"

export type AchievementEvent = {
  type: 'match_won' | 'match_played' | 'training_completed' | 'level_up' | 'streak_reached'
  userId: string
  metadata?: Record<string, any>
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type Achievement = {
  type: string
  name: string
  description: string
  tier: AchievementTier
  iconPath: string
  metadata?: Record<string, any>
}

export class AchievementService {
  private getSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: {
          schema: 'public'
        },
        auth: {
          persistSession: true
        }
      }
    )
  }

  private async getUserStats(userId: string) {
    const supabase = await this.getSupabase()
    console.log('Getting stats for user:', userId)
    
    const { data: stats, error } = await supabase
      .from('player_stats')
      .select('total_matches, won_matches, total_bookings, total_trainings, current_streak, current_level, win_rate')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error getting user stats:', error)
      return {
        totalMatches: 0,
        wonMatches: 0,
        totalBookings: 0,
        totalTrainings: 0,
        currentStreak: 0
      }
    }

    console.log('Raw stats from DB:', stats)

    return {
      totalMatches: stats?.total_matches ?? 0,
      wonMatches: stats?.won_matches ?? 0,
      totalBookings: stats?.total_bookings ?? 0,
      totalTrainings: stats?.total_trainings ?? 0,
      currentStreak: stats?.current_streak ?? 0
    }
  }

  private async awardAchievement(userId: string, achievement: Achievement) {
    const supabase = await this.getSupabase()
    
    await supabase.rpc('award_achievement', {
      p_user_id: userId,
      p_type: achievement.type,
      p_name: achievement.name,
      p_description: achievement.description,
      p_tier: achievement.tier,
      p_icon_path: achievement.iconPath,
      p_metadata: achievement.metadata ?? {}
    })
  }

  private async checkMatchAchievements(userId: string, stats: { wonMatches: number }) {
    const achievements: Achievement[] = []

    if (stats.wonMatches >= 1) {
      achievements.push({
        type: 'first_match_win',
        name: 'First Victory',
        description: 'Won your first match!',
        tier: 'gold',
        iconPath: '/trophies/major/first-match.svg'
      })
    }

    if (stats.wonMatches >= 50) {
      achievements.push({
        type: 'matches_won_50',
        name: 'Match Master',
        description: 'Won 50 matches!',
        tier: 'gold',
        iconPath: '/trophies/major/match-master.svg'
      })
    }

    if (stats.wonMatches >= 100) {
      achievements.push({
        type: 'matches_won_100',
        name: 'Match Legend',
        description: 'Won 100 matches!',
        tier: 'gold',
        iconPath: '/trophies/major/match-legend.svg'
      })
    }

    return achievements
  }

  private async checkStreakAchievements(userId: string, stats: { currentStreak: number }) {
    const achievements: Achievement[] = []

    if (stats.currentStreak >= 10) {
      achievements.push({
        type: 'streak_master_10',
        name: 'Streak Master',
        description: 'Achieved a 10-match winning streak!',
        tier: 'gold',
        iconPath: '/trophies/major/streak-master.svg'
      })
    }

    return achievements
  }

  private async checkBookingAchievements(userId: string, stats: { totalBookings: number }) {
    const achievements: Achievement[] = []

    if (stats.totalBookings >= 50) {
      achievements.push({
        type: 'court_veteran_50',
        name: 'Court Veteran',
        description: 'Booked 50 court sessions',
        tier: 'silver',
        iconPath: '/trophies/major/court-veteran.svg'
      })
    }

    if (stats.totalBookings >= 100) {
      achievements.push({
        type: 'court_master_100',
        name: 'Court Master',
        description: 'Booked 100 court sessions',
        tier: 'gold',
        iconPath: '/trophies/major/court-master.svg'
      })
    }

    return achievements
  }

  private async checkTrainingAchievements(userId: string, stats: { totalTrainings: number }) {
    const achievements: Achievement[] = []

    if (stats.totalTrainings >= 25) {
      achievements.push({
        type: 'training_expert_25',
        name: 'Training Expert',
        description: 'Completed 25 training sessions',
        tier: 'silver',
        iconPath: '/trophies/major/training-expert.svg'
      })
    }

    if (stats.totalTrainings >= 50) {
      achievements.push({
        type: 'training_master_50',
        name: 'Training Master',
        description: 'Completed 50 training sessions',
        tier: 'gold',
        iconPath: '/trophies/major/training-master.svg'
      })
    }

    if (stats.totalTrainings >= 100) {
      achievements.push({
        type: 'training_legend_100',
        name: 'Training Legend',
        description: 'Completed 100 training sessions',
        tier: 'gold',
        iconPath: '/trophies/major/training-legend.svg'
      })
    }

    return achievements
  }

  async checkAndAwardAchievements(event: AchievementEvent): Promise<void> {
    const stats = await this.getUserStats(event.userId)
    const achievements: Achievement[] = []

    // Check relevant achievements based on event type
    switch (event.type) {
      case 'match_won':
        achievements.push(...await this.checkMatchAchievements(event.userId, stats))
        break

      case 'streak_reached':
        achievements.push(...await this.checkStreakAchievements(event.userId, stats))
        break

      case 'match_played':
        achievements.push(...await this.checkBookingAchievements(event.userId, stats))
        break

      case 'training_completed':
        achievements.push(...await this.checkTrainingAchievements(event.userId, stats))
        break
    }

    // Award any earned achievements
    for (const achievement of achievements) {
      await this.awardAchievement(event.userId, achievement)
    }
  }

  // Helper to retroactively check all achievements for a user
  async retroactivelyCheckAchievements(userId: string): Promise<void> {
    const stats = await this.getUserStats(userId)
    console.log('User Stats:', stats)
    
    const achievements: Achievement[] = []

    const matchAchievements = await this.checkMatchAchievements(userId, stats)
    console.log('Match Achievements:', matchAchievements)
    
    const streakAchievements = await this.checkStreakAchievements(userId, stats)
    console.log('Streak Achievements:', streakAchievements)
    
    const bookingAchievements = await this.checkBookingAchievements(userId, stats)
    console.log('Booking Achievements:', bookingAchievements)
    
    const trainingAchievements = await this.checkTrainingAchievements(userId, stats)
    console.log('Training Achievements:', trainingAchievements)

    achievements.push(
      ...matchAchievements,
      ...streakAchievements,
      ...bookingAchievements,
      ...trainingAchievements
    )

    console.log('Total Achievements to Award:', achievements)

    for (const achievement of achievements) {
      try {
        console.log('Awarding achievement:', achievement)
        await this.awardAchievement(userId, achievement)
        console.log('Successfully awarded achievement')
      } catch (error) {
        console.error('Error awarding achievement:', error)
      }
    }
  }

  async checkFirstLoginAchievement(userId: string): Promise<void> {
    const achievements: Achievement[] = [{
      type: 'first_login',
      name: 'Welcome Champion',
      description: 'Started your tennis journey!',
      tier: 'gold',
      iconPath: '/trophies/major/first-login.svg'
    }];

    // Award achievement
    for (const achievement of achievements) {
      await this.awardAchievement(userId, achievement);
    }

    // Award 500 XP (50 base + 450 bonus)
    const supabase = await this.getSupabase();
    
    // First, award base XP through the standard function
    await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_activity_type: 'login',
      p_description: 'Welcome bonus for joining'
    });

    // Then add the bonus XP
    await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_activity_type: 'login',
      p_description: 'First login bonus'
    });
  }
} 