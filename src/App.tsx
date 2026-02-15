import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
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
      <div className="min-h-screen flex items-center justify-center bg-hero-pattern">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
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
                <div className="section">
                  <div className="container-xs">
                    <div className="card text-center py-16">
                      <div className="text-5xl mb-4">404</div>
                      <p className="text-gray-500 mb-6">페이지를 찾을 수 없습니다</p>
                      <a href="/" className="btn btn-primary">홈으로 가기</a>
                    </div>
                  </div>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
