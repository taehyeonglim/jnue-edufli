import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import LoginIcon from '@mui/icons-material/Login'
import { useAuth } from '../../contexts/AuthContext'
import { TIER_INFO } from '../../types'
import { getUnreadCount } from '../../services/messageService'

export default function Header() {
  const { currentUser, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadUnreadCount = useCallback(async () => {
    if (!currentUser) return
    try {
      const count = await getUnreadCount(currentUser.uid)
      setUnreadMessages(count)
    } catch (error) {
      console.error('읽지 않은 쪽지 수 로딩 실패:', error)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser, loadUnreadCount])

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('로그인 실패:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/introduction', label: '자기소개', icon: '👋' },
    { path: '/study', label: '스터디', icon: '📖' },
    { path: '/project', label: '프로젝트', icon: '🚀' },
    { path: '/resources', label: '자료실', icon: '📁' },
    { path: '/gallery', label: '갤러리', icon: '📷' },
    { path: '/ranking', label: '랭킹', icon: '🏆' },
  ]

  const displayName = currentUser?.nickname || currentUser?.displayName

  return (
    <AppBar
      position="sticky"
      sx={{
        boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Gradient accent line */}
      <Box
        sx={{
          height: 3,
          background: 'linear-gradient(to right, #818CF8, #22D3EE, #818CF8)',
          opacity: 0.9,
        }}
      />

      <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, flexWrap: 'nowrap', minHeight: { xs: 56, sm: 64 } }}>
        {/* Logo */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textDecoration: 'none',
            mr: 2,
          }}
        >
          <Box
            component="img"
            src="/edufli-logo.png"
            alt="Edu FLI"
            sx={{ width: 40, height: 40, borderRadius: 2, objectFit: 'contain' }}
          />
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.2 }}
            >
              <Box component="span" sx={{ color: 'primary.main' }}>Edu</Box>
              <Box component="span" sx={{ color: 'secondary.main' }}> FLI</Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: '10px', color: 'text.disabled', letterSpacing: '0.05em', fontWeight: 500, display: 'block' }}
            >
              Education & Future Learning Innovation
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Desktop Nav */}
        <Box
          component="nav"
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'nowrap',
            flexShrink: 0,
          }}
        >
          {navLinks.map((link) => (
            <Button
              key={link.path}
              component={Link}
              to={link.path}
              size="small"
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 3,
                fontSize: '0.8125rem',
                fontWeight: isActive(link.path) ? 600 : 500,
                color: isActive(link.path) ? 'primary.main' : 'text.secondary',
                bgcolor: isActive(link.path) ? 'primary.50' : 'transparent',
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: isActive(link.path) ? 'primary.50' : 'action.hover',
                },
              }}
              startIcon={<span style={{ fontSize: '1rem' }}>{link.icon}</span>}
            >
              {link.label}
            </Button>
          ))}
          {currentUser?.isAdmin && (
            <Button
              component={Link}
              to="/admin"
              size="small"
              startIcon={<SettingsIcon sx={{ fontSize: '1rem' }} />}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 3,
                fontSize: '0.8125rem',
                fontWeight: isActive('/admin') ? 600 : 500,
                color: isActive('/admin') ? 'warning.dark' : 'warning.main',
                bgcolor: isActive('/admin') ? 'warning.50' : 'transparent',
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.08)' },
              }}
            >
              관리자
            </Button>
          )}
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          {currentUser ? (
            <>
              {/* Messages */}
              <IconButton
                component={Link}
                to="/messages"
                aria-label={`쪽지함${unreadMessages > 0 ? ` (안읽은 쪽지 ${unreadMessages}개)` : ''}`}
                sx={{ color: 'text.secondary' }}
              >
                <Badge
                  badgeContent={unreadMessages > 9 ? '9+' : unreadMessages}
                  color="error"
                  invisible={unreadMessages === 0}
                >
                  <MailOutlineIcon />
                </Badge>
              </IconButton>

              {/* User Profile */}
              <Box
                component={Link}
                to="/mypage"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 4,
                  textDecoration: 'none',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 0.2s',
                }}
              >
                <Avatar
                  src={currentUser.photoURL || undefined}
                  alt={displayName}
                  sx={{
                    width: 36,
                    height: 36,
                    borderColor: TIER_INFO[currentUser.tier].color,
                  }}
                />
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                    {displayName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {currentUser.points.toLocaleString()}P
                  </Typography>
                </Box>
              </Box>

              {/* Logout */}
              <IconButton
                onClick={handleSignOut}
                aria-label="로그아웃"
                sx={{ display: { xs: 'none', sm: 'flex' }, color: 'text.disabled' }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleSignIn}
              startIcon={<LoginIcon />}
              sx={{ borderRadius: 3 }}
            >
              로그인
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <IconButton
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            sx={{ display: { md: 'none' }, color: 'text.secondary' }}
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{ sx: { width: 280, pt: 2 } }}
      >
        <List>
          {navLinks.map((link) => (
            <ListItemButton
              key={link.path}
              component={Link}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              selected={isActive(link.path)}
              sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, fontSize: '1.25rem' }}>
                {link.icon}
              </ListItemIcon>
              <ListItemText
                primary={link.label}
                primaryTypographyProps={{ fontWeight: isActive(link.path) ? 600 : 400 }}
              />
            </ListItemButton>
          ))}

          {currentUser && (
            <ListItemButton
              component={Link}
              to="/messages"
              onClick={() => setMobileMenuOpen(false)}
              selected={isActive('/messages')}
              sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, fontSize: '1.25rem' }}>
                💌
              </ListItemIcon>
              <ListItemText primary="쪽지함" />
              {unreadMessages > 0 && (
                <Chip label={unreadMessages} color="error" size="small" />
              )}
            </ListItemButton>
          )}

          {currentUser?.isAdmin && (
            <ListItemButton
              component={Link}
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              selected={isActive('/admin')}
              sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SettingsIcon sx={{ color: 'warning.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="관리자"
                primaryTypographyProps={{ color: 'warning.main' }}
              />
            </ListItemButton>
          )}

          {currentUser && (
            <>
              <Divider sx={{ my: 1, mx: 2 }} />
              <ListItemButton
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                sx={{ borderRadius: 2, mx: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon sx={{ color: 'text.disabled' }} />
                </ListItemIcon>
                <ListItemText
                  primary="로그아웃"
                  primaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>
    </AppBar>
  )
}
