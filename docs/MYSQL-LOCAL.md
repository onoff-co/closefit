# 로컬 MySQL 로그인·CRUD

로컬 React 앱은 Node API를 통해 MySQL에 연결합니다. 브라우저에 DB 계정이나 비밀번호를 전달하지 않습니다. GitHub Pages에서는 정적 목업이 동작합니다.

## 실행

Node.js 24 이상과 MySQL 8 이상이 필요합니다.

1. npm ci
2. config/mysql.example.env를 프로젝트 루트의 .env.local로 복사합니다. 이미 파일이 있으면 덮어쓰지 않습니다.
3. DB_USER와 DB_PASSWORD에 MySQL 접속 계정을 입력합니다. 웹 관리자 로그인 계정과는 별개입니다.
4. ADMIN_USERNAME과 ADMIN_PASSWORD에 생성할 웹 관리자 계정을 설정합니다.
5. npm run db:setup
6. npm run dev:local
7. http://127.0.0.1:5173/#/login

포트가 사용 중이면 npm run dev:local -- --port 5181 --api-port 3002로 실행합니다. API는 기본 127.0.0.1:3001이며 Vite가 /api 요청을 프록시합니다.

npm run dev는 공개 사이트와 같은 브라우저 목업입니다. npm run dev:local은 실제 로컬 MySQL 계정 로그인·가입·CRUD를 사용합니다. npm run api:start는 API만 실행합니다.

기본 DB 이름은 closefit_local입니다. 초기 상품과 관리자는 처음 생성할 때만 삽입하며 기존 상품 수정 내역·계정 비밀번호를 덮어쓰지 않습니다. 기존 MySQL 서비스의 설정이나 계정은 변경하지 않습니다.

.env.local은 Git에서 제외됩니다. 비밀번호는 프론트 소스·README·배포 산출물에 넣지 않습니다. VITE_ 접두사 환경 변수에는 DB 비밀번호를 입력하면 안 됩니다.

## 폴더 구조

- server/config.mjs: Git 제외 환경 설정 로딩
- server/db/schema.sql: MySQL 관계형 스키마
- server/db/database.mjs: 연결 풀, 스키마 초기화, 예시 상품, 초기 관리자
- server/passwords.mjs: salt를 사용하는 scrypt 해시와 검증
- server/auth.mjs: 아이디 로그인, 세션 생성·조회·로그아웃
- server/app.mjs: HTTP·Origin 검사·권한·라우팅·오류 응답
- server/modules/products.mjs: 상품 CRUD
- server/modules/members.mjs: 회원 CRUD
- server/modules/orders.mjs: 주문 CRUD·가상 결제 트랜잭션
- scripts/setup-mysql.mjs: DB 준비
- scripts/dev-local.mjs: API + Vite 실행
- src/lib/http-api.js: 로컬 HTTP 요청
- src/pages/auth/LoginPage.jsx: 아이디·비밀번호 로그인
- src/pages/auth/SignupPage.jsx: 회원가입·본인 프로필
- src/pages/auth/AuthLayout.jsx: 공통 회원 화면
- src/pages/auth/SocialLoginButtons.jsx: 소셜 버튼 (공개에서는 모의 로그인, 로컬에서는 준비 중 안내)
- src/demo/auth.js: GitHub Pages의 ID/PW·가입·소셜 체험 (입력한 비밀번호를 저장하지 않음)

## API

| 경로 | 메서드 | 권한·처리 |
|---|---|---|
| /api/auth/register | POST | 아이디·닉네임·이메일·비밀번호·동의, 고객 역할로만 생성 |
| /api/auth/login | POST | 아이디·비밀번호 확인 후 세션 생성 |
| /api/auth/logout | POST | 세션 폐기 |
| /api/me | GET | 현재 계정·프로필·관리자 여부 |
| /api/profile | POST | 본인 이름·이메일 수정 |
| /api/products | GET | 판매 중 상품 |
| /api/orders | GET, POST | 본인 주문 조회·가상 결제 |
| /api/admin/products | GET, POST | 관리자 상품 조회·등록 |
| /api/admin/products/:id | GET, PATCH, DELETE | 조회·부분 수정·판매 중지 |
| /api/admin/members | GET, POST | 관리자 회원 조회·고객 계정 생성 |
| /api/admin/members/:id | GET, PATCH, DELETE | 조회·이름/이메일 수정·프로필 삭제 |
| /api/admin/orders | GET, POST | 관리자 주문 조회·수기 등록 |
| /api/admin/orders/:id | GET, PATCH, DELETE | 조회·상태/메모 수정·취소 주문 삭제 |
| /api/admin/dashboard | GET | SQL 주문·매출·회원·방문 집계 |
| /api/admin/visits, /api/admin/audit | GET | 방문·변경 이력 |
| /api/health | GET | DB 연결 확인 |

에러 응답은 error 문자열과 HTTP 4xx/5xx입니다. 쓰기 요청은 정확한 로컬 Origin과 JSON을 요구합니다. curl 등으로 테스트할 때도 Origin을 지정합니다.

## DB와 인증 규칙

- members: id, username, email, name, password_hash, role, created_at
- products: 상품 정보·정수 가격·재고·판매 상태
- orders: 회원 연결, 주문 당시 주문자 정보, 금액·상태
- order_items: 주문 상품·가격·옵션·수량 사본
- sessions: 무작위 토큰의 해시와 만료 시각
- payment_keys: 회원별 결제 식별자, 중복 주문 방지
- audit_logs: 관리자·주문 변경 이력
- visits: 익명 페이지 방문

아이디·이메일은 DB UNIQUE 제약으로 중복을 방지합니다. 회원가입은 관리자 역할을 지정할 수 없습니다. 관리자 여부는 세션으로 조회한 DB role에서 판단하며 클라이언트 헤더를 신뢰하지 않습니다.

비밀번호는 scrypt(N=131072,r=8,p=1)로 해시하며 평문을 저장하지 않습니다. 세션 쿠키는 HttpOnly·SameSite=Strict·8시간 만료를 사용합니다. 로컬 HTTP 개발용이므로 Secure 속성은 사용하지 않으며 서버는 loopback에만 바인딩합니다. 공개 서버 운영 시 HTTPS와 Secure 쿠키 등 운영 구성이 필요합니다.

상품 삭제는 판매 중지입니다. 회원 삭제 시 세션을 제거하고 주문의 회원 연결만 해제해 주문 내역을 보존합니다. 관리자 계정은 삭제할 수 없습니다. 취소 주문만 삭제할 수 있으며 주문 상태 변경은 재고를 자동 복원하지 않습니다.

가상 결제는 서버 상품 가격으로 계산하고, 회원·상품 행 잠금과 트랜잭션 안에서 주문·상세·재고·결제 식별자를 저장합니다. 같은 식별자의 요청은 기존 주문을 반환합니다. 실제 PG 결제·입금·배송은 연동하지 않습니다.

푸터의 로컬 초기화는 찜·장바구니만 지우며 MySQL 회원·상품·주문은 삭제하지 않습니다.

## 검증

- npm test: 기존 목업 회귀·인증 해시·입력 검증·React 폼
- npm run test:mysql: 실제 MySQL 통합 테스트
- npm run build && npm run check: GitHub Pages 정적 산출물

통합 테스트는 closefit_test_ 접두사의 임시 DB를 생성·삭제합니다. 실제 closefit_local DB와 분리하며 DB 생성 권한이 필요합니다. CI의 MySQL 서비스는 테스트용 계정만 사용합니다.
