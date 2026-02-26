# Edu FLI 프로젝트 문제점 분석 보고서

> 분석일: 2026-02-26 (2차 분석)

## 빌드 상태

| 항목 | 결과 |
|------|------|
| TypeScript 컴파일 | 통과 |
| Lint (`tsc --noEmit`) | 통과 |
| Vite 빌드 | 통과 (경고 1건) |
| 번들 크기 경고 | `index.js` **624KB** (500KB 초과) |

---

## 요약

| 구분 | CRITICAL | HIGH | MEDIUM | LOW |
|------|----------|------|--------|-----|
| 보안 | 1 | 2 | 2 | - |
| 코드 품질 | - | 2 | 3 | 2 |
| 성능 | - | 3 | 3 | - |
| 에러 처리 | - | 2 | 2 | - |
| UX/접근성 | - | - | 4 | 2 |
| 타입 안전성 | - | - | 2 | - |
| **합계** | **1** | **9** | **16** | **4** |

---

## 1. 보안 문제 (Security)

### [CRITICAL] 클라이언트 사이드 관리자 권한 체크

**파일**: `src/components/common/ProtectedRoute.tsx`

관리자 권한 검증이 클라이언트에서만 수행됩니다. 브라우저 상태를 조작하면 관리자 페이지에 접근 가능합니다.

```typescript
if (requireAdmin && !currentUser.isAdmin) {
  return <Navigate to="/" replace />
}
```

**권장**: Firestore Security Rules + Cloud Functions에서 서버 사이드 검증 필수

### [HIGH] 사용자 입력 미살균 (XSS 위험)

**파일**: `src/pages/PostDetail.tsx:213`, `src/pages/Messages.tsx:319`

사용자 콘텐츠가 살균(sanitization) 없이 렌더링됩니다. React의 기본 이스케이프가 있지만, 향후 마크다운 렌더링 추가 시 취약해질 수 있습니다.

**권장**: DOMPurify 도입 검토

### [HIGH] Storage URL 참조 오류

**파일**: `src/services/postService.ts:63`, `src/services/galleryService.ts:56`

서명된 다운로드 URL을 Storage 참조 경로로 사용하여 이미지 삭제가 실패할 수 있습니다.

```typescript
const storageRef = ref(storage, imageURL) // imageURL은 서명된 URL, 경로가 아님
```

**권장**: 스토리지 경로를 별도 필드로 저장하거나 `refFromURL()` 사용

### [MEDIUM] 이미지 업로드 보안

**파일**: `WritePost.tsx`, `Gallery.tsx`, `MyPage.tsx`

파일 크기/MIME 타입 검증이 클라이언트에서만 수행됩니다. 서버 사이드 검증 부재.

### [MEDIUM] Rate Limiting 부재

좋아요/댓글 작성 등에 속도 제한 없음. 스패밍 가능.

---

## 2. 코드 품질 (Code Quality)

### [HIGH] 게시판 페이지 대규모 중복 (200줄+)

4개 게시판 페이지가 카테고리명만 다르고 거의 동일합니다:

- `src/pages/Introduction.tsx`
- `src/pages/StudyBoard.tsx`
- `src/pages/ProjectBoard.tsx`
- `src/pages/ResourcesBoard.tsx`

```typescript
// 4개 파일 모두 동일 패턴
const [posts, setPosts] = useState<Post[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => { loadPosts() }, [])
const loadPosts = async () => {
  try {
    const { posts: data } = await getPosts('category', 50)
    setPosts(data)
  } catch (error) { console.error('...') }
  finally { setLoading(false) }
}
```

**권장**: `useBoardPosts(category)` 커스텀 훅 또는 `<PostBoard category="..." />` 공통 컴포넌트로 통합

### [HIGH] 이미지 업로드/검증 로직 4곳 중복

`WritePost.tsx`, `EditPost.tsx`, `Gallery.tsx`, `MyPage.tsx`에서 동일한 이미지 유효성 검사/미리보기 로직 반복.

**권장**: `useImageUpload()` 커스텀 훅으로 추출

### [MEDIUM] 모달 패턴 중복

SendMessageModal, Gallery 업로드 모달 등이 공통 래퍼 없이 각각 구현

### [MEDIUM] ESLint 미설정

`npm run lint`가 `tsc --noEmit`만 실행. 코드 스타일, 미사용 import, React Hooks 규칙 등 미검사.

**권장**: `eslint` + `@typescript-eslint` + `eslint-plugin-react-hooks` 설정

### [MEDIUM] DocumentData 무검증 캐스팅

Firestore 데이터를 검증 없이 `as Type` 캐스팅:

```typescript
// Admin.tsx
return { uid: doc.id, ...data } as User  // 위험

// messageService.ts
return { id: doc.id, ...doc.data() } as Message[]  // 위험
```

### [LOW] index.css 비대 (864줄)

Tailwind 유틸리티 외 많은 커스텀 CSS 포함. 컴포넌트 수준 분리 필요.

### [LOW] 테스트 코드 없음

단위 테스트, 통합 테스트가 전혀 없음. Vitest + React Testing Library 도입 권장.

---

## 3. 성능 (Performance)

### [HIGH] 메인 번들 624KB 초과

Firebase SDK가 메인 번들에 포함되어 500KB 제한 초과.

**권장**:
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
        vendor: ['react', 'react-dom', 'react-router-dom']
      }
    }
  }
}
```

### [HIGH] 비효율적 Firebase 쿼리

| 파일 | 문제 |
|------|------|
| `Admin.tsx` | 전체 사용자 로드 (limit 없음) |
| `Ranking.tsx` | 100명 로드 → 클라이언트에서 50명 필터 |
| `messageService.ts` | 전체 메시지 로드 (pagination 없음) |
| `MyPage.tsx` | 사용자 게시글 100개 로드 |

### [HIGH] 이미지 최적화 부재

- `loading="lazy"` 미적용
- 썸네일 생성 없음 (원본 해상도 그대로 로드)
- 반응형 이미지 (`srcset`) 미사용

**파일**: `Gallery.tsx:162-182`, `PostDetail.tsx:216-225`, `Home.tsx:169-173`

### [MEDIUM] React.memo 미적용

리스트 아이템 컴포넌트에 메모이제이션 부재:

- `PostItem` - 게시판 목록
- `RankingRow` - 랭킹 50+ 행
- `MessageListItem` - 쪽지 목록
- `MemberCard` - 홈 회원 카드

### [MEDIUM] Admin 필터링 최적화 필요

대규모 사용자 목록을 매 렌더마다 `useMemo` 없이 필터링.

### [MEDIUM] 페이지네이션 미구현

게시판, 사용자 목록, 메시지 등 모든 목록에 페이지네이션 없음. 데이터 증가 시 성능 급락.

---

## 4. 에러 처리 (Error Handling)

### [HIGH] 사용자 에러 피드백 없음

`catch` 블록에서 `console.error`만 호출하고 UI에 에러를 표시하지 않음:

- `Admin.tsx` - 포인트 조정, 권한 변경, 회원 삭제 실패 시
- `Header.tsx` - 메시지 로드 실패 시
- `Introduction/Study/Project/Resources.tsx` - 게시글 로드 실패 시 빈 화면

**권장**: 공통 에러/토스트 컴포넌트 생성

### [HIGH] AuthContext 무음 로그아웃

```typescript
// AuthContext.tsx
} catch (error) {
  console.error('사용자 데이터 로딩 실패:', error)
  setCurrentUser(null) // 예기치 않은 로그아웃 → 사용자 혼란
}
```

### [MEDIUM] useEffect 의존성 문제

```typescript
// Header.tsx
useEffect(() => {
  if (currentUser) {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }
}, [currentUser]) // loadUnreadCount 누락 → stale closure
```

### [MEDIUM] parseInt 유효성 검사 부재

`Admin.tsx`에서 `parseInt()` 결과가 `NaN`일 수 있으나 검사하지 않음.

---

## 5. UX/접근성 (Accessibility)

### [MEDIUM] ARIA 라벨 누락

- Header 아이콘 버튼에 `aria-label` 없음
- Admin 테이블이 `<table>` 대신 CSS Grid → 스크린 리더 인식 불가
- 모달의 `aria-labelledby` 누락
- TierBadge 이모지에 `aria-label` 없음

### [MEDIUM] 키보드 내비게이션 미지원

- Gallery 모달 ESC 키 닫기 미지원
- 캐로셀 키보드 조작 불가
- 갤러리 아이템 Tab 포커스 불가

### [MEDIUM] 폼 유효성 검사 부재

- `WritePost`: 제출 전까지 유효성 검사 피드백 없음
- `MyPage`: 문자 수 제한은 있으나 시각적 카운터 없음

### [MEDIUM] alert() 기반 피드백

관리자 작업 등에서 `alert()`/`window.confirm()` 사용. UX에 부적합.

**권장**: 토스트 알림 시스템 도입

### [LOW] 색상 대비 부족 가능성

일부 배경/텍스트 조합에서 WCAG 기준 미달 가능

### [LOW] 이미지 alt 텍스트 일반적

"첨부 이미지" 같은 일반 텍스트로는 스크린 리더에 유용하지 않음

---

## 6. 타입 안전성 (Type Safety)

### [MEDIUM] Firebase 데이터 무검증 캐스팅

모든 서비스에서 Firestore 데이터를 `as Type`으로 캐스팅. 데이터 구조 변경 시 런타임 에러 발생 가능.

**권장**: Zod 스키마 검증 도입

### [MEDIUM] URL 파라미터 미검증

```typescript
// WritePost.tsx
const category = (searchParams.get('category') || 'study') as Post['category']
// 유효하지 않은 카테고리도 통과
```

---

## 우선순위별 개선 로드맵

### Phase 1 - 즉시 수정 (보안/안정성)
1. Firestore Security Rules에서 서버 측 권한 검증 강화
2. Storage 이미지 삭제 로직 수정 (URL → 경로)
3. 에러 UI 컴포넌트 생성 및 전 페이지 적용
4. `parseInt` 및 입력값 유효성 검사 추가

### Phase 2 - 단기 (성능)
5. Firebase SDK 코드 스플리팅 (`manualChunks`)
6. 이미지 `loading="lazy"` 적용
7. `React.memo`로 리스트 컴포넌트 최적화
8. Firestore 쿼리 최적화 (limit, 서버 측 필터링)

### Phase 3 - 중기 (코드 품질)
9. 게시판 4개 → 공통 컴포넌트 1개로 통합
10. 이미지 업로드 커스텀 훅 추출
11. ESLint 설정 도입
12. DOMPurify 입력값 살균 도입

### Phase 4 - 장기 (UX/인프라)
13. ARIA 라벨 전면 추가 + 키보드 내비게이션
14. 페이지네이션 도입
15. React Query/SWR 데이터 페칭 레이어
16. Vitest + React Testing Library 테스트 도입
