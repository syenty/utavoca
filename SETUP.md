# Utavoca 프로젝트 설정 가이드

일본 노래 가사를 활용한 일본어 단어 학습 서비스

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [초기 설정](#초기-설정)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [프로젝트 구조](#프로젝트-구조)
6. [주요 기능](#주요-기능)
7. [환경 변수](#환경-변수)
8. [실행 방법](#실행-방법)

---

## 프로젝트 개요

### 핵심 기능

1. **노래 가사 분석**: LLM을 이용해 가사에서 단어(vocabs) 추출
2. **데이터베이스 저장**: 가수, 앨범, 노래, 단어 정보 저장
3. **검색 및 조회**: 가수, 노래 검색 및 상세 정보 조회
4. **즐겨찾기**: 좋아하는 가수/노래 즐겨찾기 등록
5. **단어 테스트**: 랜덤 단어 테스트 기능
6. **복습 시스템**: 틀린 단어 자동 기록 및 복습 노트

---

## 기술 스택

### Frontend/Backend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**

### Database
- **Supabase** (PostgreSQL)
- **Row Level Security (RLS)** 적용

### Authentication
- **Supabase Auth** (이메일/비밀번호)

### AI
- **LLM** (가사 분석 및 vocab 추출) - 예정

---

## 초기 설정

### 1. Next.js 프로젝트 초기화

```bash
# package.json 생성 및 의존성 설치
npm install

# 설치된 주요 패키지:
# - next
# - react, react-dom
# - @supabase/supabase-js
# - @supabase/ssr
# - typescript, tailwindcss, etc.
```

### 2. Supabase 프로젝트 설정

#### 2.1 Supabase CLI 초기화

```bash
npx supabase init
```

#### 2.2 마이그레이션 파일 생성

마이그레이션 파일 위치: `supabase/migrations/20260205081242_initial_schema.sql`

#### 2.3 Supabase 클라우드에 적용

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. SQL Editor 열기
3. 마이그레이션 파일 내용 복사 → 붙여넣기 → 실행

---

## 데이터베이스 스키마

### 관리자 관리 테이블

#### `artists` (가수)
```sql
- id: UUID (PK)
- name: TEXT
- image_url: TEXT (nullable)
- created_at: TIMESTAMP
```

#### `albums` (앨범)
```sql
- id: UUID (PK)
- artist_id: UUID (FK → artists)
- title: TEXT
- cover_image_url: TEXT (nullable)
- release_year: INTEGER (nullable)
- created_at: TIMESTAMP
```

#### `songs` (노래)
```sql
- id: UUID (PK)
- artist_id: UUID (FK → artists)
- album_id: UUID (FK → albums, nullable)
- title: TEXT
- summary: TEXT (nullable)
- vocabs: JSONB (단어 배열)
- created_at: TIMESTAMP
```

**vocabs JSONB 구조:**
```json
[
  {
    "name": "愛",
    "meaning": "사랑",
    "pronunciation": "ai"
  }
]
```

### 사용자 데이터 테이블

#### `favorites` (즐겨찾기)
```sql
- id: UUID (PK)
- user_id: UUID
- favoritable_type: TEXT ('artist' | 'song')
- favoritable_id: UUID
- created_at: TIMESTAMP
- UNIQUE(user_id, favoritable_type, favoritable_id)
```

#### `wrong_vocabs` (틀린 단어 / 복습 노트)
```sql
- id: UUID (PK)
- user_id: UUID
- song_id: UUID (FK → songs)
- vocab_name: TEXT (일본어 단어)
- vocab_meaning: TEXT (한국어 뜻)
- vocab_pronunciation: TEXT (로마자 발음)
- wrong_count: INTEGER (틀린 횟수)
- last_wrong_at: TIMESTAMP
- created_at: TIMESTAMP
- UNIQUE(user_id, song_id, vocab_name)
```

### 데이터베이스 함수

#### `get_favorite_vocabs(p_user_id UUID)`
즐겨찾기된 가수/노래의 모든 vocabs 조회

#### `get_wrong_vocabs_for_review(p_user_id UUID, p_limit INTEGER)`
복습용 틀린 단어 조회 (wrong_count 높은 순)

### RLS (Row Level Security) 정책

- **artists, albums, songs**: 모두 SELECT 가능 (읽기 전용)
- **favorites, wrong_vocabs**: 본인 데이터만 CRUD 가능

---

## 프로젝트 구조

```
utavoca/
├── app/
│   ├── actions/              # Server Actions
│   │   ├── auth.ts          # 인증 (로그아웃)
│   │   ├── favorites.ts     # 즐겨찾기 CRUD
│   │   ├── wrong-vocabs.ts  # 틀린 단어 CRUD
│   │   └── search.ts        # 검색/조회
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts     # 인증 콜백 (매직 링크용)
│   ├── login/
│   │   └── page.tsx         # 로그인 페이지
│   ├── globals.css          # 전역 스타일
│   ├── layout.tsx           # Root Layout
│   └── page.tsx             # 홈 페이지
│
├── lib/
│   ├── supabase.ts          # 클라이언트 컴포넌트용 Supabase 클라이언트
│   └── supabase-server.ts   # 서버 컴포넌트용 Supabase 클라이언트
│
├── types/
│   └── database.ts          # TypeScript 타입 정의
│
├── supabase/
│   ├── config.toml          # Supabase 로컬 설정
│   └── migrations/          # 마이그레이션 파일
│       └── 20260205081242_initial_schema.sql
│
├── middleware.ts            # 세션 자동 갱신
├── .env.local              # 환경 변수 (gitignore)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 주요 기능

### 1. 인증 (Authentication)

#### 로그인
- **방식**: 이메일/비밀번호
- **특징**: 등록된 사용자만 로그인 가능 (회원가입 없음)
- **페이지**: `/login`

#### 사용자 관리
- Supabase 대시보드에서 수동으로 사용자 추가
- URL: `https://supabase.com/dashboard/project/{PROJECT_ID}/auth/users`

### 2. Server Actions (사용자 CRUD)

#### 인증 (`app/actions/auth.ts`)
```typescript
- signOut(): 로그아웃
```

#### 즐겨찾기 (`app/actions/favorites.ts`)
```typescript
- addFavorite(type, id): 즐겨찾기 추가
- removeFavorite(id): 즐겨찾기 삭제
- getFavorites(): 즐겨찾기 목록 조회
- getFavoriteVocabs(): 즐겨찾기 vocabs 조회
```

#### 틀린 단어 (`app/actions/wrong-vocabs.ts`)
```typescript
- recordWrongVocab(...): 틀린 단어 기록 (UPSERT)
- getWrongVocabsForReview(limit): 복습할 단어 조회
- getWrongVocabs(): 틀린 단어 목록 조회
- deleteWrongVocab(id): 틀린 단어 삭제
```

#### 검색/조회 (`app/actions/search.ts`)
```typescript
- searchArtists(query): 가수 검색
- searchSongs(query): 노래 검색
- getArtistWithSongs(id): 가수 상세 (노래 목록 포함)
- getSongWithVocabs(id): 노래 상세 (vocabs 포함)
- getAllArtists(): 전체 가수 목록
- getRecentSongs(limit): 최근 추가된 노래
```

### 3. Supabase 클라이언트 사용법

#### 클라이언트 컴포넌트
```tsx
'use client'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
const { data } = await supabase.from('artists').select()
```

#### 서버 컴포넌트
```tsx
import { createClient } from '@/lib/supabase-server'

const supabase = await createClient()
const { data } = await supabase.from('artists').select()
```

---

## 환경 변수

### `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xfunggxqcbjgcxoczeil.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

**주의**: `.env.local` 파일은 `.gitignore`에 포함되어 있습니다. 절대 커밋하지 마세요!

---

## 실행 방법

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm start
```

---

## Supabase 사용자 추가 방법

### 1. Supabase 대시보드 접속

https://supabase.com/dashboard/project/xfunggxqcbjgcxoczeil/auth/users

### 2. 사용자 추가

1. **Add user** 버튼 클릭
2. **Create new user** 선택
3. 이메일 입력
4. 비밀번호 입력 (또는 자동 생성)
5. **Auto Confirm User** 체크 ✅
6. **Create user** 클릭

### 3. (선택) 회원가입 비활성화

https://supabase.com/dashboard/project/xfunggxqcbjgcxoczeil/auth/providers

**Email Provider** → **Enable email signup** 끄기

---

## 다음 단계 (TODO)

### Phase 1: 사용자 UI 구현 (우선순위 높음)

#### 1.1 메인 페이지 개선
- [ ] 네비게이션 바 추가 (홈, 검색, 즐겨찾기, 복습)
- [ ] 최근 추가된 노래 목록 표시
- [ ] 인기 가수 목록 표시
- [ ] 반응형 디자인 적용

#### 1.2 검색 기능
- [ ] 검색 페이지 생성 (`/search`)
- [ ] 실시간 검색 (debounce 적용)
- [ ] 가수/노래 검색 결과 탭
- [ ] 검색 결과 카드 디자인

#### 1.3 가수 페이지
- [ ] 가수 목록 페이지 (`/artists`)
- [ ] 가수 상세 페이지 (`/artists/[id]`)
  - 가수 정보 표시
  - 노래 목록 표시
  - 즐겨찾기 버튼
- [ ] 페이지네이션 또는 무한 스크롤

#### 1.4 노래 페이지
- [ ] 노래 상세 페이지 (`/songs/[id]`)
  - 노래 정보 (제목, 가수, 앨범, 요약)
  - vocabs 목록 표시
  - 즐겨찾기 버튼
  - "이 노래로 테스트하기" 버튼
- [ ] vocabs 필터링 (가나다순, 난이도별)

#### 1.5 즐겨찾기 페이지
- [ ] 즐겨찾기 목록 페이지 (`/favorites`)
- [ ] 가수/노래 탭 구분
- [ ] 즐겨찾기 해제 기능
- [ ] "즐겨찾기로 테스트하기" 버튼

#### 1.6 단어 테스트 기능
- [ ] 테스트 설정 페이지
  - 테스트 모드 선택 (특정 노래 / 즐겨찾기 / 복습)
  - 문제 수 선택 (10, 20, 30개)
  - 문제 유형 선택 (한→일, 일→한)
- [ ] 테스트 진행 페이지 (`/test/[id]`)
  - 문제 카드 UI
  - 진행 상황 표시 (3/10)
  - 정답/오답 피드백
  - 타이머 (선택사항)
- [ ] 테스트 결과 페이지
  - 점수 표시
  - 틀린 단어 목록
  - 복습 노트에 자동 추가
  - "다시 테스트하기" 버튼

#### 1.7 복습 노트 페이지
- [ ] 틀린 단어 목록 페이지 (`/review`)
- [ ] wrong_count별 정렬
- [ ] 노래별 그룹핑
- [ ] 단어 삭제 기능
- [ ] "복습 테스트 시작" 버튼

---

### Phase 2: LLM 통합 (관리자 기능)

#### 2.1 관리자 인증
- [ ] 관리자 역할(role) 추가
- [ ] 관리자 전용 페이지 보호
- [ ] 관리자 대시보드 (`/admin`)

#### 2.2 가사 업로드 인터페이스
- [ ] 가사 업로드 페이지 (`/admin/upload`)
- [ ] 가수 선택/추가
- [ ] 앨범 선택/추가 (선택사항)
- [ ] 노래 제목 입력
- [ ] 가사 텍스트 입력 (textarea)
- [ ] 파일 업로드 (.txt)

#### 2.3 LLM API 연동
- [ ] LLM 프로바이더 선택 (OpenAI / Claude)
- [ ] API 키 환경 변수 설정
- [ ] 프롬프트 엔지니어링
  ```
  일본 노래 가사에서 학습할 가치가 있는 단어들을 추출하고,
  각 단어의 한국어 뜻과 로마자 발음을 JSON 배열로 반환해줘.

  형식: [{"name": "일본어단어", "meaning": "한국어뜻", "pronunciation": "로마자발음"}]

  추가로 이 가사의 전체적인 의미를 2-3문장으로 요약해줘.
  ```
- [ ] Server Action 생성 (`processLyrics`)
- [ ] 에러 핸들링 (재시도 로직)

#### 2.4 처리 상태 관리
- [ ] songs 테이블에 `processing_status` 필드 추가
  - `pending`: 대기 중
  - `processing`: 처리 중
  - `completed`: 완료
  - `failed`: 실패
- [ ] 처리 큐 시스템 (선택사항)
- [ ] 처리 진행 상황 UI

#### 2.5 배치 처리
- [ ] 여러 가사 한 번에 업로드
- [ ] 백그라운드 작업 처리
- [ ] 처리 완료 알림

#### 2.6 관리자 대시보드
- [ ] 전체 통계 표시
  - 가수/노래/단어 개수
  - 사용자 수
  - 테스트 완료 횟수
- [ ] 최근 추가된 노래
- [ ] 처리 중인 작업 목록

---

### Phase 3: 고급 기능

#### 3.1 학습 통계
- [ ] 사용자별 학습 기록 테이블 추가
- [ ] 학습 대시보드 페이지 (`/dashboard`)
  - 총 학습한 단어 수
  - 테스트 완료 횟수
  - 정답률 그래프
  - 일일 학습 추이
- [ ] 배지/업적 시스템

#### 3.2 간격 반복 학습 (Spaced Repetition)
- [ ] SM-2 알고리즘 구현
- [ ] wrong_vocabs 테이블에 필드 추가
  - `ease_factor`: 난이도
  - `interval`: 반복 간격
  - `next_review_date`: 다음 복습 날짜
- [ ] "오늘의 복습" 기능
- [ ] 복습 알림 (이메일/푸시)

#### 3.3 난이도 시스템
- [ ] vocabs에 난이도 필드 추가
  - `beginner`, `intermediate`, `advanced`
- [ ] 자동 난이도 판정 (JLPT 레벨 기반)
- [ ] 난이도별 필터링
- [ ] 레벨별 학습 경로

#### 3.4 발음 듣기 기능
- [ ] TTS API 연동 (Google TTS / AWS Polly)
- [ ] 단어 카드에 스피커 아이콘 추가
- [ ] 발음 듣기 버튼
- [ ] 발음 속도 조절

#### 3.5 소셜 기능
- [ ] 학습 기록 공유
- [ ] 친구 기능
- [ ] 리더보드
- [ ] 사용자 단어장 공유

---

### Phase 4: 성능 최적화

#### 4.1 캐싱
- [ ] React Query 도입
- [ ] API 응답 캐싱
- [ ] ISR (Incremental Static Regeneration) 적용
- [ ] CDN 설정

#### 4.2 이미지 최적화
- [ ] Next.js Image 컴포넌트 사용
- [ ] 이미지 lazy loading
- [ ] WebP 포맷 변환
- [ ] Supabase Storage 활용

#### 4.3 번들 최적화
- [ ] Dynamic imports
- [ ] Code splitting
- [ ] Tree shaking
- [ ] 번들 크기 분석 (Bundle Analyzer)

#### 4.4 데이터베이스 최적화
- [ ] 인덱스 추가 최적화
- [ ] 쿼리 성능 분석
- [ ] Connection pooling
- [ ] 읽기 복제본 (선택사항)

---

### Phase 5: 테스팅

#### 5.1 단위 테스트
- [ ] Jest 설정
- [ ] 유틸리티 함수 테스트
- [ ] Server Actions 테스트
- [ ] 컴포넌트 테스트 (React Testing Library)

#### 5.2 E2E 테스트
- [ ] Playwright 설정
- [ ] 로그인 플로우 테스트
- [ ] 단어 테스트 플로우 테스트
- [ ] 즐겨찾기 기능 테스트

#### 5.3 통합 테스트
- [ ] API 테스트
- [ ] 데이터베이스 마이그레이션 테스트

---

### Phase 6: 배포 및 운영

#### 6.1 배포 준비
- [ ] 환경별 설정 (.env.production)
- [ ] CI/CD 파이프라인 구축 (GitHub Actions)
- [ ] Vercel 배포
- [ ] 도메인 연결

#### 6.2 모니터링
- [ ] 에러 트래킹 (Sentry)
- [ ] 성능 모니터링 (Vercel Analytics)
- [ ] 로그 수집
- [ ] 알림 설정

#### 6.3 보안
- [ ] CORS 설정
- [ ] Rate limiting
- [ ] SQL Injection 방지 확인
- [ ] XSS 방지 확인
- [ ] CSRF 토큰
- [ ] 환경 변수 보안 점검

#### 6.4 백업
- [ ] 데이터베이스 정기 백업
- [ ] 복구 절차 문서화

---

### Phase 7: 추가 고려사항

#### 7.1 다국어 지원
- [ ] i18n 설정 (next-intl)
- [ ] 한국어/일본어 UI
- [ ] 번역 파일 관리

#### 7.2 접근성 (a11y)
- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원
- [ ] 색상 대비 개선

#### 7.3 SEO
- [ ] 메타 태그 최적화
- [ ] Open Graph 이미지
- [ ] sitemap.xml 생성
- [ ] robots.txt 설정

#### 7.4 PWA
- [ ] Service Worker
- [ ] 오프라인 지원
- [ ] 앱 설치 기능
- [ ] 푸시 알림

---

## 트러블슈팅

### 로그인이 안 될 때
1. `.env.local` 파일 확인
2. Supabase에서 사용자가 정상적으로 추가되었는지 확인
3. **Auto Confirm User**가 체크되었는지 확인

### 데이터베이스 연결 실패
1. Supabase URL과 Anon Key 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인

### 마이그레이션 오류
- SQL Editor에서 직접 실행 시 에러 메시지 확인
- 기존 테이블과 충돌하는 경우 DROP TABLE 후 재실행

---

## 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [프로젝트 README](./README.md)

---

**작성일**: 2026-02-05
**버전**: 1.0.0
