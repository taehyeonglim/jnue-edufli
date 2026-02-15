import { TierType, TIER_THRESHOLDS, CategoryType, CATEGORY_INFO } from '../types'

export function getNextTier(tier: TierType, points: number): { tier: TierType; pointsNeeded: number } | null {
  if (tier === 'challenger' || tier === 'master') return null

  const tierOrder: TierType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master']
  const currentIndex = tierOrder.indexOf(tier)
  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) return null

  const nextTier = tierOrder[currentIndex + 1]
  const pointsNeeded = TIER_THRESHOLDS[nextTier].min - points

  return { tier: nextTier, pointsNeeded }
}

export function getCategoryRoute(category: CategoryType): { label: string; link: string; icon: string } {
  const map: Record<CategoryType, { label: string; link: string; icon: string }> = {
    introduction: { label: '자기소개', link: '/introduction', icon: '👋' },
    study: { label: '스터디/세미나', link: '/study', icon: '📖' },
    project: { label: '프로젝트', link: '/project', icon: '🚀' },
    resources: { label: '자료실', link: '/resources', icon: '📁' },
  }
  return map[category] || { label: '', link: '/', icon: '' }
}

export function getCategoryLabel(category: CategoryType): string {
  return CATEGORY_INFO[category]?.name || category
}
