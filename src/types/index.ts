export type TierType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'challenger'

// 게시판 카테고리 타입
export type CategoryType = 'introduction' | 'study' | 'project' | 'resources'

// 학과 목록
export const DEPARTMENTS = [
  '초등교육과',
  '국어교육과',
  '영어교육과',
  '수학교육과',
  '과학교육과',
  '사회교육과',
  '체육교육과',
  '음악교육과',
  '미술교육과',
  '실과교육과',
  '컴퓨터교육과',
  '유아교육과',
  '특수교육과',
] as const

// 관심 분야 옵션
export const INTEREST_OPTIONS = [
  'EdTech',
  'AI 교육',
  '게이미피케이션',
  'LMS 개발',
  '교육 콘텐츠',
  '원격 교육',
  '메이커 교육',
  'SW 교육',
  '데이터 분석',
  '교육 심리',
  '수업 설계',
  '평가 도구',
] as const

// 기술 옵션
export const SKILL_OPTIONS = [
  'Python',
  'JavaScript',
  'React',
  'Figma',
  'Notion',
  'Canva',
  '영상 편집',
  'PPT/프레젠테이션',
  'Excel/스프레드시트',
  '3D 모델링',
  'Unity',
  'ChatGPT/AI 도구',
] as const

export interface User {
  uid: string
  email: string
  displayName: string
  nickname?: string
  photoURL: string | null
  points: number
  tier: TierType
  isAdmin: boolean
  isChallenger: boolean
  isTestAccount?: boolean
  createdAt: Date
  introduction?: string
  realName?: string
  studentId?: string // 학번
  // 교육공학 동아리 특화 필드
  department?: string      // 학과
  year?: number           // 학년 (1-4)
  interests?: string[]    // 관심 분야
  skills?: string[]       // 보유 기술
}

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorPhotoURL: string | null
  authorTier: TierType
  title: string
  content: string
  imageURL?: string
  category: CategoryType
  likes: string[]
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
  // 추가 메타데이터
  tags?: string[]          // 태그 (검색/필터링용)
  attachments?: string[]   // 첨부파일 (자료실용)
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorPhotoURL: string | null
  authorTier: TierType
  content: string
  createdAt: Date
}

export interface Reward {
  id: string
  userId: string
  userName: string
  rewardName: string
  description: string
  givenAt: Date
  givenBy: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderPhotoURL: string | null
  senderTier: TierType
  receiverId: string
  receiverName: string
  title: string
  content: string
  isRead: boolean
  createdAt: Date
}

export const TIER_THRESHOLDS: Record<TierType, { min: number; max: number }> = {
  bronze: { min: 0, max: 99 },
  silver: { min: 100, max: 299 },
  gold: { min: 300, max: 699 },
  platinum: { min: 700, max: 1499 },
  diamond: { min: 1500, max: 2999 },
  master: { min: 3000, max: Infinity },
  challenger: { min: 0, max: Infinity },
}

// 마법사 테마 티어 정보
export const TIER_INFO: Record<TierType, { name: string; emoji: string; color: string }> = {
  bronze: { name: '견습생', emoji: '📒', color: '#A0816C' },
  silver: { name: '초급마법사', emoji: '✨', color: '#6B9BD1' },
  gold: { name: '정식마법사', emoji: '🔮', color: '#E6B422' },
  platinum: { name: '상급마법사', emoji: '💫', color: '#40BFB0' },
  diamond: { name: '대마법사', emoji: '🌟', color: '#A78BFA' },
  master: { name: '현자', emoji: '📜', color: '#F472B6' },
  challenger: { name: '대현자', emoji: '👑', color: '#FBBF24' },
}

export const POINT_VALUES = {
  INTRODUCTION: 50,      // 자기소개 게시글
  POST: 10,              // 일반 게시글
  COMMENT: 3,            // 댓글
  LIKE_RECEIVED: 2,      // 좋아요 받음
  RESOURCE_UPLOAD: 15,   // 자료 업로드
  PROJECT_COMPLETION: 100, // 프로젝트 완료
}

// 카테고리 정보
export const CATEGORY_INFO: Record<CategoryType, { name: string; description: string; icon: string }> = {
  introduction: { name: '자기소개', description: '동아리 멤버들의 자기소개', icon: '👋' },
  study: { name: '스터디/세미나', description: '스터디 모집 및 세미나 공지', icon: '📖' },
  project: { name: '프로젝트', description: '프로젝트 소개 및 팀원 모집', icon: '🚀' },
  resources: { name: '자료실', description: '교육 자료 및 파일 공유', icon: '📁' },
}

export interface GalleryImage {
  id: string
  imageURL: string
  title: string
  description?: string
  uploadedBy: string
  uploadedByName: string
  createdAt: Date
}
