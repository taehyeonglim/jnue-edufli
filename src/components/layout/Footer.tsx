import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={3}
        >
          {/* Brand */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              component="img"
              src="/edufli-logo.png"
              alt="Edu FLI"
              sx={{ width: 36, height: 36, borderRadius: 2, objectFit: 'contain' }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                <Box component="span" sx={{ color: 'primary.main' }}>Edu</Box>
                <Box component="span" sx={{ color: 'secondary.main' }}> FLI</Box>
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.disabled', letterSpacing: '0.05em', fontWeight: 500 }}>
                Education & Future Learning Innovation
              </Typography>
            </Box>
          </Stack>

          {/* Info */}
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            전주교육대학교 초등교육과 교육공학 동아리
          </Typography>

          {/* Copyright */}
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            &copy; {currentYear} Edu FLI. All rights reserved.
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
