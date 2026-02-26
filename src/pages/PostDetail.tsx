import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPost, toggleLike, addComment, deletePost, deleteComment } from '../services/postService'
import { getUserById } from '../services/messageService'
import { Post, Comment, User, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SendMessageModal from '../components/common/SendMessageModal'
import { getCategoryRoute } from '../utils/helpers'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [messageTarget, setMessageTarget] = useState<User | null>(null)

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    if (!id) return
    try {
      const data = await getPost(id)
      setPost(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser || !post) return
    try {
      const { liked } = await toggleLike(post.id)
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          likes: liked
            ? Array.from(new Set([...prev.likes, currentUser.uid]))
            : prev.likes.filter((uid) => uid !== currentUser.uid),
        }
      })
      await refreshUser()
    } catch (error) {
      console.error('좋아요 실패:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !post || !commentText.trim() || submitting) return

    setSubmitting(true)
    try {
      const newComment = await addComment(post.id, commentText.trim())
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        }
      })
      setCommentText('')
      await refreshUser()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!post || !window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await deletePost(post.id)
      await refreshUser()
      navigate(-1)
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }

  const handleDeleteComment = async (comment: Comment) => {
    if (!post || !window.confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await deleteComment(post.id, comment.id)
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== comment.id),
        }
      })
      await refreshUser()
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
    }
  }

  const handleSendMessage = async (userId: string) => {
    try {
      const user = await getUserById(userId)
      if (user) {
        setMessageTarget(user)
      }
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
    }
  }


  if (loading) {
    return <LoadingSpinner />
  }

  if (!post) {
    return (
      <div className="section">
        <div className="container-xs">
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">😢</div>
            <p className="text-slate-500 mb-6">게시글을 찾을 수 없습니다</p>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const categoryInfo = getCategoryRoute(post.category)
  const isAuthor = currentUser?.uid === post.authorId
  const isAdmin = currentUser?.isAdmin
  const isLiked = currentUser && post.likes.includes(currentUser.uid)
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <div className="section">
      <div className="container-sm">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-primary-600 transition-colors">홈</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={categoryInfo.link} className="hover:text-primary-600 transition-colors flex items-center gap-1">
            <span>{categoryInfo.icon}</span>
            <span>{categoryInfo.label}</span>
          </Link>
        </nav>

        {/* Post Content */}
        <article className="card mb-6">
          <div className="card-body">
            {/* Author Info */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={post.authorPhotoURL || '/default-avatar.svg'}
                  alt={post.authorName}
                  className="avatar avatar-md"
                  style={{ borderColor: tierInfo.color }}
                />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900">{post.authorName}</span>
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${tierInfo.color}25`,
                        color: tierInfo.color,
                      }}
                    >
                      {tierInfo.emoji} {tierInfo.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {post.createdAt.toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>

              {(isAuthor || isAdmin) && (
                <div className="flex items-center gap-2">
                  {isAuthor && (
                    <Link
                      to={`/edit/${post.id}`}
                      className="text-xs text-slate-500 hover:text-primary-600 transition-colors px-2 py-1"
                    >
                      수정
                    </Link>
                  )}
                  <button
                    onClick={handleDeletePost}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* Title & Content */}
            <h1 className="heading-2 text-primary-600 mb-4">{post.title}</h1>
            <div className="text-slate-900/90 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</div>

            {/* Post Image */}
            {post.imageURL && (
              <div className="mt-4">
                <img
                  src={post.imageURL}
                  alt={`${post.title} 첨부 이미지`}
                  className="w-full max-h-[500px] object-contain rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => window.open(post.imageURL, '_blank')}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-8 pt-5 border-t border-slate-200">
              <button
                onClick={handleLike}
                disabled={!currentUser || isAuthor}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
                  isLiked
                    ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-lg shadow-red-400/30 scale-105'
                    : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-400'
                }`}
              >
                <span>❤️</span>
                <span>{post.likes.length}</span>
              </button>
              <span className="text-sm text-slate-500">
                💬 댓글 {post.comments.length}개
              </span>
              {currentUser && !isAuthor && (
                <button
                  onClick={() => handleSendMessage(post.authorId)}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-slate-50 text-slate-500 border border-slate-200 hover:border-primary-400 hover:text-slate-900 transition-all ml-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>쪽지</span>
                </button>
              )}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="card">
          <div className="card-header">
            <h2 className="heading-3 text-primary-600 flex items-center gap-2">
              <span>💬</span>
              <span>댓글</span>
              <span className="text-sm font-normal text-slate-500">({post.comments.length})</span>
            </h2>
          </div>
          <div className="card-body">
            {/* Comment Form */}
            {currentUser ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`댓글을 작성하세요 (+${POINT_VALUES.COMMENT}P)`}
                  className="input textarea"
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">{commentText.length}/500</span>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting}
                    className="btn btn-primary btn-sm"
                  >
                    {submitting ? '작성 중...' : '댓글 작성'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200 text-center">
                <p className="text-sm text-slate-500">댓글을 작성하려면 로그인하세요</p>
              </div>
            )}

            {/* Comments List */}
            {post.comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">아직 댓글이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    canDelete={currentUser?.uid === comment.authorId || isAdmin}
                    onDelete={() => handleDeleteComment(comment)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Send Message Modal */}
      {messageTarget && (
        <SendMessageModal
          receiver={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSuccess={() => alert('쪽지를 보냈습니다!')}
        />
      )}
    </div>
  )
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment
  canDelete?: boolean
  onDelete: () => void
}) {
  const createdAt = comment.createdAt instanceof Date
    ? comment.createdAt
    : new Date(comment.createdAt)

  const tierInfo = TIER_INFO[comment.authorTier] || TIER_INFO.bronze

  return (
    <div className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <img
        src={comment.authorPhotoURL || '/default-avatar.svg'}
        alt={comment.authorName}
        className="avatar avatar-sm shrink-0"
        style={{ borderColor: tierInfo.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-sm font-medium text-slate-900">{comment.authorName}</span>
          <span className="text-xs" style={{ color: tierInfo.color }}>
            {tierInfo.emoji}
          </span>
          <span className="text-xs text-slate-500">
            {createdAt.toLocaleString('ko-KR')}
          </span>
          {canDelete && (
            <button
              onClick={onDelete}
              className="ml-auto text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          )}
        </div>
        <p className="text-sm text-slate-900/80 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  )
}
