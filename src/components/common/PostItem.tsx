import { Link } from 'react-router-dom'
import { Post, TIER_INFO } from '../../types'

interface PostItemProps {
  post: Post
  isLast: boolean
}

export default function PostItem({ post, isLast }: PostItemProps) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Link
      to={`/post/${post.id}`}
      className={`list-item gap-4 ${!isLast ? '' : 'border-b-0'}`}
    >
      <img
        src={post.authorPhotoURL || '/default-avatar.png'}
        alt={post.authorName}
        className="avatar avatar-md"
        style={{ borderColor: tierInfo.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          {post.imageURL && (
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate mb-2">{post.content}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span>{post.authorName}</span>
            <span style={{ color: tierInfo.color }}>{tierInfo.emoji}</span>
          </span>
          <span>{post.createdAt.toLocaleDateString('ko-KR')}</span>
        </div>
      </div>
      {post.imageURL && (
        <img
          src={post.imageURL}
          alt="썸네일"
          className="w-16 h-16 object-cover rounded border border-gray-200 shrink-0"
        />
      )}
      <div className="flex items-center gap-4 text-sm shrink-0">
        <span className="flex items-center gap-1 text-gray-500">
          <span className="text-red-400">♥</span>
          <span>{post.likes.length}</span>
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <span>💬</span>
          <span>{post.comments.length}</span>
        </span>
      </div>
    </Link>
  )
}
