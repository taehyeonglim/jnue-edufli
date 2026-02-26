import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function LoadingSpinner() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
      <CircularProgress size={48} thickness={4} />
    </Box>
  )
}
