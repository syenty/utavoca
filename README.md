<div align="center">
  <img src="./logo.png" alt="Utavoca Logo" width="200"/>

  # 🎵 Utavoca

  **좋아하는 일본 노래로 일본어 단어를 배워보세요**

  일본 노래 가사에서 추출한 단어들로 재미있게 일본어를 학습할 수 있는 웹 앱입니다.

  [![Demo](https://img.shields.io/badge/Demo-Live-success?style=for-the-badge)](https://utavoca.vercel.app/)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

</div>

---

## ✨ 주요 기능

- **🔍 스마트 검색**: 일본어, 영어, 한글로 아티스트와 노래 검색 (오타 허용)
- **⭐ 즐겨찾기**: 좋아하는 아티스트와 노래를 저장
- **✏️ 단어 테스트**: 3가지 모드로 단어 학습 (일→한, 한→일, 랜덤)
- **📝 복습 노트**: 틀린 단어를 자동 저장하고 반복 학습
- **📱 PWA 지원**: PC와 모바일에 앱으로 설치 가능

## 🚀 Demo

🔗 **[Utavoca 바로가기](https://utavoca.vercel.app/)**

> 이메일/비밀번호로 로그인하세요 (회원가입은 관리자 초대제)

## 💻 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **PWA**: @ducanh2912/next-pwa

## 🎯 사용 방법

### 1. 검색
원하는 아티스트나 노래를 검색하세요. 한글, 영어, 일본어 모두 가능합니다.

### 2. 즐겨찾기
마음에 드는 아티스트나 노래를 ⭐ 버튼으로 즐겨찾기에 추가하세요.

### 3. 단어 학습
노래 상세 페이지에서 "단어 테스트 시작" 버튼을 클릭하세요.
- **일본어 → 한글**: 일본어 단어를 보고 한글 뜻 맞히기
- **한글 → 일본어**: 한글 뜻을 보고 일본어 단어 맞히기
- **랜덤**: 두 모드를 섞어서 출제

### 4. 복습
틀린 단어는 자동으로 저장됩니다. "복습 노트"에서 다시 학습하세요.

## 📱 앱으로 설치하기

### PC (Chrome/Edge)
1. 웹사이트 접속
2. 주소창 오른쪽 **설치** 아이콘 클릭
3. 독립된 앱으로 실행

### 모바일 (iOS)
1. Safari에서 접속
2. 공유 버튼 → "홈 화면에 추가"
3. 앱처럼 사용

### 모바일 (Android)
1. Chrome에서 접속
2. 메뉴 → "홈 화면에 추가"
3. 앱처럼 사용

## 🛠️ 로컬 개발

```bash
# 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에 Supabase 키 입력

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 환경 변수

`.env.local` 파일에 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📚 문서

프로젝트에 대한 자세한 내용은 다음 문서를 참고하세요:

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - 상세 개발 가이드 및 프로젝트 구조
- **[CLAUDE.md](./CLAUDE.md)** - AI 코딩 어시스턴트용 프로젝트 가이드
- **[PWA_SETUP.md](./PWA_SETUP.md)** - PWA 설정 가이드
- **[BUILD_FIXES.md](./BUILD_FIXES.md)** - 빌드 에러 해결 기록

## 🎨 주요 특징

### 지능적인 검색
pg_trgm 기반 퍼지 검색으로 오타나 띄어쓰기를 허용합니다.
- "원오크록" → "ONE OK ROCK" 찾기 ✅
- "후지이" → "Fujii Kaze" 찾기 ✅

### 데이터 품질
LLM을 활용한 2단계 검증 프로세스:
1. 소형 모델(qwen3:14b)로 단어 추출
2. 대형 모델(Claude Sonnet 4.5)로 검증 및 교정
3. 비용 효율적인 품질 관리 (22% 비용 절감)

### 보안
Row Level Security (RLS)로 사용자별 데이터 자동 격리

## 📝 라이선스

이 프로젝트는 개인 학습 프로젝트입니다.

## 🤝 기여

현재는 개인 프로젝트로 운영 중입니다. 버그 제보나 제안사항은 Issues에 남겨주세요.

---

Made with ❤️ for Japanese learners
