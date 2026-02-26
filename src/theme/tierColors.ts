import type { SxProps, Theme } from '@mui/material/styles'
import type { TierType } from '@/types'
import { tierColors } from './index'

/** 티어에 해당하는 컬러 반환 */
export function getTierColor(tier: TierType): string {
  return tierColors[tier] || tierColors.bronze
}

/** 티어 배경색 sx (연한 버전) */
export function getTierBgSx(tier: TierType): SxProps<Theme> {
  const color = getTierColor(tier)
  return {
    bgcolor: `${color}18`,
    color,
    borderColor: `${color}40`,
  }
}

/** 티어 border sx */
export function getTierBorderSx(tier: TierType): SxProps<Theme> {
  const color = getTierColor(tier)
  return {
    borderColor: color,
    borderWidth: 2,
    borderStyle: 'solid',
  }
}

/** 그라디언트 텍스트 sx (브랜드용) */
export const gradientTextSx: SxProps<Theme> = {
  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}
