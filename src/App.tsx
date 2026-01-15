import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

// Pages
import Home from './pages/Home'
import Introduction from './pages/Introduction'
import StudyBoard from './pages/StudyBoard'
import ProjectBoard from './pages/ProjectBoard'
import ResourcesBoard from './pages/ResourcesBoard'
import PostDetail from './pages/PostDetail'
import WritePost from './pages/WritePost'
import EditPost from './pages/EditPost'
import Ranking from './pages/Ranking'
import MyPage from './pages/MyPage'
import Messages from './pages/Messages'
import Admin from './pages/Admin'
import Gallery from './pages/Gallery'

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
      </Route>
    </Routes>
  )
}
