# Edu FLI 프로젝트 문제점 분석 보고서

> 분석일: 2026-02-26

---

## 요약

| 구분 | 심각 | 높음 | 중간 | 낮음 |
|------|------|------|------|------|
| 보안 | 3 | 2 | 1 | - |
| 성능 | - | 4 | 2 | 1 |
| 에러 처리 | - | 3 | 2 | 1 |
| 코드 품질 | - | 1 | 4 | 2 |
| 접근성 | - | - | 3 | 2 |
| 빌드/설정 | - | 2 | 3 | - |
| **합계** | **3** | **12** | **15** | **6** |

---

## 1. 보안 문제 (Security)

### [심각] 클라이언트 측 권한 검증만 존재

게시글 삭제, 갤러리 삭제 등 민감한 작업의 권한 확인이 프론트엔드에서만 이루어지고 있습니다. 브라우저 개발자 도구로 우회 가능합니다.

- `src/pages/PostDetail.tsx:191-207` — 삭제 권한 클라이언트 측 검증
- `src/pages/Gallery.tsx:87-92` — 갤러리 삭제 권한 클라이언트 측 검증

**권장 조치:** Firestore Security Rules 또는 Cloud Functions에서 서버 측 권한 검증 추가

### [심각] XSS 취약점 가능성

사용자 입력 콘텐츠가 별도의 sanitization 없이 렌더링됩니다. React는 기본적으로 텍스트를 이스케이프하지만, `dangerouslySetInnerHTML`을 사용하거나 향후 마크다운 렌더링을 추가할 경우 위험합니다.

- `src/pages/PostDetail.tsx:213` — 게시글 콘텐츠 렌더링
- `src/pages/Messages.tsx:319` — 쪽지 콘텐츠 렌더링

**권장 조치:** DOMPurify 등 sanitization 라이브러리 도입 검토

### [심각] 관리자 기능 보안 미흡

Admin 서비스에서 Cloud Functions 호출 시 호출자가 실제 관리자인지 서버에서 검증하는 로직이 불명확합니다.

- `src/services/adminService.ts:14-18` — 포인트 조정 함수
- `src/pages/Admin.tsx` — 관리자 페이지 클라이언트 측 보호만 존재

**권장 조치:** Cloud Functions에서 `context.auth.token.admin` 등 커스텀 클레임 확인

### [높음] 안전하지 않은 URL 열기

외부 이미지 URL을 검증 없이 `window.open()`으로 여는 코드가 있습니다.

- `src/pages/PostDetail.tsx:222` — `window.open(post.imageURL, '_blank')`

### [높음] 파일 업로드 MIME 타입 검증 우회 가능

`file.type`만으로 파일 타입을 검증하며, 매직 바이트 검증이 없어 우회 가능합니다.

- `src/pages/WritePost.tsx:81-89`
- `src/pages/MyPage.tsx:58-92`

**권장 조치:** Storage Rules에서 contentType 검증 + 서버 측 파일 검증 추가

### [중간] Rate Limiting 부재

좋아요, 댓글 작성 등에 클라이언트/서버 측 속도 제한이 없습니다.

- `src/pages/PostDetail.tsx:37-54` — 좋아요 스패밍 가능
- `src/pages/PostDetail.tsx:56-77` — 댓글 연속 작성 가능

---

## 2. 성능 문제 (Performance)

### [높음] 번들 크기 경고

빌드 시 메인 청크(`index-BCCQ36OU.js`)가 **624.48 KB** (gzip: 196.67 KB)로, Vite의 500 KB 권장 제한을 초과합니다. 대부분 Firebase SDK가 차지합니다.

```
(!) Some chunks are larger than 500 kB after minification.
```

**권장 조치:**
- `build.rollupOptions.output.manualChunks`로 Firebase SDK 별도 청크 분리
- 필요한 Firebase 모듈만 tree-shaking으로 import

### [높음] React.memo 미사용

반복 렌더링되는 리스트 아이템 컴포넌트에 `React.memo`가 적용되지 않아 불필요한 리렌더링이 발생합니다.

- `src/pages/Home.tsx:381-487` — `MemberCard` 컴포넌트
- `src/pages/Ranking.tsx:223-311` — `RankingRow` 컴포넌트
- `src/pages/Messages.tsx:201-272` — `MessageListItem` 컴포넌트

### [높음] 이미지 Lazy Loading 미적용

갤러리, 홈페이지 등에서 모든 이미지를 즉시 로드합니다.

- `src/pages/Home.tsx:169-173` — 홈 갤러리 그리드
- `src/pages/Gallery.tsx:162-182` — 갤러리 페이지

**권장 조치:** `loading="lazy"` 속성 추가 또는 Intersection Observer 활용

### [높음] 비효율적인 Firestore 쿼리

필요 이상의 데이터를 가져온 후 클라이언트에서 필터링합니다.

- `src/pages/Home.tsx:39-43` — 상위 30명 조회 후 클라이언트 필터링
- `src/pages/Ranking.tsx:22-45` — 100명 조회 후 50명으로 자르기

**권장 조치:** Firestore 쿼리에서 직접 필터링하도록 수정

### [중간] Admin 페이지 필터링 최적화 필요

대규모 사용자 목록을 매 렌더마다 필터링합니다.

- `src/pages/Admin.tsx:271-375` — `useMemo` 없이 매번 필터링

### [중간] 페이지네이션 미구현

게시판, 사용자 목록, 메시지 목록 등에 페이지네이션이 없어 데이터가 많아지면 성능 저하가 예상됩니다.

### [낮음] Carousel auto-scroll에서 마운트 확인 누락

- `src/pages/Home.tsx:21-35` — 언마운트 후 interval 콜백 실행 가능

---

## 3. 에러 처리 (Error Handling)

### [높음] 에러 UI 부재

데이터 로딩 실패 시 사용자에게 에러를 표시하지 않고 빈 화면이 나타납니다.

- `src/pages/Introduction.tsx:18-26`
- `src/pages/StudyBoard.tsx:18-26`
- `src/pages/ProjectBoard.tsx:18-26`
- `src/pages/ResourcesBoard.tsx:18-26`

**권장 조치:** 공통 Error State 컴포넌트 생성 및 적용

### [높음] 에러 로깅만 하고 사용자 피드백 없음

`catch` 블록에서 `console.error`만 호출하고 사용자에게 알림을 주지 않습니다.

- `src/pages/Home.tsx:62-68` — 로그인 에러
- `src/components/layout/Header.tsx:41-47` — 메시지 로드 에러
- `src/pages/PostDetail.tsx:79-88` — 삭제 확인 없음

### [높음] parseInt 유효성 검사 부재

- `src/pages/Admin.tsx:176-184` — `parseInt()` 결과가 `NaN`일 수 있음

### [중간] Fire-and-Forget 비동기 작업

- `src/components/common/OnlineUsers.tsx:72` — `beforeunload`에서 `deleteDoc()` 완료 보장 불가
- `src/pages/PostDetail.tsx:79-88` — 삭제 성공 확인 없이 네비게이션

### [중간] EditPost null 안전성

- `src/pages/EditPost.tsx:166-180` — `post` 객체가 여전히 null일 수 있는 경우 처리 부족

### [낮음] ErrorBoundary 제한적 사용

`ErrorBoundary` 컴포넌트가 존재하지만 비동기 에러를 잡지 못합니다.

---

## 4. 코드 품질 (Code Quality)

### [높음] 게시판 페이지 중복

Introduction, StudyBoard, ProjectBoard, ResourcesBoard 4개 페이지가 거의 동일한 코드입니다. 카테고리명만 다릅니다.

- `src/pages/Introduction.tsx`
- `src/pages/StudyBoard.tsx`
- `src/pages/ProjectBoard.tsx`
- `src/pages/ResourcesBoard.tsx`

**권장 조치:** 공통 `<PostBoard category="..." />` 컴포넌트로 통합

### [중간] WritePost/EditPost 중복 로직

이미지 업로드, 에러 처리, 폼 구조가 거의 동일합니다.

- `src/pages/WritePost.tsx:81-97`
- `src/pages/EditPost.tsx:56-73`

### [중간] 모달 패턴 중복

SendMessageModal, Gallery 업로드 모달 등이 공통 모달 래퍼 없이 각각 구현되어 있습니다.

### [중간] URL.revokeObjectURL 중복

미리보기 URL 해제 로직이 WritePost, EditPost, Gallery에서 반복됩니다.

### [중간] DocumentData를 타입 검증 없이 캐스팅

Firestore에서 가져온 데이터를 검증 없이 TypeScript 타입으로 캐스팅합니다.

- `src/pages/Admin.tsx:32-45`
- `src/pages/Ranking.tsx:28-36`
- `src/services/messageService.ts:44-57`

### [낮음] ESLint 미설정

`npm run lint`가 `tsc --noEmit`만 실행합니다. 코드 스타일, 미사용 import, React 규칙 등을 검사하는 ESLint가 없습니다.

**권장 조치:** `eslint` + `@typescript-eslint` + `eslint-plugin-react-hooks` 설정

### [낮음] index.css 파일 비대

`src/index.css`가 864줄로, Tailwind 유틸리티 외에 많은 커스텀 CSS가 포함되어 있습니다. Tailwind의 `@apply`나 컴포넌트 수준 스타일로 분리가 필요합니다.

---

## 5. 접근성 (Accessibility)

### [중간] ARIA 라벨 누락

- `src/components/layout/Header.tsx:153-160` — 아이콘 버튼에 `aria-label` 없음
- `src/components/common/TierBadge.tsx:19-30` — 이모지에 `aria-label` 없음
- `src/pages/Gallery.tsx:144-147` — 업로드 버튼 `aria-label` 없음
- `src/pages/Ranking.tsx:295-306` — 메시지 전송 버튼 `aria-label` 없음

### [중간] 키보드 내비게이션 미지원

- `src/pages/Home.tsx:150-152` — 캐로셀 키보드 조작 불가
- `src/pages/Gallery.tsx:164-180` — 갤러리 아이템 Tab 키 포커스 불가

### [중간] 모달 접근성

- `src/pages/Gallery.tsx:287-290` — 라이트박스 모달에 `role="dialog"` 누락
- ESC 키로 모달 닫기 일관성 확인 필요

### [낮음] 색상 대비

- `src/pages/Ranking.tsx:252` — amber-50 배경 + amber-600 텍스트 대비 부족 가능성

### [낮음] 이미지 alt 텍스트

- 일부 이미지의 alt 텍스트가 일반적("첨부 이미지")이어서 스크린 리더에 유용하지 않음

---

## 6. 빌드/설정 문제

### [높음] 코드 스플리팅 미흡

Firebase SDK가 메인 번들에 포함되어 **624.48 KB** (gzip: 196.67 KB)의 초기 로드 크기를 유발합니다.

**권장 조치:** `vite.config.ts`에서 manualChunks 설정:
```typescript
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

### [높음] rollup 보안 취약점

`npm audit`에서 **HIGH** 심각도의 취약점이 발견되었습니다.

- **패키지:** `rollup` 4.0.0 - 4.58.0 (vite의 하위 의존성)
- **문제:** Path Traversal을 통한 임의 파일 쓰기 ([GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc))

**권장 조치:** `npm audit fix` 실행

### [중간] Vite resolve alias 불일치 가능

`vite.config.ts`의 alias가 `'/src'` (절대 경로)로 설정되어 있어, 일부 환경에서 문제가 될 수 있습니다.

**권장 조치:** `path.resolve(__dirname, 'src')` 사용

### [중간] autoprefixer 중복 가능성

Tailwind CSS v4의 `@tailwindcss/postcss` 플러그인은 Lightning CSS를 통해 자체적으로 vendor prefixing을 처리합니다. `autoprefixer`가 중복될 수 있습니다.

**권장 조치:** `postcss.config.js`와 `package.json`에서 `autoprefixer` 제거 검토

### [중간] Firebase Functions 빌드 독립성

루트의 `npm run build`가 `functions/` 디렉토리를 빌드하지 않아 배포 시 별도 빌드가 필요합니다.

---

## 우선순위별 개선 로드맵

### Phase 1 - 즉시 (보안/안정성)
1. Firestore Security Rules에서 삭제/수정 권한 서버 측 검증 강화
2. Cloud Functions에서 관리자 권한 검증 추가
3. 에러 UI 컴포넌트 생성 및 전 페이지 적용
4. `parseInt` 및 입력값 유효성 검사 추가

### Phase 2 - 단기 (성능)
5. Firebase SDK 코드 스플리팅 (manualChunks)
6. 이미지 Lazy Loading 적용
7. React.memo로 리스트 컴포넌트 최적화
8. Firestore 쿼리 최적화

### Phase 3 - 중기 (코드 품질)
9. 게시판 공통 컴포넌트 추출 (4개 → 1개)
10. WritePost/EditPost 공통 로직 추출
11. ESLint 설정 도입
12. 공통 Modal 래퍼 컴포넌트 생성

### Phase 4 - 장기 (접근성/UX)
13. ARIA 라벨 전면 추가
14. 키보드 내비게이션 지원
15. 페이지네이션 도입
16. Rate Limiting 구현
