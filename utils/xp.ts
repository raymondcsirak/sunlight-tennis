// Constants for UI calculations
export const BASE_XP = 1000
export const LEVEL_MULTIPLIER = 2.0

// Type for progress display
export type LevelProgress = {
  currentLevel: number      // From database
  currentXp: number        // From database
  levelProgress: number    // UI calculation
  xpNeededForNextLevel: number  // UI calculation
  progressPercentage: number    // UI calculation
}

// Calculate XP needed for next level threshold
export function getXpForNextLevel(currentLevel: number): number {
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, currentLevel))
}

// Calculate progress for UI display
export function calculateLevelProgress(currentXp: number, currentLevel: number): LevelProgress {
  const nextLevelThreshold = getXpForNextLevel(currentLevel)
  const currentLevelThreshold = getXpForNextLevel(currentLevel - 1)
  
  const levelProgress = currentXp - currentLevelThreshold
  const xpNeededForNextLevel = nextLevelThreshold - currentLevelThreshold
  const progressPercentage = Math.floor((levelProgress / xpNeededForNextLevel) * 100)

  return {
    currentLevel,
    currentXp,
    levelProgress,
    xpNeededForNextLevel,
    progressPercentage
  }
}

// Create level up notification
export async function createLevelUpNotification(
  supabase: any,
  userId: string, 
  oldLevel: number, 
  newLevel: number, 
  currentXp: number
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'level_up',
    title: 'Level Up!',
    message: `Congratulations! You have reached level ${newLevel}!`,
    data: {
      old_level: oldLevel,
      new_level: newLevel,
      current_xp: currentXp
    }
  })
} 