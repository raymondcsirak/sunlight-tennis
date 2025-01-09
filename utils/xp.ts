export const XP_THRESHOLDS = {
  LEVEL_2: 1000,
  LEVEL_3: 2500,
  LEVEL_4: 5000,
  LEVEL_5: 10000,
} as const

export type LevelProgress = {
  currentLevel: number
  currentXp: number
  levelProgress: number
  xpNeededForNextLevel: number
  progressPercentage: number
}

export function calculateLevel(xp: number): number {
  if (xp >= XP_THRESHOLDS.LEVEL_5) return 5
  if (xp >= XP_THRESHOLDS.LEVEL_4) return 4
  if (xp >= XP_THRESHOLDS.LEVEL_3) return 3
  if (xp >= XP_THRESHOLDS.LEVEL_2) return 2
  return 1
}

export function getXpForNextLevel(currentLevel: number): number {
  switch (currentLevel) {
    case 1:
      return XP_THRESHOLDS.LEVEL_2
    case 2:
      return XP_THRESHOLDS.LEVEL_3
    case 3:
      return XP_THRESHOLDS.LEVEL_4
    case 4:
      return XP_THRESHOLDS.LEVEL_5
    default:
      return XP_THRESHOLDS.LEVEL_5
  }
}

export function getXpThresholdForLevel(level: number): number {
  switch (level) {
    case 1:
      return 0
    case 2:
      return XP_THRESHOLDS.LEVEL_2
    case 3:
      return XP_THRESHOLDS.LEVEL_3
    case 4:
      return XP_THRESHOLDS.LEVEL_4
    case 5:
      return XP_THRESHOLDS.LEVEL_5
    default:
      return 0
  }
}

export function calculateLevelProgress(currentXp: number): LevelProgress {
  const currentLevel = calculateLevel(currentXp)
  const currentLevelThreshold = getXpThresholdForLevel(currentLevel)
  const nextLevelThreshold = getXpForNextLevel(currentLevel)
  
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