# Japanese Vocabulary Learning Project

## 프로젝트 개요

일본 노래 가사를 활용한 일본어 단어 학습 서비스

### 핵심 기능

1. 노래 가사 텍스트 파일을 LLM을 이용해 summaries, vocabs 2개의 entity로 변환
   - 2단계 검증: 소형 모델(qwen3:14b) 생성 → 대형 모델(Claude Sonnet 4.5) 검증
   - 비용 효율적인 데이터 품질 관리 (22% 비용 절감)
2. 변환된 데이터를 DB에 저장
3. summaries, vocabs 데이터들은 가수, 노래 제목에 종속
4. **하이브리드 인증 시스템**: 로그인 없이 자유롭게 검색/조회, 회원 기능(즐겨찾기/테스트)만 로그인 필요
5. 사용자는 가수, 노래 검색을 통해 해당하는 summaries, vocabs 정보 조회 가능
   - **다국어 퍼지 검색**: 일본어, 영어 로마자, 한글로 검색 가능
   - **오타 허용**: 띄어쓰기/오타 자동 보정 (pg_trgm 기반)
6. **지능적인 아티스트 정렬**: 인기도(즐겨찾기) + 등록일 + 콘텐츠량 기반 정렬
7. vocabs 정보 조회 후 해당 등록된 단어들로 랜덤 단어 테스트 가능
   - 3가지 테스트 모드: JP→KR, KR→JP, 랜덤 믹스
8. 사용자는 자신이 좋아하는 가수 or 노래를 즐겨찾기에 등록해 단어 테스트 가능
   - 즐겨찾기 등록 시 해당하는 모든 vocabs 조회 후 랜덤으로 추출해 단어 테스트 진행
9. 틀린 단어 자동 저장 및 복습 기능
10. **PWA 지원**: PC와 모바일에 앱 형태로 설치 가능, 오프라인 캐싱 지원

### 기술 스택

- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Supabase)
- **AI**: LLM (가사 분석 및 vocab 추출)
- **PWA**: @ducanh2912/next-pwa (PC/모바일 앱 설치 지원)
- **Styling**: Tailwind CSS

---

## 데이터베이스 스키마

### 관리자 관리 데이터

#### artists (가수)
```sql
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- 일본어 이름
  name_en TEXT,                     -- 영어/로마자 이름
  name_ko TEXT,                     -- 한글 이름
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 퍼지 검색을 위한 trigram 인덱스
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);
CREATE INDEX idx_artists_name_en_trgm ON artists USING gin(name_en gin_trgm_ops);
CREATE INDEX idx_artists_name_ko_trgm ON artists USING gin(name_ko gin_trgm_ops);
```

#### albums (앨범)
```sql
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  release_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**특징:**
- 선택적 테이블 (나중에 추가 가능)
- LLM 처리 대상이 아니므로 필수값 아님
- 관리자가 수동으로 업데이트

#### songs (노래)
```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  vocabs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JSONB 검색 최적화를 위한 인덱스
CREATE INDEX idx_songs_vocabs_gin ON songs USING GIN (vocabs jsonb_path_ops);
```

**vocabs JSONB 구조:**
```json
[
  {
    "name": "愛",              // 일본어 단어
    "meaning": "사랑",         // 한국어 뜻
    "pronunciation": "ai"      // 영어 발음 (로마자)
  },
  {
    "name": "夢",
    "meaning": "꿈",
    "pronunciation": "yume"
  }
]
```

**확장 가능한 필드 (나중 추가 시):**
```json
{
  "name": "愛",
  "meaning": "사랑",
  "pronunciation": "ai",
  "partOfSpeech": "noun",        // 품사
  "difficulty": "beginner",      // 난이도
  "examples": ["愛してる"]       // 예문
}
```

### 사용자 데이터

#### favorites (즐겨찾기)
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  favoritable_type TEXT NOT NULL CHECK (favoritable_type IN ('artist', 'song')),
  favoritable_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, favoritable_type, favoritable_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_lookup ON favorites(user_id, favoritable_type, favoritable_id);
```

**favoritable_type 설명:**
- `'artist'`: 가수 단위 즐겨찾기 (해당 가수의 모든 노래)
- `'song'`: 개별 노래 단위 즐겨찾기
- 나중에 `'album'` 추가 가능

#### wrong_vocabs (틀린 단어 / 복습 노트)
```sql
CREATE TABLE wrong_vocabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  vocab_word TEXT NOT NULL,  -- 일본어 단어 (愛, 夢 등)
  wrong_count INTEGER DEFAULT 1,
  last_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id, vocab_word)
);

CREATE INDEX idx_wrong_vocabs_user ON wrong_vocabs(user_id);
CREATE INDEX idx_wrong_vocabs_lookup ON wrong_vocabs(user_id, song_id, vocab_word);
```

**특징:**
- 정답은 저장하지 않음 (데이터 최소화)
- 틀린 단어만 기록하여 "오답노트" 기능 제공
- `wrong_count`로 반복해서 틀린 단어 추적 가능

---

## 데이터 관리 구조

### 관리자 영역 (전역 데이터)
- artists
- albums (선택적)
- songs (lyrics, summary, vocabs)

**권한:** SELECT만 허용

### 사용자 영역 (개인 데이터)
- favorites
- wrong_vocabs

**권한:** 본인 데이터만 CRUD (Supabase RLS 활용)

---

## 주요 기능 플로우

### 1. 가사 데이터 처리 (관리자)

**2단계 검증 워크플로우 (비용 최적화):**

```
[1단계: 생성]
가사 텍스트 파일 입력
  ↓
소형 LLM (qwen3:14b via Ollama - 로컬 무료)
  - summary 생성 (분위기, 키워드, 테마)
  - vocabs 추출 (name, meaning, pronunciation)
  ↓
CSV 파일 출력

[2단계: 검증]
생성된 CSV 입력
  ↓
Claude Sonnet 4.5 API
  - 발음(romaji) 정확도 검증
  - 번역(meaning) 정확성 검증
  - 오류 자동 수정
  ↓
검증된 CSV 출력

[3단계: 저장]
검증된 데이터를 songs 테이블에 저장
  - artist_id, title (필수)
  - album_id (nullable)
  - summary (이모지 기반 구조화 포맷)
  - vocabs (JSONB 배열)
```

**비용 효율성:**
- 2단계 방식: ~$0.029/곡 (생성 $0 + 검증 $0.029)
- 1단계 방식: ~$0.037/곡 (Claude 직접 생성)
- **절감률: 22%**

**summary 구조화 포맷:**
```
이별 후의 아픔과 그리움을 안고 살아가는 과정을 그린 노래

🎭 분위기: 슬픔, 그리움, 희망, 위로

🔑 키워드: お別れ (이별), 痛み (아픔), 透明な彗星 (투명한 혜성)

📖 테마: 이별과 상실, 아픔과 치유, 추억과 그리움
```

### 2. 단어 테스트

**일반 테스트 모드:**
```
즐겨찾기된 가수/노래 선택
  ↓
해당하는 모든 vocabs 조회
  ↓
랜덤으로 10개 추출
  ↓
프론트엔드에서 퀴즈 진행
  ↓
틀린 단어만 서버로 전송
  ↓
wrong_vocabs 테이블에 UPSERT
  - 이미 있으면 wrong_count++, last_wrong_at 업데이트
  - 없으면 새로 INSERT
```

**복습 모드:**
```
wrong_vocabs에서 사용자의 틀린 단어 조회
  ↓
wrong_count 높은 순으로 정렬
  ↓
랜덤으로 10개 추출
  ↓
복습 테스트 진행
```

**테스트 화면 예시:**
```
문제: 愛
발음: ai
정답: [입력창]

또는

문제: 사랑
발음: ai
정답 선택: 
  ① 愛
  ② 恋
  ③ 好
  ④ 心
```

### 3. 검색 및 조회

**다국어 퍼지 검색 (pg_trgm 기반):**

```sql
-- 가수 퍼지 검색 (일본어, 영어, 한글 지원)
-- 예: "원오크록", "원 오크 록", "ONE OK ROCK" 모두 매칭
SELECT * FROM search_artists_fuzzy('검색어');

-- 내부 구현
SELECT
  a.*,
  GREATEST(
    similarity(a.name, '검색어'),
    similarity(a.name_en, '검색어'),
    similarity(a.name_ko, '검색어')
  ) as similarity_score
FROM artists a
WHERE
  a.name % '검색어' OR
  a.name_en % '검색어' OR
  a.name_ko % '검색어'
ORDER BY similarity_score DESC;
```

**특징:**
- 띄어쓰기 오류 허용
- 오타 자동 보정 (유사도 0.2 이상)
- 다국어 동시 검색
- 유사도 점수로 정렬

**특정 단어 포함 노래 검색:**
```sql
SELECT * FROM songs
WHERE vocabs @> '[{"name": "愛"}]';
```

---

## 기술적 고려사항

### 성능 최적화

1. **JSONB 인덱싱**
   - GIN 인덱스로 vocabs 검색 성능 확보
   - 대량의 vocab 데이터도 빠른 검색 가능

2. **pg_trgm 퍼지 검색**
   - GIN 인덱스로 trigram 기반 유사도 검색
   - 다국어 검색 성능 최적화
   - 오타/띄어쓰기 허용으로 UX 개선

3. **복합 정렬 RPC 함수**
   ```sql
   CREATE FUNCTION get_artists_sorted(p_limit INT)
   RETURNS TABLE (
     id UUID,
     name TEXT,
     favorite_count BIGINT,
     song_count BIGINT,
     ...
   )
   -- 정렬: 즐겨찾기 수 DESC → 등록일 ASC → 노래 수 DESC → 이름 ASC
   ```
   - 데이터베이스 레벨에서 집계 및 정렬
   - 애플리케이션 코드 변경 없이 정렬 로직 수정 가능
   - Fallback 메커니즘으로 안정성 확보

4. **즐겨찾기 조회 최적화**
   - 복합 인덱스 활용
   - 자주 조회되는 데이터이므로 캐싱 고려

5. **랜덤 추출 최적화**
   - PostgreSQL의 `TABLESAMPLE` 또는 `ORDER BY RANDOM()` 활용
   - 대량 데이터 시 성능 모니터링 필요

### LLM 처리

1. **비용 관리**
   - 캐싱 전략 (동일 가사 재처리 방지)
   - 배치 처리로 여러 가사 한 번에 처리

2. **처리 상태 관리**
   - songs 테이블에 `processing_status` 필드 추가 고려
   - (pending / processing / completed / failed)

3. **재시도 로직**
   - LLM API 실패 시 재처리 메커니즘

### Supabase 활용

1. **Row Level Security (RLS)**
   ```sql
   -- favorites 정책 예시
   CREATE POLICY "Users can only access their own favorites"
     ON favorites FOR ALL
     USING (auth.uid() = user_id);

   -- songs는 모두 조회 가능
   CREATE POLICY "Anyone can view songs"
     ON songs FOR SELECT
     USING (true);
   ```

2. **Real-time Subscriptions**
   - 즐겨찾기 추가/삭제 시 실시간 UI 업데이트

3. **하이브리드 인증 시스템**

   **공개 페이지 (로그인 불필요):**
   - 홈 페이지 (아티스트 목록)
   - 검색 페이지 (아티스트, 노래 검색)
   - 아티스트 상세 페이지
   - 노래 상세 페이지 (단어 목록 조회)

   **보호 페이지 (로그인 필수):**
   - 즐겨찾기 페이지 (`/favorites`)
   - 복습 페이지 (`/review`)
   - 단어 테스트 페이지 (`/test`)

   **구현 방법:**
   ```typescript
   // middleware.ts - 특정 경로만 보호
   const protectedPaths = ['/favorites', '/review', '/test']
   const isProtectedPath = protectedPaths.some(path =>
     request.nextUrl.pathname.startsWith(path)
   )

   if (isProtectedPath && !user) {
     return NextResponse.redirect(new URL('/login', request.url))
   }
   ```

   **클라이언트 컴포넌트 패턴:**
   ```typescript
   // 로그인 상태 확인 후 리디렉션
   const [isLoggedIn, setIsLoggedIn] = useState(true)

   useEffect(() => {
     const checkAuth = async () => {
       const supabase = createClient()
       const { data: { user } } = await supabase.auth.getUser()
       setIsLoggedIn(!!user)
     }
     checkAuth()
   }, [])

   const handleAction = () => {
     if (!isLoggedIn) {
       router.push('/login')
       return
     }
     // 실제 액션 수행
   }
   ```

### PWA 설정 (Progressive Web App)

1. **PWA 플러그인 설정**
   ```typescript
   // next.config.ts
   import withPWA from '@ducanh2912/next-pwa';

   export default withPWA({
     dest: 'public',
     disable: process.env.NODE_ENV === 'development',
     register: true,
   })(nextConfig);
   ```

2. **Web App Manifest**
   ```json
   // public/manifest.json
   {
     "name": "Utavoca - Japanese Vocabulary Learning",
     "short_name": "Utavoca",
     "description": "일본 노래로 배우는 일본어 단어",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#3b82f6",
     "icons": [
       {
         "src": "/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512x512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

3. **Layout 메타데이터**
   ```typescript
   // app/layout.tsx
   export const metadata: Metadata = {
     manifest: "/manifest.json",
     appleWebApp: {
       capable: true,
       statusBarStyle: "default",
       title: "Utavoca",
     },
   }
   ```

4. **Service Worker**
   - 자동 생성: `public/sw.js`, `public/workbox-*.js`
   - 오프라인 지원 및 캐싱 제공
   - 프로덕션 빌드 시에만 활성화

5. **설치 방법**
   - **PC (Chrome):** 주소창 우측 설치 아이콘 클릭
   - **Android:** 브라우저 메뉴 → "홈 화면에 추가"
   - **iOS:** 공유 버튼 → "홈 화면에 추가"

### UI/UX 가이드라인

1. **버튼 텍스트 일관성**
   - 버튼 이름은 로그인 상태와 무관하게 동일하게 유지
   - 로그인이 필요한 액션은 클릭 시 로그인 페이지로 리디렉션

   **좋은 예시:**
   ```typescript
   // FavoriteButton.tsx
   <button onClick={handleToggle}>
     <span>{isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}</span>
   </button>

   // 로그인 체크는 핸들러에서
   const handleToggle = () => {
     if (!isLoggedIn) {
       router.push('/login')
       return
     }
     // 즐겨찾기 토글
   }
   ```

   **나쁜 예시:**
   ```typescript
   // ❌ 로그인 상태에 따라 버튼 텍스트 변경
   <button>
     {isLoggedIn ? '즐겨찾기 추가' : '로그인하고 즐겨찾기 추가'}
   </button>
   ```

2. **네비게이션 일관성**
   - 모든 주요 페이지에서 동일한 네비게이션 UI 제공
   - 현재 페이지 하이라이트로 위치 표시
   - 로그인/로그아웃 버튼은 항상 동일한 위치에 표시

3. **공개/보호 기능 구분**
   - 공개 기능: 누구나 사용 가능 (검색, 조회)
   - 보호 기능: 로그인 필요 (즐겨찾기, 테스트, 복습)
   - 보호 기능 사용 시 자연스럽게 로그인 유도

---

## 저작권 고려사항

### 현재 설계의 안전성

✅ **상대적으로 안전:**
- 가사 전문을 게재하지 않음
- 개별 단어 + 정의 추출 (사실의 나열)
- 교육 목적의 fair use 주장 가능

⚠️ **주의할 점:**
- 가사 원문은 저장하지 않기
- 예문 추가 시 LLM이 생성한 것으로 대체
- "교육/개인 학습 목적"임을 명시

🚨 **상업적 이용 시:**
- 법률 검토 필수
- 음원사/출판사 라이선스 고려

---

## 향후 확장 가능성

### 단계별 기능 추가

**MVP (최소 기능):**
- ✅ 가수, 노래, vocabs 관리
- ✅ 즐겨찾기 (가수/노래 단위)
- ✅ 랜덤 단어 테스트 (3가지 모드: JP→KR, KR→JP, 랜덤)
- ✅ 틀린 단어 복습
- ✅ 다국어 퍼지 검색 (일본어, 영어, 한글)
- ✅ 하이브리드 인증 (공개 조회 + 회원 기능)
- ✅ PWA 지원 (PC/모바일 앱 설치)

**Phase 2:**
- 난이도별 학습 (beginner/intermediate/advanced)
- 품사별 필터링
- 학습 통계 대시보드
- 간격 반복 학습 (Spaced Repetition)

**Phase 3:**
- 앨범 단위 학습
- 예문 기반 문맥 학습
- 사용자 커뮤니티 (단어장 공유)
- 발음 듣기 기능 (TTS)

### 데이터 모델 확장

**현재 설계의 장점:**
- JSONB로 vocab 구조 확장 용이
- Polymorphic favorites로 다양한 즐겨찾기 타입 추가 가능
- 테이블 추가 시 기존 데이터 영향 없음

---

## 개발 체크리스트

### Backend (Supabase)
- [x] 데이터베이스 스키마 생성
- [x] RLS 정책 설정
- [x] 인덱스 최적화 (pg_trgm, JSONB GIN)
- [x] API 엔드포인트 설계
- [x] 하이브리드 인증 시스템 구현

### LLM 통합
- [x] 프롬프트 엔지니어링 (2단계 검증 워크플로우)
- [x] API 연동 (Claude Sonnet 4.5)
- [ ] 에러 핸들링 및 재시도 로직
- [ ] 배치 처리 구현

### Frontend (Next.js)
- [x] 가수/노래 검색 UI (다국어 퍼지 검색)
- [x] 즐겨찾기 관리 UI
- [x] 단어 테스트 화면 (3가지 모드)
- [x] 복습 모드 UI
- [x] 네비게이션 시스템
- [x] UI 일관성 가이드라인 적용
- [ ] 학습 통계 (선택)

### PWA (Progressive Web App)
- [x] PWA 플러그인 설정 (@ducanh2912/next-pwa)
- [x] Web App Manifest 작성
- [x] 앱 아이콘 생성 (192x192, 512x512)
- [x] Service Worker 자동 생성 설정
- [x] 메타데이터 설정 (iOS/Android 지원)

### 배포 및 인증
- [x] Vercel 배포 설정
- [x] 환경 변수 관리 (.env.example)
- [x] 미들웨어 기반 라우트 보호
- [x] 공개/보호 페이지 분리

### 관리자 기능
- [ ] 가사 업로드 인터페이스
- [ ] LLM 처리 트리거
- [ ] 앨범 정보 수동 입력

---

## 참고사항

### 중복 단어 처리 전략

**선택한 방식:** JSONB 배열 저장

**이유:**
- 구현이 간단하고 직관적
- 소규모 프로젝트에 적합
- PostgreSQL JSONB 성능 우수
- 나중에 정규화 전환 가능

**대안:** 별도 vocab 테이블 + 중간 테이블
- 전체 vocab 통계가 중요한 경우
- 단어별 학습 데이터 추적이 필요한 경우
- 프로젝트 규모가 커지면 고려

### 테스트 결과 저장 전략

**선택한 방식:** 틀린 단어만 저장

**이유:**
- 데이터 최소화 (정답 기록 불필요)
- 복습이 필요한 단어에 집중
- 스토리지 비용 절감

**대안:** 모든 테스트 결과 저장
- 상세한 학습 분석이 필요한 경우
- 정답률 추이 그래프 등
- 데이터 과학적 분석 목적

---

## 마무리

이 문서는 프로젝트의 기본 설계를 담고 있습니다. 개발 진행 중 새로운 요구사항이나 기술적 제약이 발생하면 유연하게 조정할 수 있도록 설계되었습니다.

**핵심 설계 원칙:**
1. 심플하게 시작, 필요시 확장
2. 데이터 최소화
3. 사용자 경험 중심
4. 성능과 비용 효율성 고려
