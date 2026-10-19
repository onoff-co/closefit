# 포트폴리오 목업 API 계약

현재 src/lib/api.js의 request는 src/demo/api.js의 브라우저 어댑터를 호출합니다. HTTP 요청이나 운영 데이터베이스 연결을 수행하지 않습니다. /api 경로는 화면과 목업 사이의 인터페이스입니다. 오류는 status가 포함된 Error입니다.

| 경로 | 메서드 | 기능 |
|---|---|---|
| /api/me | GET | 현재 체험 세션·프로필·관리자 역할 |
| /api/demo/login | POST | role: customer 또는 admin 체험 로그인 |
| /api/demo/logout | POST | 체험 세션 종료 |
| /api/profile | POST | name, consent:true로 예시 프로필 생성/수정 |
| /api/products | GET | 판매 중 예시 상품 |
| /api/orders | GET | 현재 체험 회원의 주문 |
| /api/orders | POST | items, method:card/transfer, paymentId로 가상 결제 |
| /api/visits | POST | 현재 브라우저의 체험 방문 기록 |
| /api/admin/dashboard | GET | 예시 매출·주문·회원·방문 집계 |
| /api/admin/products | GET, POST | 상품 조회·등록 |
| /api/admin/products/:id | PATCH, DELETE | 상품 수정·판매 중지 |
| /api/admin/orders | GET, POST | 주문 조회·수기 등록 |
| /api/admin/orders/:id | PATCH, DELETE | 상태/메모 수정·취소 주문 삭제 |
| /api/admin/members | GET | 회원 조회 |
| /api/admin/members/:id | PATCH, DELETE | 이름 수정·프로필 삭제 |
| /api/admin/visits | GET | 예시 및 체험 방문 기록 |
| /api/admin/audit | GET | 관리 변경 이력 |

주문 상태는 pending, paid, shipping, completed, cancelled입니다. 가상 결제는 paid 주문을 생성합니다. paid/shipping/completed만 예시 매출에 포함합니다. 가격은 현재 목업 상품에서 계산하며 재고를 차감합니다. 동일 paymentId 재요청은 기존 주문을 반환합니다.

관리자 역할 검사는 체험 흐름을 보여주기 위한 UI 동작입니다. 보안 인증 기능이 아니며 실제 사용자 정보나 결제 정보에 사용하면 안 됩니다. 기존 worker/index.mjs의 서버 API와 현재 정적 데모 API는 별개입니다.

## 로컬 MySQL API

npm run dev:local에서는 브라우저 어댑터 대신 실제 HTTP/MySQL API를 사용합니다. 아이디 로그인·가입·세션과 SQL CRUD 계약은 [docs/MYSQL-LOCAL.md](docs/MYSQL-LOCAL.md)에 별도로 기록했습니다. 공개 정적 데모의 계약은 유지됩니다.
