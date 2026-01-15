import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO, CATEGORY_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function ProjectBoard() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await getPosts('project')
      setPosts(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="text-3xl mb-2">{CATEGORY_INFO.project.icon}</div>
          <h1 className="page-title">{CATEGORY_INFO.project.name}</h1>
          <p className="page-desc">{CATEGORY_INFO.project.description}</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Action Bar */}
          {currentUser && (
            <div className="flex justify-end mb-6">
              <Link to="/write?category=project" className="btn btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                프로젝트 등록
                <span className="badge badge-primary ml-1">+{POINT_VALUES.POST}P</span>
              </Link>
            </div>
          )}

          {/* Posts - Card Grid */}
          {posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">{CATEGORY_INFO.project.icon}</div>
              <p className="text-gray-500 mb-6">아직 등록된 프로젝트가 없습니다</p>
              {currentUser && (
                <Link to="/write?category=project" className="btn btn-primary">
                  첫 프로젝트 등록하기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <ProjectCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ post }: { post: Post }) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Link
      to={`/post/${post.id}`}
      className="card card-hover overflow-hidden"
    >
      {post.imageURL && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.imageURL}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 hover:text-blue-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{post.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={post.authorPhotoURL || '/default-avatar.png'}
              alt={post.authorName}
              className="avatar avatar-sm"
              style={{ borderColor: tierInfo.color }}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-900">{post.authorName}</span>
                <span style={{ color: tierInfo.color }}>{tierInfo.emoji}</span>
              </div>
              <span className="text-xs text-gray-500">{post.createdAt.toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-red-400">♥</span>
              <span>{post.likes.length}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>💬</span>
              <span>{post.comments.length}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
