# 042-deployments-real spec

> 위험도: **A** (`screens.md` §1-4A — 요청 목록·승인·반려가 A. 데이터 변형 + 다른 사업장 근무자 소속이 바뀐다)
> 관련 화면: 배치관리 `/deployments` · 근무자 상세 `/users/:userSeq`(배치 이력 섹션 신설)
> Phase: `roadmap.md` Phase 4 — `039-deployments` 이월 ① "백엔드 구현 후 WF-1-0" · ② "근무자 상세 배치 이력 카드"
> 목업: 없음 — 039 화면 구조를 유지한다

---

## 0. Carry-over

### 직전 배치 spec(`039-deployments`) `## 다음 spec으로 이월` 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| ① 가정 계약 교정(WF-1-0) | ✅ **실측 완료**(2026-10-21 · 재실측 2026-10-22) — `api-spec.md` §5-1-B "배치 10종". 아래 §2-1 이 그 결과다 |
| ① OQ-039-B 이력 엔드포인트 1개 vs 2개 | ✅ **2개**(`GetAssignmentInHistory` · `GetAssignmentOutHistory`) |
| ① OQ-039-C 요약 API 유무 | ✅ **있다**(`GetAssignmentCount`) — 단 `pendingReturnCount` 없음 · 배치예정도 센다 |
| ① OQ-039-D 승인 즉시 이동인가 | ✅ 오늘 시작이면 즉시, 미래 시작이면 시작일까지 이동하지 않는다(`status 0 배치예정`) |
| ① 현장관리자 권한 | ✅ 조회·승인·반려 모두 현장관리자 토큰 200 |
| ② 근무자 상세 배치 이력 카드 | **받는다**(US4) — `GetAssignmentHistory?userSeq` |
| ③ KPI 숫자 = 이력 `배치중` 건수 일치 확인 | ❌ **일치하지 않는다** — 요약은 배치예정도 센다(§3) |
| ④ T652 dev 화면 승인·반려 직접 확인 | **받는다** — dev:real 로 확인(DoD) |

### 직전 spec(`041-worker-write`) 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| ② 근무자 상세 배치 이력 카드 | 위 039 ② 와 같은 항목 — US4 |
| ③ B-44 · B-45 · B-41 ② | **범위 외** — 근무자 전용 |
| ④ 캡쳐 재촬영 | **범위 외** — 다음 캡쳐 작업 |

---

## User Stories

- **US1.** 현장관리자가 `/deployments` 에서 **배치 현황 3종**(나간·온·대기)을 본다. 사이드바에도 대기 건수가 뜬다.
- **US2.** 현장관리자가 **배치 요청·복귀 요청**을 보고 승인하거나 반려한다. 처리하면 목록·KPI·이력·뱃지가 함께 갱신된다.
- **US3.** 현장관리자가 **전입·전출 이력**을 이름으로 검색하며 본다. 상태(배치예정·배치중·복귀완료)가 보인다.
- **US4.** 현장관리자가 **근무자 상세**에서 그 사람의 배치 이력을 본다.

---

## 1. 목적

039 는 API 가 없어 **가정 계약 + MSW** 위에 화면을 먼저 만들었다. 백엔드가 `Assignment` 10종을 만들었고
실측을 마쳤다. 본 spec 은 **가정 타입을 실측 타입으로 바꾸고** 화면을 실서버에 붙인다. 🔴 원칙(사용자 결정
2026-10-22): **서버에 있는 것만 그린다. 없는 것은 칸을 빼고 요청사항으로 남긴다**(B-46 ② · B-47 사유).
웹은 근무자 요청 생성 API(`UserAssignment`·`UserAssignmentReturn`)를 쓰지 않는다 — 백엔드가 근무자 웹 로그인을
가정하고 만든 것이다(사용자 전달 2026-10-22).

---

## 2. I/O

### 2-1. API (실측 확정 — `api-spec.md` §5-1-B 배치 10종)

경로 접두사 `/api/v1/Assignment/W/sign/`. 변경계는 **JSON**, 성공 `data: true`.

| API | 요청 | 응답 `data` |
|---|---|---|
| `GET GetAssignmentList` | `siteSeq` | `AssignmentRequestRow[]` — 🔴 **배열, 페이징 없음** |
| `GET GetAssignmentReturnList` | `siteSeq` | `AssignmentRequestRow[]`(같은 행) |
| `PUT AssignmentApprove` | `{ assignmentSeq, approved }` | `true` |
| `PUT AssignmentReturnApprove` | `{ assignmentSeq, approved }` | `true` |
| `GET GetAssignmentInHistory` | `siteSeq` · `userName?` · `pageNumber` · `pageSize` | `PagedData<AssignmentInHistoryRow>` |
| `GET GetAssignmentOutHistory` | 같다 | `PagedData<AssignmentOutHistoryRow>` |
| `GET GetAssignmentHistory` | `userSeq` · `pageNumber` · `pageSize` | `PagedData<UserAssignmentHistoryRow>` |
| `GET GetAssignmentCount` | `siteSeq` | `AssignmentCount` |

```ts
interface AssignmentRequestRow {
  assignmentSeq: number
  fromSiteSeq: number
  fromSiteName: string
  toSiteSeq: number
  toSiteName: string
  startDt: string
  plannedEndDt: string | null
  reason: string
  createDt: string
  userSeq: number
  userName: string
}

/** 0 배치예정 / 1 배치중 / 2 복귀완료 — 서버가 계산한다 */
interface AssignmentHistoryBase {
  assignmentSeq: number
  startDt: string
  endDt: string | null
  completeYn: boolean
  completeDt: string | null
  status: number
  statusName: string
}
interface AssignmentInHistoryRow extends AssignmentHistoryBase { userName: string; fromSiteName: string }
interface AssignmentOutHistoryRow extends AssignmentHistoryBase { userName: string; toSiteName: string }
interface UserAssignmentHistoryRow extends AssignmentHistoryBase { siteSeq: number; siteName: string }

interface AssignmentCount { outCount: number; inCount: number; pendingCount: number }

interface AssignmentApproveRequest { assignmentSeq: number; approved: boolean }
```

- 🔴 **`approved` 는 항상 명시한다** — 빼면 서버가 **반려로 처리**한다(B-48, bool 기본값).
- 배치·복귀 승인/반려는 **바디가 같고 경로만 다르다** → API 함수 2개(`approveAssignment` · `approveAssignmentReturn`),
  각각 `approved: true | false`. 039 의 4개(승인·거부 × 배치·복귀)를 줄인다.
- 어댑터는 두지 않는다(B4) — 행 필드를 화면이 그대로 쓴다. 상태 표시는 `statusName` 을 쓰고 색만 `status` 로 고른다.

### 2-2. 화면 — 배치관리 `/deployments`

**KPI 3종**(US1) — `GetAssignmentCount`. 나간 · 온 · 대기. 사이드바 뱃지 = `pendingCount`(현행 유지).
- 🔴 **보조 문구**: "복귀하지 않은 인원" → **"배치예정 포함"** — 서버가 시작 전 배치도 센다(실측). 이력의 `배치중` 건수와 다를 수 있다.
- 🔴 **카드 클릭 시 `배치중` 필터 제거** — 서버에 상태 필터 파라미터가 없다. 클릭하면 해당 탭으로만 간다.

**탭 4개** — 배치 요청 · 복귀 요청 · 전입 이력 · 전출 이력(`?tab` · `?page`, 현행 유지).
- 배치 요청 뱃지 = `pendingCount` · 🔴 **복귀 요청 뱃지 = 복귀 목록 길이**(사용자 결정 2026-10-21). 복귀 목록은 탭과 무관하게 조회한다(뱃지에 필요).

**배치 요청**(US2) — `GetAssignmentList`. 컬럼: 근무자 · 배치 경로(`출발 → 도착`) · 배치 기간(`시작 ~ 종료 | 미정`) · 사유 · 요청일 · `[승인]` `[반려]`.
**복귀 요청**(US2) — `GetAssignmentReturnList`. 컬럼: 근무자 · **복귀 경로** · 배치 기간 · 사유 · 요청일 · `[승인]` `[반려]`.
- 🔴 **복귀 경로는 뒤집어 그린다** — 행의 `from → to` 는 **원래 배치 방향**(7 → 8)이다. 복귀는 `toSiteName → fromSiteName`.
- 🔴 **복귀일 칸 제거** — 서버에 없다(B-46 ②, 요청 중).
- 두 목록 모두 **클라이언트 페이징**(배열 응답). 화면이 `?page` 로 배열을 잘라 `AppTable` 에 넘긴다 — 이력 탭과 같은 `AppPagination` 하나를 쓴다.

**승인 / 반려**
- 승인: 클릭 → 즉시(014 유지 — 확인 모달 없음).
- 🔴 **반려: 사유 입력 모달 제거**(서버에 사유 필드 없음 — 사용자 결정 2026-10-21) → **확인창**(`AppAlertDialog` "반려하시겠습니까?")으로 바꾼다. 반려는 되돌릴 수 없고 이력에도 남지 않는다.
- 처리 중 그 행의 두 버튼 비활성 · 성공 → `deploymentKeys.all` 무효화 + 토스트 · 실패 → 전역 토스트 + 재조회(039 승계).

**전입 / 전출 이력**(US3) — In/Out 각각. 이름 검색(`?q` → `userName`, 부분 일치) 유지.
- 컬럼: 근무자 · 배치 경로 · 기간 · 상태. 🔴 **사유 칸 제거**(B-47, 요청 중).
- 경로의 한쪽 끝은 행에 없다(전입은 `fromSiteName` 만, 전출은 `toSiteName` 만) → 다른 끝은 **선택 사업장명**(`getSiteName()`).
- 기간: `시작 ~ 종료`. 종료 = `endDt`, 없으면 `미정`. 🔴 `completeDt` 는 쓰지 않는다 — 지금 값은 테스트 값이라 의미를 확정할 수 없다(사용자 2026-10-22, OQ-042-E).
- 상태: `statusName` 뱃지 — 배치예정(warning, 039 색 유지) · 배치중(point) · 복귀완료(muted). `AssignmentStatusBadge` 하나를 근무자 상세와 함께 쓴다.
- 🔴 **상태 필터(`?status`) 제거** — 서버 파라미터가 없고, 현재 페이지 안에서만 거르면 행 수가 페이지마다 달라진다.

### 2-3. 화면 — 근무자 상세 `/users/:userSeq` (US4)

**배치 이력 섹션** — 우측 열 `최근 순찰 기록` 카드 **아래**. `GetAssignmentHistory?userSeq`.
- 컬럼: 배치 사업장(`siteName`) · 기간 · 상태(위 이력과 같은 규칙·뱃지).
- 서버 페이징 5행 + `AppPagination`. 페이지는 **로컬 state**(상세의 보조 카드 — URL 쿼리를 두지 않는다).
- 상태 분기 4종: 실패(다시 시도) / 로딩 / 0건("배치 이력이 없습니다") / 목록.
- 🔴 사업장과 무관하게 **그 사람의 전체 배치**다(`siteSeq` 를 받지 않는다) — 최근 순찰 기록(선택 사업장 한정)과 다르다. 캡션으로 구분한다.

---

## 3. 제약

### 기술 제약

- 교체: `features/deployments/types/deployment.ts`(가정 → 실측) · `api/*`(8개 → 7개) · `hooks/*` · `queryKeys.ts` · `lib/deploymentParams.ts`(`status`·`direction` 제거) · 컬럼 3종 · `DeploymentBoard` · `DeploymentKpiRow`.
- 삭제: `form/RejectRequestForm.tsx` · `form/schema.ts` · 그 테스트 — 사유 입력이 없어진다. `deploymentPeriod.ts` 는 기간 규칙 변경에 맞춰 손본다.
- MSW `mocks/handlers/deployments.ts` — 실측 경로·행 모양으로 교체, **상태 보유 유지**(승인·반려가 목록·요약·이력을 바꾼다) + reset. `GetAssignmentHistory` 추가.
- 신설: `features/workers/components/detail/UserAssignmentCard.tsx` + `features/deployments/{api,hooks}` 에 근무자별 이력 조회. 🔴 쿼리 키는 `deploymentKeys` 아래 — 승인·반려 무효화에 함께 걸린다.
- 재사용: `AppTable` · `AppPagination` · `AppEmpty` · `AppAlertDialog` · `AppBadge` · `SiteRoute` · `useQueryParams` · `getSiteSeq`/`getSiteName`.
- 🔴 **비옵티미스틱** 유지.

### 비즈니스 규칙

- **목적지 관리자가 배치 요청을**, **원소속 관리자가 복귀 요청을** 처리한다(서버가 `siteSeq` 로 나눠 준다 — 화면이 판단하지 않는다).
- 반려된 요청은 **어느 이력에도 나오지 않는다**(실측).
- 근무자 1인 1건(실측 — 진행 중 배치가 있으면 서버가 새 요청을 거부). 화면이 강제할 것은 없다.
- 🔴 **근무자를 삭제하면 그 사람의 배치 이력이 조회에서 사라진다**(실측) — 화면이 할 것은 없다. 문서에만 남긴다.

---

## 4. 엣지 케이스 (A급)

| 경우 | 처리 |
|---|---|
| 승인/반려 연타 | 처리 중 그 행 두 버튼 비활성 — 요청 1회 |
| 이미 처리된 요청 | 400 래퍼 `"이미 승인 또는 반려 처리된 배치입니다."` / `"이미 처리되었거나 존재하지 않는 복귀 요청입니다."` → 전역 토스트 + 재조회 |
| 없는 `assignmentSeq` | 404 래퍼 → 같은 처리 |
| 반려 확인창에서 취소 | 요청 없음 |
| 네트워크 실패 | 토스트 + 목록 유지 |
| 마지막 행 처리 후 페이지가 빔 | 이전 페이지로(039 승계 — 클라이언트 페이징에서도 같다) |
| 요약만 실패 | KPI 만 `-`, 목록·이력 정상(독립 쿼리) |
| 복귀 목록 실패 | 복귀 탭 뱃지를 그리지 않는다(숫자를 지어내지 않는다) |
| 사업장 미선택 | 요청 안 함 |
| `plannedEndDt`·`endDt` null | `미정` |
| 근무자 상세 — 배치 이력 조회 실패 | 그 섹션만 실패 표시, 상세 나머지는 정상 |

---

## 5. 완료 조건 (DoD)

**기반**
- [x] 1. 타입이 실측 그대로(`api-spec.md` §5-1-B) — 가정 타입·가정 경로(`Deployment/W/sign`) 0건
- [x] 2. 승인·반려 API 2개 · `approved` 를 항상 보낸다(반려 `false` 가 바디에 있다)
- [x] 3. MSW 실측 모양 + 상태 보유 + reset · `GetAssignmentHistory` 포함

**현황 (US1)**
- [x] 4. KPI 3종이 `GetAssignmentCount` · 보조 문구 "배치예정 포함" · 카드 클릭이 상태 필터를 걸지 않는다
- [x] 5. 사이드바 뱃지 = `pendingCount`

**요청 (US2)**
- [x] 6. 배치·복귀 요청 표에 근무자가 나온다 · 클라이언트 페이징 + `?page`
- [x] 7. 복귀 경로가 뒤집혀 그려진다(`도착 → 출발`) · 복귀일 칸 없음
- [x] 8. 승인 → 행 사라짐 · 요약·이력·뱃지 갱신(MSW 통합 테스트)
- [x] 9. 반려 → 확인창 → `approved: false` · 이력 불변 · 사유 입력 0건(`RejectRequestForm` 삭제)
- [x] 10. 연타 1회 · 처리된 요청 → 토스트 + 재조회 · 마지막 행 처리 후 빈 페이지 없음
- [x] 11. 복귀 탭 뱃지 = 복귀 목록 길이

**이력 (US3)**
- [x] 12. 전입·전출이 각 엔드포인트로 나간다 · 이름 검색 `userName` · 사유 칸·상태 필터 없음
- [x] 13. 상태 3종 뱃지가 `statusName` · 기간 종료 = `endDt` 또는 `미정`(`completeDt` 미사용)

**근무자 상세 (US4)**
- [x] 14. 배치 이력 섹션 — 5행 서버 페이징 · 상태 분기 4종 · 승인·반려 무효화에 함께 갱신

**마무리**
- [x] 15. `npm run verify` + `npm run test` green
- [x] 16. 브라우저 확인 — mock + 🔴 **dev:real**(배치 데이터는 앱 경로로만 생긴다 → 확인 방법은 tasks 에 적는다)
- [x] 17. 문서 — `api-request-deployment.md`(남은 요청 2건) · `screens.md` §1-4A·§1-4 · `data-model.md` · `flow.md` · `roadmap.md`
- [x] 18. `## 다음 spec으로 이월`

---

## Open Questions

- **OQ-042-A 복귀일**(B-46 ②) — 복귀 요청에 복귀일이 없다. 앱 복귀 요청에서 입력받아야 생긴다. 칸을 뺐다.
- **OQ-042-B 이력 사유**(B-47) — 이력 3종에 사유가 없다. 칸을 뺐다.
- **OQ-042-C 요약이 배치예정을 센다** — "지금 나가/와 있는 인원" 이 아니다. 보조 문구로 알린다. 서버가 바꾸면 문구를 되돌린다.
- **OQ-042-F 이력 상태 필터**(B-47) — 🔴 백엔드가 파라미터를 **빠뜨렸다**(사용자 전달 2026-10-22). swagger 에 없고 `status=0/1/2` 를 보내도 무시된다(재실측 2026-10-22). 필터 UI 를 빼 두었다 — 반영되면 `?status` + 서버 파라미터로 되살린다(039 구현이 git 에 있다).
- **OQ-042-E `completeDt`** — 현재 값은 테스트 값이다(사용자 2026-10-22). 타입에는 두고 화면에는 쓰지 않는다. 실데이터가 쌓이면 다시 본다.
- **OQ-042-D dev:real 확인 데이터** — 웹에서는 요청을 만들 수 없다. 앱으로 만들거나 실측 스크립트처럼 테스트 근무자 토큰으로 만든다(만든 근무자는 삭제 — 이력도 함께 사라진다).
