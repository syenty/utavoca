# PWA (Progressive Web App) 설정 가이드

Utavoca 프로젝트를 웹 브라우저에서 접속 가능한 앱으로 만들기 위한 PWA 설정 문서입니다.

## 설정 날짜
2026-02-07

## PWA란?

Progressive Web App은 웹 기술로 만들어졌지만 네이티브 앱처럼 사용할 수 있는 애플리케이션입니다.

**장점:**
- 브라우저에서 "홈 화면에 추가" → 독립된 앱으로 실행
- 브라우저 UI 없이 깔끔한 화면
- PC와 모바일 모두 지원
- 오프라인 지원 가능
- 앱스토어 없이 배포 가능

## 설치된 패키지

```bash
npm install @ducanh2912/next-pwa
```

**선택 이유:**
- Next.js 15 App Router 공식 지원
- 원조 `next-pwa`는 Next.js 13 이하만 지원
- 활발히 유지보수 중

## 프로젝트 구조

```
utavoca/
├── public/
│   ├── manifest.json          # PWA 메타데이터
│   ├── icon-192x192.png       # 앱 아이콘 (작은 크기)
│   └── icon-512x512.png       # 앱 아이콘 (큰 크기)
├── app/
│   └── layout.tsx             # PWA 메타 태그 추가
├── next.config.ts             # PWA 플러그인 설정
└── logo.png                   # 원본 로고 (아이콘 생성용)
```

## 설정 파일

### 1. next.config.ts

```typescript
import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA({
  dest: 'public',                              // 서비스 워커 파일 생성 위치
  disable: process.env.NODE_ENV === 'development',  // 개발 모드에서는 비활성화
  register: true,                              // 자동으로 서비스 워커 등록
})(nextConfig);
```

**옵션 설명:**
- `dest`: 생성된 서비스 워커 파일 위치 (sw.js, workbox-*.js)
- `disable`: 개발 환경에서는 PWA 비활성화 (빠른 개발)
- `register`: 자동으로 서비스 워커 등록

### 2. public/manifest.json

```json
{
  "name": "Utavoca - Japanese Vocabulary Learning",
  "short_name": "Utavoca",
  "description": "Learn Japanese vocabulary through your favorite songs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**필드 설명:**
- `name`: 설치 시 표시되는 전체 이름
- `short_name`: 홈 화면 아이콘 아래 표시될 짧은 이름
- `description`: 앱 설명
- `start_url`: 앱 실행 시 시작 URL
- `display: "standalone"`: 브라우저 UI 없이 독립 실행
- `background_color`: 스플래시 화면 배경색
- `theme_color`: 상단 상태바 색상 (#3b82f6 = Tailwind indigo-600)
- `orientation`: 화면 방향 (portrait-primary = 세로 고정)
- `icons`: 앱 아이콘 목록 (192x192, 512x512 필수)
- `purpose: "any maskable"`: 다양한 디바이스에서 사용 가능

### 3. app/layout.tsx

```typescript
export const metadata: Metadata = {
  title: "Utavoca - Japanese Vocabulary Learning",
  description: "Learn Japanese vocabulary through your favorite songs",
  manifest: "/manifest.json",  // manifest.json 연결
  appleWebApp: {
    capable: true,             // iOS에서 웹 앱으로 실행 가능
    statusBarStyle: "default", // iOS 상태바 스타일
    title: "Utavoca",          // iOS 홈 화면 제목
  },
  formatDetection: {
    telephone: false,          // 전화번호 자동 링크 비활성화
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </body>
    </html>
  );
}
```

**메타 태그 설명:**
- `manifest`: manifest.json 파일 경로
- `appleWebApp`: iOS Safari 전용 설정
- `theme-color`: Android Chrome 주소창 색상
- `viewport`: 모바일 최적화 (확대 제한)

### 4. 앱 아이콘 생성

**원본 파일:**
- `logo.png` (루트 디렉토리)

**생성된 아이콘:**
- `public/icon-192x192.png` (192x192 픽셀)
- `public/icon-512x512.png` (512x512 픽셀)

**생성 명령어 (macOS):**
```bash
sips -z 192 192 logo.png --out public/icon-192x192.png
sips -z 512 512 logo.png --out public/icon-512x512.png
```

**다른 방법:**
- 온라인 도구: https://www.pwabuilder.com/imageGenerator
- 이미지 편집 프로그램으로 직접 리사이즈

## 빌드 및 배포

### 개발 환경

```bash
npm run dev
# PWA 기능은 비활성화됨 (disable: true)
```

### 프로덕션 빌드

```bash
npm run build
npm start
```

빌드 시 자동 생성되는 파일:
- `public/sw.js` - 서비스 워커
- `public/workbox-*.js` - Workbox 런타임

### Vercel 배포

1. GitHub에 push
2. Vercel에서 프로젝트 import
3. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy 클릭

배포 후 자동으로 PWA 기능 활성화됩니다.

## 사용 방법

### PC (Chrome/Edge)

1. 배포된 URL 접속 (예: `https://utavoca.vercel.app`)
2. 주소창 오른쪽 **설치 아이콘** 클릭
3. "설치" 버튼 클릭
4. 앱이 독립된 창으로 열림

**실행:**
- Windows: 시작 메뉴에서 "Utavoca" 검색
- Mac: Applications 폴더 또는 Spotlight 검색

### 스마트폰 (iOS)

1. Safari에서 배포 URL 접속
2. 하단 공유 버튼 (⬆️) 탭
3. "홈 화면에 추가" 선택
4. "추가" 탭

**실행:**
- 홈 화면의 Utavoca 아이콘 탭

### 스마트폰 (Android)

1. Chrome에서 배포 URL 접속
2. 우측 상단 메뉴 (⋮) 탭
3. "홈 화면에 추가" 또는 "앱 설치" 선택
4. "설치" 탭

**실행:**
- 앱 서랍에서 Utavoca 앱 실행

## 설치 확인

PWA가 제대로 설치되었는지 확인하는 방법:

### Chrome DevTools

1. F12 → Application 탭
2. **Manifest**: manifest.json 내용 확인
3. **Service Workers**: 등록된 서비스 워커 확인
4. **Storage**: 캐시 저장소 확인

### Lighthouse

1. F12 → Lighthouse 탭
2. "Progressive Web App" 체크
3. "Analyze page load" 클릭
4. PWA 점수 확인 (90점 이상이 목표)

## 트러블슈팅

### 설치 버튼이 안 보여요

**원인:**
- HTTPS가 아닌 경우 (localhost 제외)
- manifest.json 오류
- 아이콘 파일 누락

**해결:**
1. HTTPS로 배포 확인 (Vercel은 자동 HTTPS)
2. DevTools → Console에서 에러 확인
3. manifest.json 유효성 검사

### 앱 아이콘이 안 나와요

**원인:**
- 아이콘 파일 경로 오류
- 아이콘 크기 불일치

**해결:**
```bash
# public/ 폴더에 아이콘 파일 확인
ls -lh public/icon-*.png

# 아이콘 크기 확인
sips -g pixelWidth -g pixelHeight public/icon-192x192.png
```

### 캐시 문제로 업데이트가 안 돼요

**해결:**
```bash
# 브라우저에서
1. F12 → Application → Service Workers
2. "Unregister" 클릭
3. "Clear storage" → "Clear site data"
4. 페이지 새로고침
```

## 고급 기능 (향후 추가 가능)

### 오프라인 지원

서비스 워커에 캐싱 전략 추가:
```typescript
// next.config.ts
export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // 캐싱 전략 설정 (필요시)
  runtimeCaching: [...],
})(nextConfig);
```

### 푸시 알림

Web Push API를 사용한 푸시 알림:
- 서비스 워커에 push 이벤트 리스너 추가
- 백엔드에서 푸시 알림 전송

### 앱 업데이트 알림

새 버전 배포 시 사용자에게 알림:
```typescript
// 서비스 워커 업데이트 감지
navigator.serviceWorker.register('/sw.js').then(registration => {
  registration.addEventListener('updatefound', () => {
    // 새 버전 알림 표시
  });
});
```

## 참고 자료

- [@ducanh2912/next-pwa GitHub](https://github.com/DuCanhGH/next-pwa)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)

## 요약

Utavoca는 이제 다음과 같이 사용할 수 있습니다:

✅ **웹 브라우저**: 어디서든 URL로 접속
✅ **PC 앱**: Chrome/Edge에서 설치, 독립 실행
✅ **모바일 앱**: iOS/Android 홈 화면에 추가
✅ **자동 배포**: Vercel을 통한 간편한 배포

앱스토어 등록 없이도 모든 플랫폼에서 앱처럼 사용 가능합니다!
