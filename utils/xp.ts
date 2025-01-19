// XP de baza necesar pentru primul nivel
export const BASE_XP = 1000
// Factorul de multiplicare pentru XP intre nivele
export const LEVEL_MULTIPLIER = 2.0
// Nivelul maxim care poate fi atins
export const MAX_LEVEL = 99

// Tipul pentru progresul unui nivel, continand toate informatiile relevante
export type LevelProgress = {
  currentLevel: number      // Nivelul curent
  currentXp: number        // XP total acumulat
  levelProgress: number    // XP acumulat in nivelul curent
  xpNeededForNextLevel: number  // XP necesar pentru urmatorul nivel
  progressPercentage: number    // Procentul de completare al nivelului curent
}

// Calculeaza XP-ul necesar pentru a atinge un anumit nivel
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, level - 1))
}

// Calculeaza nivelul bazat pe XP-ul total
export function calculateLevel(xp: number): number {
  let level = 1
  while (level < MAX_LEVEL && xp >= getXpForLevel(level + 1)) {
    level++
  }
  return level
}

// Obtine XP-ul necesar pentru urmatorul nivel
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return getXpForLevel(MAX_LEVEL)
  return getXpForLevel(currentLevel + 1)
}

// Obtine pragul de XP pentru un anumit nivel
export function getXpThresholdForLevel(level: number): number {
  return getXpForLevel(level)
}

// Calculeaza toate informatiile despre progresul unui nivel
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

// Creeaza o notificare pentru cresterea in nivel
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