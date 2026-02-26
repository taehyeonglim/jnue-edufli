import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <Paper sx={{ textAlign: 'center', py: 6, px: 3 }} role="alert">
      <Typography sx={{ fontSize: '3rem', mb: 2 }}>⚠️</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        {message}
      </Typography>
      {onRetry && (
        <Box>
          <Button variant="contained" size="small" onClick={onRetry}>
            다시 시도
          </Button>
        </Box>
      )}
    </Paper>
  )
}
