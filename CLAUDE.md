# CLAUDE.md - Edu FLI 프로젝트 컨텍스트

이 파일은 AI 어시스턴트가 프로젝트를 이해하는 데 필요한 핵심 정보를 제공합니다.

## 프로젝트 개요

**Edu FLI** (Education & Future Learning Innovation)는 전주교육대학교 에듀테크 동아리 커뮤니티 플랫폼입니다. 동아리 회원들이 지식을 공유하고, 프로젝트를 협업하며, 스터디에 참여하고, 게이미피케이션 시스템으로 활동을 장려하는 웹 애플리케이션입니다.

## 기술 스택

- **프론트엔드**: React 19 + TypeScript 5.9 + Vite 7
- **스타일링**: Tailwind CSS 4 + PostCSS
- **백엔드**: Firebase (Auth, Firestore, Storage)
- **인증**: Google OAuth
- **폰트**: Pretendard Variable (한국어 최적화)

## 빌드 및 실행 명령어

```bash
npm install       # 의존성 설치
npm run dev       # 개발 서버 실행 (localhost:5173)
npm run build     # 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
npm run lint      # ESLint 검사
```

## 프로젝트 구조

```
src/
├── components/           # 재사용 UI 컴포넌트
│   ├── common/          # 공통 컴포넌트 (LoadingSpinner, TierBadge, ProtectedRoute 등)
│   └── layout/          # 레이아웃 (Header, Footer, Layout)
├── pages/               # 페이지 컴포넌트
│   ├── Home.tsx         # 메인 페이지
│   ├── Introduction.tsx # 자기소개 게시판
│   ├── StudyBoard.tsx   # 스터디/세미나 게시판
│   ├── ProjectBoard.tsx # 프로젝트 게시판
│   ├── ResourcesBoard.tsx # 자료실
│   ├── Gallery.tsx      # 갤러리
│   ├── Ranking.tsx      # 랭킹
│   ├── PostDetail.tsx   # 게시글 상세
│   ├── WritePost.tsx    # 게시글 작성
│   ├── EditPost.tsx     # 게시글 수정
│   ├── MyPage.tsx       # 마이페이지
│   ├── Messages.tsx     # 쪽지함
│   └── Admin.tsx        # 관리자 대시보드
├── services/            # Firebase 서비스 로직
│   ├── postService.ts   # 게시글 CRUD
│   ├── messageService.ts # 메시지 서비스
│   └── galleryService.ts # 갤러리 서비스
├── contexts/            # React Context
│   └── AuthContext.tsx  # 인증 상태 관리
├── config/              # 설정
│   └── firebase.ts      # Firebase 초기화
├── types/               # TypeScript 타입 정의
│   └── index.ts
├── App.tsx              # 라우터 설정
├── main.tsx             # 앱 진입점
└── index.css            # 전역 스타일
```

## 핵심 기능

### 1. 인증 시스템
- Google OAuth 로그인
- 최초 로그인 시 자동 프로필 생성
- AuthContext로 전역 상태 관리
- ProtectedRoute로 보호된 라우트

### 2. 게시판 시스템
- **자기소개** (introduction): 50포인트
- **스터디/세미나** (study): 10포인트
- **프로젝트** (project): 10포인트
- **자료실** (resources): 15포인트
- 댓글 작성: 3포인트
- 좋아요 받기: 2포인트
- 이미지 업로드 지원 (5MB 제한, Ctrl+V 붙여넣기)

### 3. 티어 시스템
```
Bronze (0-99P)      : 수습 회원
Silver (100-299P)   : 초보 마법사
Gold (300-699P)     : 전문 마법사
Platinum (700-1499P): 고급 마법사
Diamond (1500-2999P): 대 마법사
Master (3000+P)     : 현자
Challenger          : 대현자 (관리자 지정)
```

### 4. 랭킹 시스템
- 포인트 기반 상위 50명 표시
- 티어 진행률 표시
- 쪽지 보내기 기능

### 5. 쪽지 시스템 (Shoji)
- 1:1 비공개 메시지
- 읽음/안읽음 표시
- 헤더에 안읽은 메시지 수 배지

### 6. 갤러리
- 동아리 활동 사진 공유
- 라이트박스 모달 뷰
- 작성자/관리자만 삭제 가능

### 7. 관리자 기능
- 사용자 관리 (포인트 조정, 관리자 권한, 테스트 계정)
- 챌린저 티어 지정
- 보상 시스템

## Firebase 컬렉션 구조

```
users: 사용자 프로필
  - uid, email, displayName, nickname, photoURL
  - points, tier, isAdmin, isChallenger, isTestAccount
  - department, year, interests, skills

posts: 게시글
  - authorId, authorName, authorPhotoURL, authorTier
  - title, content, imageURL, category
  - likes[], comments[], createdAt, updatedAt

messages: 쪽지
  - senderId, senderName, receiverId, receiverName
  - title, content, isRead, createdAt

gallery: 갤러리
  - imageURL, title, description
  - uploadedBy, uploadedByName, createdAt

rewards: 보상 기록
  - userId, userName, rewardName, description
  - givenAt, givenBy
```

## 라우팅 구조

```
/                  - 홈 (공개)
/introduction      - 자기소개 (공개)
/study             - 스터디 (공개)
/project           - 프로젝트 (공개)
/resources         - 자료실 (공개)
/gallery           - 갤러리 (공개)
/ranking           - 랭킹 (공개)
/post/:id          - 게시글 상세 (공개)
/write             - 글쓰기 (로그인 필요)
/edit/:id          - 글수정 (로그인 + 작성자)
/mypage            - 마이페이지 (로그인 필요)
/messages          - 쪽지함 (로그인 필요)
/admin             - 관리자 (관리자 전용)
```

## 환경 변수

`.env` 파일에 다음 변수 설정 필요:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 코딩 컨벤션

- TypeScript strict 모드 사용
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 경로 별칭: `@/` = `src/`
- 한국어 UI, 영어 코드

## 스타일링 가이드

- Tailwind CSS 유틸리티 클래스 사용
- 글래스모피즘 효과 (backdrop-blur, bg-opacity)
- 그라디언트 메쉬 배경
- 커스텀 애니메이션 (float, shimmer, glow)
- 반응형 디자인 (모바일 우선)

## 주요 컴포넌트

### AuthContext
```typescript
const { currentUser, loading, signInWithGoogle, signOut, refreshUser } = useAuth();
```

### TierBadge
```typescript
<TierBadge tier={user.tier} size="sm" showLabel />
```

### ProtectedRoute
```typescript
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>
```

## 개발 시 주의사항

1. Firebase 보안 규칙이 설정되어 있으므로 권한 확인 필요
2. 이미지 업로드 시 5MB 제한 적용
3. 포인트 변경 시 티어 자동 재계산
4. 테스트 계정은 랭킹에서 제외됨
5. 관리자 권한은 Firebase Console에서 수동 설정 필요
