export const BASE_XP = 1000
export const LEVEL_MULTIPLIER = 2.0
export const MAX_LEVEL = 99

export type LevelProgress = {
  currentLevel: number
  currentXp: number
  levelProgress: number
  xpNeededForNextLevel: number
  progressPercentage: number
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, level - 1))
}

export function calculateLevel(xp: number): number {
  let level = 1
  while (level < MAX_LEVEL && xp >= getXpForLevel(level + 1)) {
    level++
  }
  return level
}

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return getXpForLevel(MAX_LEVEL)
  return getXpForLevel(currentLevel + 1)
}

export function getXpThresholdForLevel(level: number): number {
  return getXpForLevel(level)
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