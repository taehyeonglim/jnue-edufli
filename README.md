# Edu FLI - 전주교육대학교 에듀테크 동아리 플랫폼

<div align="center">

![Edu FLI Logo](public/edufli-logo.png)

**Education & Future Learning Innovation**

전주교육대학교 에듀테크 동아리 회원들을 위한 커뮤니티 플랫폼

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

</div>

---

## 소개

Edu FLI는 전주교육대학교 에듀테크 동아리의 공식 커뮤니티 플랫폼입니다. 동아리 회원들이 서로 교류하고, 지식을 공유하며, 프로젝트를 협업할 수 있는 공간을 제공합니다.

### 주요 특징

- **게시판 시스템**: 자기소개, 스터디/세미나, 프로젝트, 자료실
- **게이미피케이션**: 포인트 및 티어 시스템으로 활발한 참여 유도
- **랭킹 시스템**: 포인트 기반 회원 랭킹
- **쪽지 기능**: 회원 간 비공개 메시지
- **갤러리**: 동아리 활동 사진 공유
- **관리자 대시보드**: 회원 관리 및 보상 시스템

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프론트엔드** | React 19, TypeScript 5.9 |
| **빌드 도구** | Vite 7 |
| **스타일링** | Tailwind CSS 4, PostCSS |
| **백엔드** | Firebase (Auth, Firestore, Storage) |
| **인증** | Google OAuth 2.0 |
| **폰트** | Pretendard Variable |

---

## 시작하기

### 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Firebase 프로젝트

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/jnue-edufli.git
cd jnue-edufli

# 의존성 설치
npm install
```

### 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일을 생성하세요.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 실행

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 검사
npm run lint
```

---

## 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 UI 컴포넌트
│   ├── common/          # 공통 컴포넌트
│   │   ├── LoadingSpinner.tsx
│   │   ├── OnlineUsers.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── SendMessageModal.tsx
│   │   └── TierBadge.tsx
│   └── layout/          # 레이아웃 컴포넌트
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Layout.tsx
│
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
│
├── services/            # Firebase 서비스 로직
│   ├── postService.ts   # 게시글 CRUD
│   ├── messageService.ts # 메시지 서비스
│   └── galleryService.ts # 갤러리 서비스
│
├── contexts/            # React Context
│   └── AuthContext.tsx  # 인증 상태 관리
│
├── config/              # 설정 파일
│   └── firebase.ts      # Firebase 초기화
│
├── types/               # TypeScript 타입 정의
│   └── index.ts
│
├── App.tsx              # 라우터 설정
├── main.tsx             # 앱 진입점
└── index.css            # 전역 스타일
```

---

## 기능 상세

### 1. 인증 시스템

- Google 계정으로 간편 로그인
- 최초 로그인 시 자동 프로필 생성
- 로그인 상태 유지

### 2. 게시판 시스템

| 게시판 | 설명 | 포인트 |
|--------|------|--------|
| 자기소개 | 회원 소개 글 | 50P |
| 스터디/세미나 | 스터디 모집 및 세미나 정보 | 10P |
| 프로젝트 | 프로젝트 소개 및 팀원 모집 | 10P |
| 자료실 | 학습 자료 공유 | 15P |

**추가 포인트**
- 댓글 작성: 3P
- 좋아요 받기: 2P

### 3. 티어 시스템

활동으로 얻은 포인트에 따라 티어가 결정됩니다.

| 티어 | 포인트 | 칭호 |
|------|--------|------|
| Bronze | 0 ~ 99 | 수습 회원 |
| Silver | 100 ~ 299 | 초보 마법사 |
| Gold | 300 ~ 699 | 전문 마법사 |
| Platinum | 700 ~ 1,499 | 고급 마법사 |
| Diamond | 1,500 ~ 2,999 | 대 마법사 |
| Master | 3,000+ | 현자 |
| Challenger | - | 대현자 (관리자 지정) |

### 4. 랭킹

- 포인트 기반 상위 50명 표시
- 티어 진행률 시각화
- 다음 티어까지 필요 포인트 안내

### 5. 쪽지 (Shoji)

- 회원 간 1:1 비공개 메시지
- 받은 쪽지 / 보낸 쪽지 탭
- 안읽은 메시지 수 헤더에 표시

### 6. 갤러리

- 동아리 활동 사진 공유
- 라이트박스 모달로 사진 감상
- 작성자 및 관리자만 삭제 가능

### 7. 마이페이지

- 프로필 사진 업로드
- 닉네임, 학과, 학년 설정
- 관심 분야 및 기술 태그 선택
- 활동 통계 확인

### 8. 관리자 대시보드

- **회원 관리**: 포인트 조정, 관리자 권한 부여, 테스트 계정 설정
- **챌린저 관리**: 특별 티어 지정/해제
- **보상 시스템**: 회원에게 보상 지급

---

## 스크린샷

> 추후 추가 예정

---

## 기여하기

1. 이 저장소를 Fork 합니다.
2. 새 브랜치를 생성합니다. (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다. (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push 합니다. (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다.

---

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 연락처

- **동아리**: 전주교육대학교 Edu FLI
- **이메일**: edufli@jnue.ac.kr

---

<div align="center">

**Made with by Edu FLI Members**

</div>
