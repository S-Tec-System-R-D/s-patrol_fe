# 039-deployments spec

> 위험도: **A** (`screens.md` §1-4A — 요청 목록·승인·거부가 A. 데이터 변형 + 다른 사업장 근무자 소속이 바뀐다)
> 관련 화면: 배치관리 `/deployments` (대시보드형 — KPI + 요청 목록 + 전출/전입 이력)
> Phase: `roadmap.md` Phase 4 — 번호는 맨 뒤(039)
> 목업: `docs/ui-mock/현장/배치관리/배치관리-신규.png` — 현재 화면과 같다. **구조는 유지한다**(사용자 결정 ②)

---

## 🔴 전제 — API 가 없다. 프론트가 먼저 만든다

- 실서버 swagger **44종 재대조(2026-10-21) — 배치 관련 0건**. `api-spec.md` §6-5 "백엔드 미개발".
- 🔴 **사용자 결정(2026-10-21)**: 백엔드는 화면이 나오면 맞춰 만들 계획이었다 → **프론트가 화면을 먼저
  구현하고 필요한 API 를 요청한다.** 요청서: [`docs/api-request-deployment.md`](../../../docs/api-request-deployment.md)
  (사용자 요청대로 **"API 이름 — 한 줄 설명" 목록**).
- 그래서 본 spec 의 **요청·응답 타입은 가정**이다(§2-1). 기존 API 관례(래퍼 · `PagedData` · `~Seq` ·
  정수 코드 + 이름 · 변경계 `data: true`)를 따라 **가장 그럴듯한 모양**으로 두고, 백엔드가 구현하면
  **WF-1-0 실측으로 차이만 맞춘다.** 🔴 가정이 코드 곳곳에 퍼지지 않게 **타입 파일 1곳 + 어댑터 없이**
  둔다 — 바뀌면 그 파일과 MSW 만 고친다.

> **WF-1-0 — 실측 불가(API 없음).** 변경계(승인·거부)는 **"미실측 가정"** 으로 명시한다
> (`workflow-protocol.md` §1 "실측할 수 없으면"). 가정은 §2-1 표와 Open Questions 에 있다.

---

## 0. Carry-over

### 직전 spec(`038-workers`) `## 다음 spec으로 이월` 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| ③ 배치 변경 이력 → 배치관리 | 🔴 **받는다** — 요청서 6번(근무자별 배치 이력). 근무자 상세에 붙이는 것은 **API 가 나온 뒤**(가정 타입으로 근무자 상세까지 넓히지 않는다 — 범위 A3) |
| ③ 원소속 = 배치 온 사람의 소속지 | 참고 — "배치 온 인원" 의 **현재 유일한 실데이터 근거**다. ⚠️ 본 spec 은 요약 API(가정)를 쓰고 `UserList` 를 섞지 않는다(근거가 두 갈래면 숫자가 어긋날 때 어느 쪽이 맞는지 모른다) |
| ① B-41 ② · ② 근무자 변경계 · ④ 실서버 확인 | **범위 외** — 근무자 전용 |

### 리디자인(`014-deployments`) 이 남긴 것

- `deploymentStore`(zustand) + `deploymentData.ts` mock — 🔴 **react-query + MSW 로 옮긴다**(다른 화면과 같은 데이터 경로).
  ⚠️ **사이드바 대기 뱃지**(`sidebar.config.ts`·`RailSidebar.tsx`)가 store 를 직접 읽는다 — 함께 옮긴다.
- 부제가 `useMe().locationName` — **JWT 에 없어 한 번도 나온 적이 없다**(038 에서 같은 결함 발견) → 선택 사업장.

---

## User Stories

- **US1.** 현장관리자가 `/deployments` 에서 **배치 현황 3종**(나간·온·대기)을 본다. 사이드바에도 대기 건수가 뜬다.
- **US2.** 현장관리자가 대기 중 요청을 보고 **승인**하거나 **사유를 적어 거부**한다. 처리하면 목록·KPI·이력·사이드바 뱃지가 함께 갱신된다.
- **US3.** 현장관리자가 **전출 이력 / 전입 이력** 탭으로 배치 기록을 본다. 탭·페이지는 URL 에 남는다.

---

## 1. 목적

배치(파견·복귀)는 근무자가 앱에서 요청하고 **목적지 사업장 관리자가 승인**하는 흐름이다. 이 화면은
그 승인 창구이자 사업장 인력 이동의 기록이다. 지금은 zustand mock 위에 있고 API 가 없다 — 본 spec 은
**화면을 react-query + MSW 위로 옮기면서 그 과정에서 필요한 API 를 확정해 백엔드에 넘긴다.** 구조
(대시보드형)는 유지하고 세부를 다른 화면 규약(상태 분기 · 서버 페이징 · URL 상태)에 맞춘다.

---

## 2. I/O

### 2-1. 🔴 가정 계약 (요청서 1~5·7 번 — 백엔드 구현 후 WF-1-0 으로 교정)

경로 접두사 `/api/v1/Deployment/W/sign/` (기존 도메인 관례). 이름은 **가정**이다.

| # | 가정 엔드포인트 | 요청 | 응답 `data` |
|:-:|---|---|---|
| 1 | `GET GetDeploymentRequestList` | `siteSeq` · 페이징 | `PagedData<DeploymentRequestRow>` |
| 2 | `POST ApproveDeploymentRequest` | `{ requestSeq }` | `true` |
| 3 | `POST RejectDeploymentRequest` | `{ requestSeq, rejectReason }` | `true` |
| 4·5 | `GET GetDeploymentHistory` | `siteSeq` · **`direction`(0 전출 / 1 전입)** · 페이징 | `PagedData<DeploymentHistoryRow>` |
| 7 | `GET GetDeploymentSummary` | `siteSeq` | `DeploymentSummary` |

```ts
interface DeploymentRequestRow {
  requestSeq: number
  userSeq: number
  userName: string
  requestType: number        // 0 배치 / 1 복귀 (가정 — 정수 코드 + 이름 관례)
  requestTypeName: string
  fromSiteSeq: number
  fromSiteName: string
  toSiteSeq: number          // = 현재 사업장(목적지)
  toSiteName: string
  reason: string
  requestDt: string          // ISO, 타임존 없음
}

interface DeploymentHistoryRow {
  historySeq: number
  userSeq: number
  userName: string
  fromSiteSeq: number
  fromSiteName: string
  toSiteSeq: number
  toSiteName: string
  reason: string
  startDt: string
  endDt: string | null       // null = 아직 배치 중
}

interface DeploymentSummary {
  outCount: number           // 배치 나간 인원(소속인데 지금 타 사업장)
  inCount: number            // 배치 온 인원(타 소속인데 지금 여기)
  pendingCount: number       // 대기 중 요청
}
```

- 🔴 **이력은 엔드포인트 1개 + `direction`** 으로 가정한다 — 4·5 는 컬럼이 같고 방향만 다르다. 백엔드가 둘로
  나누면 API 함수만 둘이 된다(화면은 그대로).
- 🔴 **처리된 요청 재처리 = 비즈니스 오류(래퍼, 400)** 로 가정(요청서에 명시).

### 2-2. 화면

**머리** — 제목 "배치관리" + 부제 `{선택 사업장명} 소속 근무자의 배치 이력과 요청을 확인합니다`(`getSiteName()`).

**KPI 3종**(US1) — `GetDeploymentSummary`. 나간 · 온 · 대기. 로딩·실패 상태를 가진다(실패 시 숫자 대신 `-`).
**사이드바 뱃지** — 같은 쿼리(`pendingCount`)를 쓴다. 🔴 store 직접 읽기 제거.

**배치 요청 목록**(US2) — `GetDeploymentRequestList`. 행: 근무자 · `출발 → 도착` · 배치/복귀 · 사유 · 요청일 + `[승인]` `[거부]`.
- **승인**: 클릭 → 즉시 처리(014 결정 — 모달 없음). 처리 중 그 행 버튼 비활성.
- **거부**: 사유 입력 모달(필수) → 처리. 사유는 앱 전용(WEB 미표시).
- 성공 → 요청 목록 · 요약 · 이력 쿼리 **무효화** + 토스트. 실패 → 토스트(서버 메시지), 목록은 그대로.
- 상태 분기: 실패(다시 시도) / 로딩 / 0건("대기 중인 요청이 없습니다") / 목록 + `AppPagination`(서버 페이징).

**전출 / 전입 이력**(US3) — `GetDeploymentHistory(direction)`. 탭은 `?historyTab=out|in`(현행 유지), 페이지는 `?historyPage`.
- 컬럼: 이름 · 배치 경로(`출발 → 도착`) · 사유 · 기간(`시작 ~ 복귀 | 현재`) · 상태(`배치중` / `복귀완료` — `endDt` 유무).
- 정렬 off(서버 페이징). 상태 분기 4종.

---

## 3. 제약

### 기술 제약

- 재사용: `AppKpiCard`(031) · `AppTable` · `AppPagination` · `AppEmpty` · `AppDialog` · `AppBadge` · `useQueryParams` ·
  `getSiteSeq`/`getSiteName` · 페이징 헬퍼(`course-history`) · `RejectRequestForm`(zod 필수 사유).
- 신설: `features/deployments/{api,hooks,queryKeys}` + **MSW `mocks/handlers/deployments.ts`(상태 보유 — 승인·거부가 실제로
  목록·요약·이력을 바꾼다**, 023 `courses.ts` 처럼 store + reset).
- 삭제: `store/deploymentStore.ts` · `mocks/deploymentData.ts`(시드는 MSW 로 옮긴다) · 구 타입.
- 🔴 **가정 타입은 `types/deployment.ts` 한 곳** — 화면 컴포넌트는 그 타입만 본다.

### 비즈니스 규칙

- 대기 요청은 근무자 **1인 1건**(screens §1-4A) — 화면이 강제할 것은 없다(앱 쪽 규칙).
- 거부된 요청은 **이력에 나오지 않는다**(014 결정 유지 — 이력 = 실제 이동).
- 승인은 **되돌릴 수 없다** — 확인 모달이 없으므로(014) 버튼 라벨·위치로 오클릭을 줄인다(거부와 간격 유지).
- `enum.ts` 의 `DeploymentDirection`·`DeploymentStatus`(문자열 enum)는 가정 계약(정수 코드 + 이름)으로 대체 —
  다른 소비처 확인 후 정리.

---

## 4. 엣지 케이스 (A급)

| 경우 | 처리 |
|---|---|
| 승인/거부 연타 | 처리 중 그 행의 두 버튼 **비활성**(`isPending`). 같은 요청 2회 전송 없음 |
| 이미 처리된 요청(다른 관리자·근무자 취소) | 서버 비즈니스 오류 → **토스트(서버 메시지)** + 목록 **재조회**(사라진 행을 정리) |
| 네트워크 실패 | 토스트 + 목록 유지(낙관적 갱신을 하지 않는다 — 023 "비옵티미스틱" 승계) |
| 거부 사유 공백 | zod 필수 — 공백만은 거부(트림) |
| 거부 모달 실패 | 모달 **열린 채** 입력 유지(먼저 닫으면 사유가 사라진다 — 029 규약) |
| 사업장 미선택 | `siteSeq` null → 요청 안 함(가드가 막지만 쿼리도 막는다) |
| 요약만 실패 | KPI 만 `-`, 목록·이력은 정상 표시(서로 독립 쿼리) |
| 현재 페이지 마지막 요청 처리 | 무효화 후 그 페이지가 비면 **이전 페이지로**(빈 페이지 방지) |

---

## 5. 완료 조건 (DoD)

**현황 (US1)**
- [ ] 1. KPI 3종이 요약 쿼리로 그려진다 — store import 0건
- [ ] 2. 사이드바 대기 뱃지가 같은 쿼리를 쓴다 — store 직접 읽기 0건
- [ ] 3. 요약 실패 시 KPI 만 `-` 이고 나머지는 정상
- [ ] 4. 부제가 선택 사업장명으로 나온다(`useMe().locationName` 제거)

**요청 처리 (US2)**
- [ ] 5. 요청 목록이 서버 페이징 + 상태 분기 4종
- [ ] 6. 승인 → 요청 사라짐 · 요약 갱신 · 이력에 1건 · 뱃지 감소(MSW 상태 기준 통합 테스트)
- [ ] 7. 거부 → 사유 필수 · 성공 시 모달 닫힘 · 이력에 **안 생김**
- [ ] 8. 연타 방지 — 처리 중 버튼 비활성, 요청 1회
- [ ] 9. 이미 처리된 요청 → 서버 메시지 토스트 + 재조회
- [ ] 10. 거부 실패 시 모달이 열린 채 입력 유지
- [ ] 11. 마지막 행 처리 후 빈 페이지가 남지 않는다

**이력 (US3)**
- [ ] 12. 전출/전입 탭이 `direction` 으로 서버에 나간다 · `?historyTab`·`?historyPage` 보존
- [ ] 13. 기간·상태가 `endDt` 로 갈린다(`현재`/`배치중` · `복귀완료`) · 상태 분기 4종

**정리**
- [ ] 14. `deploymentStore`·`deploymentData`·구 타입 삭제(소비처 0건) · enum 정리 판단
- [ ] 15. 가정 타입이 `types/deployment.ts` 한 곳에만 있다
- [ ] 16. `npm run verify` + `npm run test` green
- [ ] 17. 브라우저 확인(mock) + 캡쳐 `deployments--대시보드` 교체
- [ ] 18. 요청서 `docs/api-request-deployment.md` 전달 가능 상태 · `api-spec.md` §6-5 갱신
- [ ] 19. 문서 동기화 — screens §1-4A · flow · data-model(배치 타입·엔드포인트) · roadmap(039 행·§12)
- [ ] 20. `## 다음 spec으로 이월` — 백엔드 구현 후 WF-1-0 · 근무자 상세 배치 이력 카드

---

## Open Questions

- **OQ-039-A 가정 계약 전반** — 이름·필드·코드값 전부 가정. 백엔드 구현 후 실측(이월 ①).
- **OQ-039-B 이력 엔드포인트 1개 vs 2개** — `direction` 파라미터로 가정. 요청서는 4·5 를 따로 적었다(백엔드 선택).
- **OQ-039-C 요약 API 유무** — 백엔드가 요약을 만들지 않으면 KPI 를 목록 `totalCount` 등으로 대체해야 한다
  (나간 인원은 다른 방법이 없다 — 요청서 7번이 필요한 이유).
- **OQ-039-D 승인 후 근무자 상태** — 승인 즉시 이동인지, 시작일이 따로 있는지(예약 배치). 지금은 **즉시**로 가정.
