import { lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'))
const Introduction = lazy(() => import('./pages/Introduction'))
const StudyBoard = lazy(() => import('./pages/StudyBoard'))
const ProjectBoard = lazy(() => import('./pages/ProjectBoard'))
const ResourcesBoard = lazy(() => import('./pages/ResourcesBoard'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const WritePost = lazy(() => import('./pages/WritePost'))
const EditPost = lazy(() => import('./pages/EditPost'))
const Ranking = lazy(() => import('./pages/Ranking'))
const MyPage = lazy(() => import('./pages/MyPage'))
const Messages = lazy(() => import('./pages/Messages'))
const Admin = lazy(() => import('./pages/Admin'))
const Gallery = lazy(() => import('./pages/Gallery'))

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </Box>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner />
          </Box>
        }
      >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="introduction" element={<Introduction />} />
            <Route path="study" element={<StudyBoard />} />
            <Route path="project" element={<ProjectBoard />} />
            <Route path="resources" element={<ResourcesBoard />} />
            <Route path="post/:id" element={<PostDetail />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="gallery" element={<Gallery />} />

            {/* Protected Routes */}
            <Route
              path="write"
              element={
                <ProtectedRoute>
                  <WritePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="edit/:id"
              element={
                <ProtectedRoute>
                  <EditPost />
                </ProtectedRoute>
              }
            />
            <Route
              path="mypage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <Container maxWidth="sm" sx={{ py: 10 }}>
                  <Paper sx={{ textAlign: 'center', py: 8, px: 4 }}>
                    <Typography variant="h1" sx={{ mb: 2, color: 'text.disabled' }}>
                      404
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                      페이지를 찾을 수 없습니다
                    </Typography>
                    <Button variant="contained" component={Link} to="/">
                      홈으로 가기
                    </Button>
                  </Paper>
                </Container>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
