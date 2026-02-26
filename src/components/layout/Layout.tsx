import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import Header from './Header'
import Footer from './Footer'
import OnlineUsers from '../common/OnlineUsers'

export default function Layout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
      <OnlineUsers />
    </Box>
  )
}
