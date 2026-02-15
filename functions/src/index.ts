import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

initializeApp()

const db = getFirestore()
const USERS_COLLECTION = 'users'
const POSTS_COLLECTION = 'posts'
const POINT_EVENTS_COLLECTION = 'pointEvents'

type TierType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'challenger'
type CategoryType = 'introduction' | 'study' | 'project' | 'resources'

const POINT_VALUES = {
  INTRODUCTION: 50,
  POST: 10,
  COMMENT: 3,
  LIKE_RECEIVED: 2,
}

const TIER_THRESHOLDS: Record<TierType, { min: number }> = {
  bronze: { min: 0 },
  silver: { min: 100 },
  gold: { min: 300 },
  platinum: { min: 700 },
  diamond: { min: 1500 },
  master: { min: 3000 },
  challenger: { min: 0 },
}

function calculateTier(points: number, isChallenger: boolean): TierType {
  if (isChallenger) return 'challenger'
  const tiers: TierType[] = ['master', 'diamond', 'platinum', 'gold', 'silver', 'bronze']
  for (const tier of tiers) {
    if (points >= TIER_THRESHOLDS[tier].min) {
      return tier
    }
  }
  return 'bronze'
}

async function getUserOrThrow(uid: string) {
  const userRef = db.collection(USERS_COLLECTION).doc(uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) {
    throw new HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.')
  }
  return { userRef, userSnap }
}

function asNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${fieldName}는 문자열이어야 합니다.`)
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new HttpsError('invalid-argument', `${fieldName}는 비어 있을 수 없습니다.`)
  }
  return trimmed
}

async function applyPointDeltaTx(
  tx: FirebaseFirestore.Transaction,
  targetUid: string,
  delta: number,
  eventId: string,
) {
  const eventRef = db.collection(POINT_EVENTS_COLLECTION).doc(eventId)
  const existingEvent = await tx.get(eventRef)
  if (existingEvent.exists) return

  const userRef = db.collection(USERS_COLLECTION).doc(targetUid)
  const userSnap = await tx.get(userRef)
  if (!userSnap.exists) {
    throw new HttpsError('not-found', '포인트 대상 사용자를 찾을 수 없습니다.')
  }

  const data = userSnap.data() || {}
  const currentPoints = typeof data.points === 'number' ? data.points : 0
  const isChallenger = data.isChallenger === true
  const nextPoints = Math.max(0, currentPoints + delta)
  const nextTier = calculateTier(nextPoints, isChallenger)

  tx.update(userRef, {
    points: nextPoints,
    tier: nextTier,
  })
  tx.set(eventRef, {
    targetUid,
    delta,
    createdAt: Timestamp.now(),
  })
}

export const createPost = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')

  const category = asNonEmptyString(request.data?.category, 'category') as CategoryType
  const title = asNonEmptyString(request.data?.title, 'title')
  const content = asNonEmptyString(request.data?.content, 'content')
  const imageURL =
    typeof request.data?.imageURL === 'string' && request.data.imageURL.trim()
      ? request.data.imageURL.trim()
      : null

  if (!['introduction', 'study', 'project', 'resources'].includes(category)) {
    throw new HttpsError('invalid-argument', '지원하지 않는 카테고리입니다.')
  }

  const { userSnap } = await getUserOrThrow(uid)
  const user = userSnap.data() || {}
  const authorName = (user.nickname as string) || (user.displayName as string) || '회원'

  const createdPostRef = await db.collection(POSTS_COLLECTION).add({
    authorId: uid,
    authorName,
    authorPhotoURL: user.photoURL || null,
    authorTier: user.tier || 'bronze',
    title,
    content,
    category,
    imageURL,
    likes: [],
    comments: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  const points = category === 'introduction' ? POINT_VALUES.INTRODUCTION : POINT_VALUES.POST
  await db.runTransaction(async (tx) => {
    await applyPointDeltaTx(tx, uid, points, `post:create:${createdPostRef.id}`)
  })

  return { postId: createdPostRef.id }
})

export const togglePostLike = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  const postId = asNonEmptyString(request.data?.postId, 'postId')

  const postRef = db.collection(POSTS_COLLECTION).doc(postId)

  return db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef)
    if (!postSnap.exists) {
      throw new HttpsError('not-found', '게시글을 찾을 수 없습니다.')
    }

    const post = postSnap.data() || {}
    const authorId = post.authorId as string
    if (!authorId) {
      throw new HttpsError('failed-precondition', '작성자 정보가 없습니다.')
    }
    if (authorId === uid) {
      throw new HttpsError('failed-precondition', '본인 글에는 좋아요를 누를 수 없습니다.')
    }

    const likes = Array.isArray(post.likes) ? (post.likes as string[]) : []
    const isLiked = likes.includes(uid)
    const nextLikes = isLiked ? likes.filter((id) => id !== uid) : [...likes, uid]

    tx.update(postRef, {
      likes: nextLikes,
      updatedAt: Timestamp.now(),
    })

    const delta = isLiked ? -POINT_VALUES.LIKE_RECEIVED : POINT_VALUES.LIKE_RECEIVED
    const action = isLiked ? 'unlike' : 'like'
    await applyPointDeltaTx(tx, authorId, delta, `like:${postId}:${uid}:${action}`)

    return { liked: !isLiked, likesCount: nextLikes.length }
  })
})

export const addPostComment = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  const postId = asNonEmptyString(request.data?.postId, 'postId')
  const content = asNonEmptyString(request.data?.content, 'content')

  const { userSnap } = await getUserOrThrow(uid)
  const user = userSnap.data() || {}
  const commentId = db.collection('_').doc().id
  const createdAt = Timestamp.now()

  const comment = {
    id: commentId,
    authorId: uid,
    authorName: (user.nickname as string) || (user.displayName as string) || '회원',
    authorPhotoURL: user.photoURL || null,
    authorTier: (user.tier as TierType) || 'bronze',
    content,
    createdAt,
  }

  const postRef = db.collection(POSTS_COLLECTION).doc(postId)
  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef)
    if (!postSnap.exists) {
      throw new HttpsError('not-found', '게시글을 찾을 수 없습니다.')
    }
    const post = postSnap.data() || {}
    const comments = Array.isArray(post.comments) ? [...post.comments] : []
    comments.push(comment)

    tx.update(postRef, {
      comments,
      updatedAt: Timestamp.now(),
    })

    await applyPointDeltaTx(tx, uid, POINT_VALUES.COMMENT, `comment:create:${postId}:${commentId}`)
  })

  return {
    comment: {
      ...comment,
      createdAt: createdAt.toMillis(),
    },
  }
})

export const deletePostComment = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')

  const postId = asNonEmptyString(request.data?.postId, 'postId')
  const commentId = asNonEmptyString(request.data?.commentId, 'commentId')

  const { userSnap: actorSnap } = await getUserOrThrow(uid)
  const isAdmin = actorSnap.data()?.isAdmin === true
  const postRef = db.collection(POSTS_COLLECTION).doc(postId)

  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef)
    if (!postSnap.exists) {
      throw new HttpsError('not-found', '게시글을 찾을 수 없습니다.')
    }
    const post = postSnap.data() || {}
    const comments = Array.isArray(post.comments) ? [...post.comments] : []
    const commentIndex = comments.findIndex((item) => item.id === commentId)
    if (commentIndex === -1) {
      throw new HttpsError('not-found', '댓글을 찾을 수 없습니다.')
    }

    const target = comments[commentIndex] as { authorId: string }
    const canDelete =
      isAdmin || post.authorId === uid || (target.authorId && target.authorId === uid)
    if (!canDelete) {
      throw new HttpsError('permission-denied', '댓글 삭제 권한이 없습니다.')
    }

    comments.splice(commentIndex, 1)
    tx.update(postRef, {
      comments,
      updatedAt: Timestamp.now(),
    })

    if (target.authorId) {
      await applyPointDeltaTx(
        tx,
        target.authorId,
        -POINT_VALUES.COMMENT,
        `comment:delete:${postId}:${commentId}`,
      )
    }
  })

  return { success: true }
})

export const deletePost = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')

  const postId = asNonEmptyString(request.data?.postId, 'postId')
  const postRef = db.collection(POSTS_COLLECTION).doc(postId)
  const { userSnap: actorSnap } = await getUserOrThrow(uid)
  const isAdmin = actorSnap.data()?.isAdmin === true

  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef)
    if (!postSnap.exists) {
      throw new HttpsError('not-found', '게시글을 찾을 수 없습니다.')
    }
    const post = postSnap.data() || {}
    const canDelete = isAdmin || post.authorId === uid
    if (!canDelete) {
      throw new HttpsError('permission-denied', '게시글 삭제 권한이 없습니다.')
    }

    const category = post.category as CategoryType
    const authorId = post.authorId as string
    const points = category === 'introduction' ? POINT_VALUES.INTRODUCTION : POINT_VALUES.POST
    tx.delete(postRef)

    if (authorId) {
      await applyPointDeltaTx(tx, authorId, -points, `post:delete:${postId}`)
    }
  })

  return { success: true }
})

export const adminAdjustPoints = onCall(async (request) => {
  const actorUid = request.auth?.uid
  if (!actorUid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')

  const { userSnap: actorSnap } = await getUserOrThrow(actorUid)
  if (actorSnap.data()?.isAdmin !== true) {
    throw new HttpsError('permission-denied', '관리자 권한이 필요합니다.')
  }

  const targetUid = asNonEmptyString(request.data?.targetUid, 'targetUid')
  const delta = Number(request.data?.delta)
  if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
    throw new HttpsError('invalid-argument', 'delta는 정수여야 합니다.')
  }
  const requestId = asNonEmptyString(request.data?.requestId, 'requestId')

  let resultPoints = 0
  let resultTier: TierType = 'bronze'

  await db.runTransaction(async (tx) => {
    await applyPointDeltaTx(tx, targetUid, delta, `admin:adjust:${targetUid}:${requestId}`)
    const targetRef = db.collection(USERS_COLLECTION).doc(targetUid)
    const targetSnap = await tx.get(targetRef)
    const target = targetSnap.data() || {}
    resultPoints = typeof target.points === 'number' ? target.points : 0
    resultTier = (target.tier as TierType) || 'bronze'
  })

  return { points: resultPoints, tier: resultTier }
})

export const adminSetRole = onCall(async (request) => {
  const actorUid = request.auth?.uid
  if (!actorUid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  const { userSnap: actorSnap } = await getUserOrThrow(actorUid)
  if (actorSnap.data()?.isAdmin !== true) {
    throw new HttpsError('permission-denied', '관리자 권한이 필요합니다.')
  }

  const targetUid = asNonEmptyString(request.data?.targetUid, 'targetUid')
  const targetRef = db.collection(USERS_COLLECTION).doc(targetUid)
  const targetSnap = await targetRef.get()
  if (!targetSnap.exists) {
    throw new HttpsError('not-found', '대상 사용자를 찾을 수 없습니다.')
  }
  const target = targetSnap.data() || {}

  const updates: Record<string, unknown> = {}
  if (typeof request.data?.isAdmin === 'boolean') {
    updates.isAdmin = request.data.isAdmin
  }
  if (typeof request.data?.isChallenger === 'boolean') {
    updates.isChallenger = request.data.isChallenger
  }
  if (typeof request.data?.isTestAccount === 'boolean') {
    updates.isTestAccount = request.data.isTestAccount
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpsError('invalid-argument', '변경할 역할 정보가 없습니다.')
  }

  const nextIsChallenger =
    typeof updates.isChallenger === 'boolean' ? (updates.isChallenger as boolean) : target.isChallenger === true
  const points = typeof target.points === 'number' ? target.points : 0
  updates.tier = calculateTier(points, nextIsChallenger)

  await targetRef.update(updates)
  return { success: true }
})
