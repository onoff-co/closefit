# 프론트엔드 구조

GitHub Pages에 배포하는 정적 React 쇼핑몰 포트폴리오입니다.

- index.html: Vite HTML 진입점
- src/main.jsx: React createRoot, HashRouter, StoreProvider
- src/App.jsx: 라우팅·레이아웃·페이지 이동 포커스/스크롤
- src/components/: 헤더·푸터·상품 카드/이미지·데모 안내·로그아웃
- src/pages/home/: 메인
- src/pages/shop/: 상품 목록·검색·정렬·상세
- src/pages/auth/: 고객/관리자 체험 로그인·가상 회원가입
- src/pages/account/: 내 프로필·주문 내역
- src/pages/wishlist/: 찜
- src/pages/cart/: 장바구니
- src/pages/checkout/: 결제 수단 선택·가상 결제·완료 내역
- src/pages/admin/: 관리자 통계·표·CRUD 폼
- src/state/StoreContext.jsx: 사용자·상품·찜·장바구니·모달 상태
- src/hooks/useCheckout.js: 결제 화면 진입·로그인 복귀
- src/lib/api.js: 브라우저 목업 요청의 공통 진입점
- src/lib/assets.js: 배포 base를 적용하는 이미지 경로
- src/demo/seed.js: 예시 상품·회원·주문·방문 기록
- src/demo/api.js: localStorage·가상 세션·CRUD·결제 처리
- src/styles/: 공통·페이지·쇼핑 흐름 CSS
- public/assets/: 제공 로고·생성 이미지·출처 목록
- .github/workflows/pages.yml: 테스트·감사·빌드·Pages 배포
- tests/react/: React·목업 세션·관리 CRUD·가상 결제 검증

페이지는 request('/api/...') 계약을 사용하지만 fetch나 서버 요청을 보내지 않습니다. demoRequest가 브라우저 저장소에서 처리합니다. 결제 금액은 예시 상품 가격에서 계산하고 한 결제 식별자에 대해 주문을 한 번만 생성합니다.

worker/와 drizzle/는 이전 백엔드 참고 코드입니다. scripts/dev-api.mjs 및 scripts/build.mjs도 이전 로컬/Worker 배포용 참고 코드이며 현재 npm run dev/build에서 사용하지 않습니다. Pages에는 dist/client의 정적 결과물만 배포합니다.

컴포넌트는 PascalCase.jsx, 훅은 useName.js를 사용합니다. 공개 저장소 초기 커밋에는 기존 비공개 배포 설정·실제 로컬 DB·과거 다운로드 이미지 이력을 포함하지 않습니다.

## 로컬 SQL 모드

src/pages/auth/AuthPage.jsx가 데이터 모드를 전달합니다. LoginPage.jsx, SignupPage.jsx, AuthLayout.jsx는 로컬과 공개 화면에서 공유합니다. SocialLoginButtons.jsx는 소셜 버튼과 준비 중/체험 안내를 담당하고 src/demo/auth.js는 비밀번호를 저장하지 않는 공개 체험 계정을 관리합니다. src/lib/http-api.js와 server/가 실제 MySQL 연결을 담당합니다. 상세는 [MYSQL-LOCAL.md](MYSQL-LOCAL.md)를 참고하세요.
