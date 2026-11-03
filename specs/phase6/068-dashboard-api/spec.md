# 068-dashboard-api spec

> 위험도: **B**(조회만 연결 — 쓰기 · 권한 변경 없음, 사용자 결정 2026-11-03)
> 관련: `spec 067`(대시보드 UI · 고정 데이터) · `docs/api-spec.md` **§5-1-D**(대시보드 실측 — 응답 형태 SSOT) · `docs/api-request-dashboard.md`(요청서 · 답변 현황)
> Phase: roadmap.md Phase 6 (마감 후속)

---

## 0. Carry-over (직전 spec 핸드오프)

- 067 이월 "API 요청서 초안" → ✅ 요청서 작성 · 백엔드 반영 · **실측 완료**(2026-11-03, §5-1-D). 이 spec 이 화면에 붙인다.
- **OQ-067-A**(건너뜀) → ✅ **해소** — 앱은 순서를 강제하지 않고, 건너뛴 지점은 서버가 즉시 `status 3` 으로 바꾼다. → 화면 계산을 **`status` 그대로**로 바꾼다(§3).
- **OQ-067-B**(시간초과 KPI 정의) → 🟡 끝난 회차는 센다(실측). 진행 중 초과는 미실측 — 서버 값을 그대로 쓰므로 이 spec 을 막지 않는다. 그대로 둔다.
- **OQ-067-C**(진행 중 코스 많을 때) · **OQ-067-D**(1440+ 2열) → 범위 외, 그대로.
- 067 §2 "화면 상태 보기" `?preview=` → **이 spec 에서 지운다**(실제 쿼리 상태로 대체).
- 067 머리 문구 `30초마다 자동` → 주기 조회를 하지 않으므로 **지운다**. 연결 상태 표시는 `069`(SSE).
- 요청서 남은 확인 C1~C5 → 화면 연결을 막지 않는다. 결과가 오면 표시만 고친다.

---

## 🔴 범위 — 조회 연결만 (사용자 결정 2026-11-03)

- **붙이는 것**: 조회 API 4종(아래 §2) + 새로고침 버튼 + 로딩 · 빈 · 오류 상태 + mock 핸들러.
- **붙이지 않는 것**: **SSE 실시간 갱신 → `069`**. 이 spec 이 끝나면 대시보드는 **화면을 열 때 · 새로고침을 누를 때** 최신이 된다.
- 개발 접속(IP 주소로 열기 · SSE 주소 env)도 `069` — 이 spec 의 조회는 지금 vite 프록시(`npm run dev:real`)로 동작한다.
- 쓰기가 없어 WF-1-0(변경계 실측)은 해당 없음. 조회는 §5-1-D 에 실측돼 있다.

---

## User Stories

- US1. 현장관리자가 대시보드에서 **실제 오늘 숫자**(오늘 순찰 3칸 · 배치 대기 2칸)를 본다.
- US2. **지금 돌고 있는 실제 순찰**을 카드로 본다 — 경과 시간은 화면에서 1분마다 늘어난다.
- US3. **실제 최근 미완료 · 시간초과 5건**과 **최근 공지 3건**을 본다.
- US4. 새로고침 버튼으로 전부 다시 받고, 영역마다 로딩 · 빈 · 오류(다시 시도)를 본다.

---

## 1. 목적

067 에서 고정 데이터로 확정한 화면을 **실제 서버 데이터**로 바꾼다. 실시간(SSE)은 새 인프라라 `069` 로 떼어, 이 spec 만으로도 대시보드가 실제 값으로 동작하게 한다.

---

## 2. I/O

### 호출 (전부 `siteSeq` = 선택한 사업장)

| 영역 | API | 파라미터 | 화면 |
|---|---|---|---|
| KPI | `GET DashBoard/W/sign/GetTodaySummary` | `siteSeq` | 숫자 5개 그대로 |
| 진행 중 | `GET DashBoard/W/sign/GetDashboardCourseList` | `siteSeq` | 카드 목록(배열 · 페이징 없음) |
| 최근 미완료 · 시간초과 | `GET DashBoard/W/sign/GetDashboardPointHistory` **2번** | ① `status=3&pageSize=5` ② `overTimeYn=true&pageSize=5` | 합쳐서 `detailSeq` 로 겹친 행 하나 · `checkDt` 최근 순 · **앞 5건** |
| 공지 | `GET Notice/W/sign/GetNoticeList`(기존 `fetchNoticeList`) | `pageNumber=1&pageSize=3` | 서버 순서 그대로(고정 먼저 — 실측) |

### 타입 — 서버 응답이 메인 (`CLAUDE.md` B4)

- 067 의 화면 모양 타입(`features/dashboard/types`)을 **실측 응답 타입으로 바꾼다** — §5-1-D 응답 타입 그대로(`TodaySummary` · `DashboardCourse` · `DashboardCoursePoint`). 컴포넌트는 서버 이름을 그대로 쓴다.
  - 067 → 서버: `elapsedMin` → `elapsedSec` · `standardMin` → `totalMin` · `userName` → `users`(마지막이 지금 순찰자) · `swapped` → `handoverCount > 0` · `points[].checked` → `points[].status`
- 최근 기록 행은 기존 `PointHistoryRow`(`features/course-history/types`)를 쓴다 — 응답이 `GetPointHistory` 와 같다(실측). 공지는 기존 `NoticeRow`.
- 어댑터는 만들지 않는다(서버 내부 불일치가 없다).

### Output

- 화면 이동만 있다(067 과 같음). 새로고침 버튼 → **4개 영역 쿼리를 모두 다시 받는다** · 끝나면 `마지막 갱신` 시각을 바꾼다.

---

## 3. 제약

### 기술 제약
- 기존 패턴 그대로: `features/dashboard/api/*.ts`(엔드포인트 하나에 파일 하나) · `hooks/use*.ts`(react-query) · `queryKeys.ts`. 공지는 `features/notice` 의 `fetchNoticeList` 를 재사용한다.
- mock: `src/mocks/handlers/dashboard.ts` 신설(067 고정 데이터를 핸들러 응답으로 옮긴다). `?preview=` 와 `features/dashboard/mocks/dashboardMock.ts` 는 지운다 — 상태 확인은 mock 핸들러와 테스트로 한다.
- 영역마다 쿼리가 따로라 **한 영역이 실패해도 다른 영역은 그린다**. 오류 영역에는 다시 시도 버튼.
- `siteSeq` 가 바뀌면(사업장 전환) 쿼리 키가 바뀌어 새로 받는다.

### 비즈니스 규칙 (067 계산 함수 교체)
- **지점 단계 = 서버 `status` 그대로** — `4` 인증(`done`) · `3` 건너뜀/미완료(`skipped`) · `1` 진행중 = **다음 지점**(`next`) · `0` 대기(`pending`). `2` 순찰제외는 실데이터 0건(OQ-18) → `pending` 과 같게 그린다.
  - 067 의 "마지막 인증 지점보다 앞인데 미인증" 계산은 **지운다**(OQ-067-A 해소).
- `n/N 지점` = `status 4` 개수 / 전체. `건너뜀 N` = `status 3` 개수. `다음: 지점명` = `status 1` 지점(없으면 표시 안 함).
- 경과 = `elapsedSec` + (지금 − 받은 시각) — **1분마다** 다시 그린다. `pausedYn` 이면 더하지 않는다.
- 시간초과 = 경과 분 > `totalMin`. **`totalMin` 이 0 이면 기준 없음** — 막대 · 시간초과 판단을 하지 않고 `기준 없음` 으로 쓴다(실데이터에 `totalMin 0` 코스가 있다 — 코스 65).
- 최근 기록 뱃지 · 링크는 067 그대로(`pointCheckBadge` · 완료 행은 `시간초과` 만).

---

## 4. 엣지 케이스

공통 규칙 따름. 화면 고유:
- 진행 중 0건 → 067 의 `AppEmpty` 그대로.
- 최근 기록 두 호출 중 **하나만 실패** → 영역 전체를 오류로(반쪽 목록을 정상처럼 보이지 않게).
- 회차가 오래 열려 있음(요청서 C1 — 예: 2시간째) → 계산대로 `시간초과 +N분` 으로 보인다. 따로 처리하지 않는다.
- 되돌린 교대(B-68)는 `handoverCount 0` 으로 와 `교대` 뱃지가 안 붙는다 — 서버 값 그대로.

---

## 5. 완료 조건 (DoD)

- [x] 1. KPI · 진행 중 · 최근 기록 · 공지가 **실제 API** 로 그려진다(`npm run dev:real` · 사업장 6 에서 확인)
- [x] 2. 타입이 §5-1-D 실측 이름이다 — 화면 모양 타입 · `dashboardMock.ts` · `?preview=` 삭제
- [x] 3. 지점 단계가 서버 `status` 기준이다 — `activeCourse` 계산 교체 + 단위 테스트
- [x] 4. 경과 1분마다 증가 · `pausedYn` 멈춤 · `totalMin 0` 기준 없음
- [x] 5. 최근 기록 2번 호출 합치기(겹침 하나 · 최근 순 · 5건) + 단위 테스트
- [x] 6. 새로고침 = 4개 영역 다시 받기 · `마지막 갱신` 갱신 · `30초마다 자동` 문구 삭제
- [x] 7. 영역별 로딩 · 빈 · 오류(다시 시도) — mock 핸들러 · 화면 테스트
- [x] 8. `npm run verify` + `npm run test` · `npm run e2e` · 브라우저 확인(1280 · 390 · mock · real)
- [x] 9. 문서 — `roadmap.md` 068 행 · `screens.md` 대시보드 행(API 연결 표기)
- [x] 10. `## 다음 spec으로 이월` — `069` SSE 실시간(이벤트 처리 방침은 §5-1-D "화면 처리 방침")

---

## 다음 spec으로 이월 — `069` SSE 실시간 (예정)

- SSE 연결(`fetch` 스트림 + `Authorization` 헤더) · 401 → 토큰 재발급 후 재연결 · `retry` 10초.
- 이벤트 처리 — §5-1-D "화면 처리 방침" 그대로. **주기 조회 없음 · 재연결 때만 목록 다시 조회**(사용자 결정 2026-11-03).
- 개발 접속: 실 서버는 IP 주소로 열기(`.env.real` 의 `VITE_API_BASE_URL` · SSE 주소 env 신설) · 운영은 같은 도메인.
- 머리에 연결 상태 표시.
- 🟡 **실서버 진행 중 카드 확인**(2026-11-03 사용자 결정으로 이월) — 068 실서버 확인 때 사업장 6 진행 중 회차가 0건이었다. 조회 4종의 응답 모양은 타입과 일치(오늘 숫자 · 최근 기록 2번 · 공지). 069 에서 앱으로 순찰을 돌리며 카드(경과 · 지점 색 · 다음 지점 · 건너뜀 · 교대)를 함께 본다.

## Open Questions

- (없음 — 요청서 남은 확인 C1~C5 는 화면 연결을 막지 않는다)
