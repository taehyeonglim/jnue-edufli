import Chip from '@mui/material/Chip'
import { TierType, TIER_INFO } from '../../types'

interface TierBadgeProps {
  tier?: TierType
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export default function TierBadge({ tier = 'bronze', size = 'md', showName = false }: TierBadgeProps) {
  const info = TIER_INFO[tier] || TIER_INFO.bronze

  return (
    <Chip
      label={`${info.emoji}${showName ? ` ${info.name}` : ''}`}
      size={size === 'lg' ? 'medium' : 'small'}
      sx={{
        bgcolor: `${info.color}18`,
        color: info.color,
        border: `1px solid ${info.color}40`,
        fontWeight: 600,
        fontSize: size === 'lg' ? '0.875rem' : size === 'md' ? '0.8125rem' : '0.75rem',
      }}
    />
  )
}
