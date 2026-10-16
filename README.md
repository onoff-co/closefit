# 클로즈핏 (CLOSEFIT)

남성 의류 쇼핑몰 포트폴리오입니다. React UI에서 로그인·로그아웃·가입·상품/회원/주문 관리·결제 과정을 목업 데이터로 체험할 수 있습니다.

- 사이트: https://onoff-co.github.io/closefit/
- 저장소: https://github.com/onoff-co/closefit
- 실제 가입, 인증, 청구, 배송은 발생하지 않습니다.
- 고객/관리자 로그인은 체험용 역할 전환입니다.

## 실행

Node.js 24 이상에서 실행합니다.

    npm ci
    npm run dev

기본 개발 주소는 http://127.0.0.1:5173 입니다. 사용 중인 포트를 피하려면 npm run dev -- --port 5181 로 실행합니다. JSX/CSS 수정은 Vite HMR로 반영됩니다.

    npm test
    npm run build
    npm run check
    npm run preview

React 19, React Router 8, Vite 8, JavaScript(JSX), CSS, Context/Hooks를 사용합니다.

## 체험 방법

1. 로그인 화면에서 고객 계정 또는 관리자 계정을 선택합니다.
2. 회원가입 화면에서 예시 닉네임을 입력하면 가상 회원이 생성됩니다. 이메일은 example.test 주소로 자동 생성합니다.
3. 상품을 찜하거나 장바구니에 담고 결제하기를 누릅니다.
4. 카드/계좌이체 중 예시 수단을 선택하고 가상 결제를 완료합니다.
5. 마이페이지 주문 내역과 관리자 주문/매출에서 결과를 확인합니다.
6. 관리자에서 상품 등록·수정·판매 중지, 주문 등록·상태 변경·취소 후 삭제, 회원 수정·삭제를 체험합니다.
7. 푸터의 데모 초기화로 처음 상태로 되돌립니다.

초기 상품 9개, 회원 3명, 주문 6건과 방문 기록을 제공합니다. 데이터·세션은 현재 브라우저 localStorage에만 저장합니다. 다른 방문자와 공유하지 않으며 비밀번호·카드번호·주소를 요구하지 않습니다. 브라우저 저장을 차단하면 현재 탭의 메모리로 체험하며 새로고침 시 유지되지 않을 수 있습니다.

## GitHub Pages

main에 push하면 .github/workflows/pages.yml에서 설치 → 테스트 → 의존성 검사 → 정적 빌드 → Pages 배포를 실행합니다. Pages 배포 방식은 GitHub Actions입니다.

하위 경로 /closefit/와 HashRouter를 사용하므로 상세 페이지는 /closefit/#/product/8 형태입니다. URL의 해시는 정적 호스팅에서 새로고침/직접 접근을 지원합니다.

로컬에서 배포 경로를 재현할 때 CLOSEFIT_BASE_PATH=/closefit/ 환경 변수를 설정하고 npm run build, npm run check를 실행합니다. 배포 산출물은 dist/client입니다.

## 코드 구조

- src/demo/seed.js: 초기 예시 데이터
- src/demo/api.js: 브라우저 API 어댑터, 세션·CRUD·가상 결제·초기화
- src/lib/api.js: 공통 요청 진입점
- src/lib/assets.js: 정적 자산의 배포 base 경로
- src/pages/: 상품·회원·장바구니·결제·관리자 페이지
- src/state/StoreContext.jsx: React 공통 상태
- public/assets/: 사용자 제공 로고와 AI 생성 이미지
- tests/react/: 목업과 React 상호작용 테스트
- worker/, drizzle/, tests/api.test.mjs: 이전 서버 API/DB의 참고 구현과 회귀 테스트. Pages에서는 실행하지 않습니다.

이전 서버 API나 D1 데이터베이스 없이 독립 실행합니다. 자세한 구조는 [docs/FRONTEND-STRUCTURE.md](docs/FRONTEND-STRUCTURE.md), 데모 범위는 [docs/PORTFOLIO-DEMO.md](docs/PORTFOLIO-DEMO.md)에 있습니다.

이미지는 사용자 제공 로고와 AI 생성 파일만 사용합니다. 출처는 public/assets/image-provenance.json 및 docs/IMAGE-PROVENANCE.md에 기록합니다. 360° 스튜디오는 준비 중입니다.

테스트와 정적 산출물/HTTP 검증을 수행합니다. 연결된 브라우저가 없어 실제 화면의 시각 검증은 별도로 필요합니다.

## DB CRUD diagram

[Product, member and order CRUD nodes and database relationships](docs/DB-CRUD-DIAGRAM.md).
