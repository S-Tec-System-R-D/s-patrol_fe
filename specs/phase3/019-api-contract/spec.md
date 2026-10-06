# 019-api-contract spec

> 위험도: **A** (사용자 결정 2026-10-02 — 화면이 없어 `screens.md`에 등재되지 않는 기반 작업. 003 `auth`·005 `auth/error` 등 인증 계열 선례와 동일 급으로 산정)
> 관련 화면: **없음.** 전역 통신 기반이며 소비처는 `spec 020~026` 전부
> Phase: roadmap.md Phase 3 (실 API 연동 선행 기반)
> 선행 문서: [`docs/api-spec.md`](../../../docs/api-spec.md) §1~§3 (응답 형태 SSOT)

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `018-patrol-history-filters` (조기 종료, `tasks.md` 하단 "다음 spec으로 이월" 블록 참조).

- [ ] 018 T158·T160·T161 (지점이력 필터 옵션·UI 배선·화면 테스트) — **본 spec 범위 외 → `spec 024`로 이월**
- [ ] 018 T162·T163 (페이지네이션 URL 이관) — **본 spec 범위 외 → `spec 024`·`025`로 이월**. 단 응답 페이징 **타입**(`PagedData`)은 본 spec에서 확정한다
- [ ] 018 T169 (M2 시각 검증) — **본 spec 범위 외 → `spec 024`·`025`로 이월**. 본 spec은 화면이 없어 시각 검증 대상이 아니다
- [ ] 018 Phase 3 산출물 정리(`filterCourseHistory.ts` 등) — **본 spec 범위 외 → `spec 025`로 이월**
- [ ] 결과 뱃지 5종 ↔ 서버 `status` 2종 불일치 (`roadmap.md` §13) — **본 spec 범위 외 → `spec 024`로 이월**. 도메인 enum이지 통신 규약이 아니다
- [x] 018 T167 (verify/test green) — 018 종료 시점에 확인 완료. 본 spec도 동일 기준 적용

> 018의 이월 항목은 모두 **이력 화면 도메인**이라 본 spec(통신 기반)과 겹치지 않는다. 본 spec이 흡수하는 것은 `PagedData` 타입 확정 한 가지뿐이다.

---

## User Stories

- **US1.** 개발자가 임의의 API를 호출했을 때, 성공 응답이면 **래퍼가 벗겨진 `data`를 그대로** 받는다 — `code` 값이 `200`이든 `101`이든 `201`이든 성공으로 처리된다.
- **US2.** 개발자가 실패 응답을 받았을 때, 서버가 **어떤 형태로 에러를 주든**(래퍼 / ProblemDetails / 빈 body) 앱이 터지지 않고 **사용자에게 보여줄 메시지 하나**를 얻는다.
- **US3.** 사용자의 accessToken이 만료됐을 때, **실제 재발급 엔드포인트**로 갱신되어 원 요청이 자동 재시도되고, 재발급도 실패하면 로그인 화면으로 이동한다.

---

## 1. 목적

실 백엔드와 **말이 통하게** 만든다.

현재 `src/lib/axios.ts`는 백엔드가 없던 시절 `data-model.md`의 **예측**에 맞춰 작성됐다. 2026-10-02 실측(`api-spec.md`) 결과 그 예측이 세 군데에서 틀렸고, 지금 코드로 실 서버를 호출하면 **정상 응답을 에러로 던지고 / 에러 응답에서 터지고 / 토큰 재발급이 아예 불가능**하다.

이 spec은 화면을 만들지 않는다. `020~026`이 올라설 통신 계약을 실제에 맞추는 것이 전부다. 여기가 틀어지면 이후 7개 spec이 전부 틀어지므로 먼저 독립시켰다.

---

## 2. I/O

### Input

**API 응답 (실측 — `api-spec.md` §1-4·§3)**

| 형태 | 조건 | 본문 |
|---|---|---|
| (A) `ApiResponse<T>` 래퍼 | 성공 전부 + 비즈니스 오류 | `{ message, data, code }` |
| (B) ProblemDetails | 유효성 400, 서버 500 | `{ errors?, type, title, status, detail?, traceId }` — **`message` 없음** |
| (C) 빈 body | 401(토큰 없음·무효), 403(권한 없음) | `""` |

**성공 `code` 실측값** — `200`(일반 조회) / `101`·`102`·`103`(본사 로그인) / `201`·`202`(현장 로그인) / `201`(RefreshToken)

**토큰** — `localStorage`의 `auth.accessToken`, `auth.refreshToken` (`src/lib/auth/tokens.ts` 기존 키 유지)

### Output

- **성공**: `response.data`에 래퍼가 벗겨진 `T`가 담긴다 (기존 unwrap 동작 유지)
- **실패**: 정규화된 에러 1개를 reject — 사용자 표시용 `message`와 분류 가능한 `kind`를 갖는다
- **401 → 재발급 성공**: 새 accessToken 저장 + 원 요청 자동 재시도
- **401 → 재발급 실패**: 토큰 클리어 + toast 1회 + 영역별 로그인 이동 (`redirectToLogin`, 기존 동작 유지)

---

## 3. 제약

### 기술 제약

- **수정 대상**: `src/lib/axios.ts`, `src/types/api.ts`
- **기존 유지**: `src/lib/auth/tokens.ts`(저장 키), `src/lib/auth/redirect.ts`, `src/lib/notify.ts`, single-flight refresh 구조, blob 우회
- **MSW 핸들러 갱신 필요** — `src/mocks/handlers/auth.ts`가 `/api/auth/me`·`/api/auth/refresh`(둘 다 **실재하지 않는 경로**)를 물고 있다. 실 경로로 교체하되 `/api/auth/me` 대응 핸들러는 **만들지 않는다**(엔드포인트 자체가 없음)
- **`useMe` 교체는 본 spec 범위 외** → `spec 020`. 다만 `/api/auth/me` 제거로 깨지는 테스트가 있으면 본 spec에서 복구한다
- 테스트는 vitest. 화면이 없으므로 **인터셉터 단위 테스트**로만 검증한다

### 비즈니스 규칙

1. **성공 판정은 HTTP status 2xx로 한다.** `code`로 판정하지 않는다.
   - 근거: 성공 `code`가 `200`/`101`/`201` 등으로 갈리므로 `code === 200` 검사는 로그인을 실패로 만든다. 실측상 비즈니스 오류는 전부 HTTP 4xx로 내려온다.
   - `code`는 **로그인 결과의 사이트·권한 분기에만** 쓴다(`spec 020` 책임). 통신 계층은 `code`를 해석하지 않고 **그대로 통과시킨다**.
2. **에러 메시지 추출 우선순위**: (A) `message` → (B) `errors` 첫 항목 → (B) `detail` → (B) `title` → (C) status별 기본 문구.
3. **빈 body를 파싱하지 않는다.** 401·403은 본문 없이 status만으로 분기한다.
4. **`code`를 에러 판정에 쓰지 않되, 로그인 응답의 `code`는 소비처가 읽을 수 있어야 한다.** 래퍼를 벗기면 `code`가 사라지므로, 로그인·재발급처럼 `code`가 필요한 호출을 위한 **탈출구**를 둔다(blob 우회와 같은 방식).
5. **재발급 요청에도 `Authorization` 헤더를 붙인다.** 실측상 `RefreshToken`은 body의 `refreshToken`과 Bearer 헤더를 **둘 다** 요구한다.
6. **재발급 성공 판정도 2xx로 한다.** 실측 `code`가 `201`이라 기존 `code !== 200` 검사는 항상 실패한다.
7. **refreshToken은 회전하지 않는다**(실측). 응답의 refreshToken을 저장하되, 값이 같아도 정상으로 취급한다.
8. 권한 밖 사업장 조회는 403이 아니라 **`200` + 빈 목록**이다. 통신 계층은 이를 구분할 수 없으므로 **아무 처리도 하지 않는다** — 접근 가능 사업장 제한은 `spec 021` 책임.

---

## 4. 엣지 케이스

| 상황 | 처리 |
|---|---|
| **성공인데 `code`가 200이 아님** (로그인 `101`/`201`) | 정상 성공. unwrap 후 반환. **현재 코드는 여기서 throw한다 — 핵심 수정 지점** |
| **200인데 래퍼가 아님** | 서버 계약 위반. `'알 수 없는 응답 형식'`으로 reject(기존 동작 유지) |
| **400 + ProblemDetails** | `errors` 첫 메시지 추출. 없으면 `detail` → `title` |
| **400 + 래퍼** | `message` 사용 |
| **401 빈 body + refreshToken 있음** | 재발급 시도 → 성공 시 원 요청 재시도 |
| **401 빈 body + refreshToken 없음** | 재발급 생략, 즉시 로그인 이동 (기존 동작) |
| **재발급 요청 자체가 401** | 재귀 차단. 로그인 이동 — `REFRESH_PATH` 상수가 실경로로 바뀌므로 **차단 조건도 함께 갱신**해야 한다 |
| **동시 401 다발** | single-flight로 재발급 1회만 (기존 구조 유지) |
| **같은 요청의 두 번째 401** | `_retry` 플래그로 재시도 1회 제한 (기존 구조 유지) |
| **403 빈 body** | 재발급하지 않는다. 권한 부족이지 만료가 아니다 |
| **500 + ProblemDetails** | `detail` 추출. 실측 문구: `'서버에서 요청을 처리하지 못하였습니다...'` |
| **네트워크 실패**(`error.response` 없음) | `'네트워크 연결을 확인해주세요'` (기존 동작 유지) |
| **blob 응답** | unwrap하지 않고 통과 (기존 동작 유지) |
| **재발급 중 로그아웃** | 토큰이 사라진 상태로 재시도 → 401 → `_retry`로 차단되어 로그인 이동 |

---

## 5. 완료 조건 (DoD)

- [x] 성공 응답이 `code` 값과 무관하게(`200`/`101`/`201` 전부) unwrap되어 반환된다
- [x] 에러 3종(래퍼 / ProblemDetails / **빈 body**)에서 **throw·파싱 예외 없이** 사용자 표시용 메시지가 나온다
- [x] 빈 body(401·403) 응답을 JSON 파싱하지 않는다
- [x] `REFRESH_PATH`가 `/api/v1/Login/W/sign/RefreshToken` 실경로이고, 재귀 차단 조건이 같은 상수를 참조한다
- [x] 재발급 요청에 `Authorization` 헤더가 붙는다
- [x] 재발급 성공 판정이 2xx 기준이며 `code: 201` 응답을 정상 처리한다
- [x] 로그인·재발급처럼 `code`가 필요한 호출이 **래퍼 전체를 받을 수 있는 탈출구**가 있다
- [x] `src/types/api.ts`에 `ProblemDetails` 타입과 성공 `code` 사전 상수가 있고, `api-spec.md` §2-1 표와 값이 일치한다
- [~] MSW 핸들러가 실재하지 않는 경로(`/api/auth/me`·`/api/auth/refresh`)를 더는 참조하지 않는다 — **부분.** `/api/auth/refresh` 해소, `/api/auth/me`는 `spec 020` 이월(런타임 12곳 의존)
- [x] 인터셉터 단위 테스트가 위 엣지 케이스 표의 **각 행을 덮는다**
- [x] `npm run verify` 0 errors + `npm run test` green (CLAUDE.md A4, 병렬 실행)

---

> 증거 `파일:라인`은 [`tasks.md`](./tasks.md) "DoD 대조표" 참조. 11개 중 10개 충족, 1개(MSW `me` 경로) 의도적 이월.

---

## 참고

- 응답 형태 SSOT: [`api-spec.md`](../../../docs/api-spec.md) §1-4(래퍼) · §1-5(페이징) · §2(code 사전) · §3(에러 3종)
- 설계 의도: [`data-model.md`](../../../docs/data-model.md) §2-1 · §6
- 현재 구현: `src/lib/axios.ts`, `src/types/api.ts`, `src/mocks/handlers/auth.ts`
- 관련 목업: **없음** (화면 없는 기반 작업)

---

## Open Questions

- [x] **OQ-A. 가드의 권한 판단 SSOT** — **결정(2026-10-02): JWT `role` 클레임.** `code`는 로그인 직후 1회성 라우팅 힌트(사이트 분기 + 근무자 차단)로만 쓰고 저장하지 않는다. 사유: 가드는 새로고침·딥링크에서도 동작해야 하는데 그 시점엔 로그인 응답이 없고, `code`를 따로 저장하면 토큰과 어긋날 여지가 생긴다. → `api-spec.md` §2-1 · `CLAUDE.md` B4 기록 완료. **본 spec에는 영향 없음**(통신 계층은 `code`를 해석하지 않고 통과만 시킨다)
- [x] **OQ-B. `202`에 해당하는 현장 권한** — **확정(2026-10-02): 근무자.** 🔴 근무자는 WEB 접근 불가인데 서버는 토큰을 발급하므로 **프론트가 차단해야 한다**(`code === 202` → 토큰 저장하지 않고 안내 후 중단). **본 spec 범위 외 → `spec 020`**
- [ ] **OQ-D. JWT `role` 문자열 전체 목록** — 실측된 것은 `FieldManager`·`SystemManager` **2개뿐**이고 Master·Manager·근무자 값은 미확인(해당 계정이 없어 실측 불가). 현재 코드의 `Role` 타입(`'SYSTEM' | 'MASTER' | 'MANAGER' | 'FIELD_MANAGER' | 'WORKER'`)과 매핑하려면 필요.
  - **해소 방향(결정 2026-10-02)**: 백엔드에 따로 묻지 않고 **실측으로 채운다.** 로그인 화면(`spec 020`) 이후 관리자 생성·현장관리자/근무자 생성 기능을 만들 때 계정을 직접 만들어 로그인해보고 `role` 값을 확인해 `api-spec.md` §1-2에 기록한다.
  - 그때까지는 **확인된 2개만 매핑하고 나머지는 미지원으로 둔다**(알 수 없는 `role`은 권한 없음 처리). 본 spec 범위 외 → `spec 020`
- [ ] **OQ-E. HTTP 200 + 실패 `code` 응답이 존재하는가** (Phase 3에서 등재) — 성공 판정을 HTTP 2xx 전담으로 바꾸면서 기존의 `code !== 200 → throw`가 사라졌다. 그 결과 **"HTTP 200인데 `code`로 실패를 알리는 응답"**은 더 이상 잡히지 않고 조용히 성공으로 처리된다.
  - 실측한 **GET 23개에서는 그런 사례가 없었다**(실패는 전부 HTTP 4xx). 그래서 제거해도 된다고 판단했다.
  - 다만 **변경계 19개(POST/PUT/PATCH/DELETE)는 미검증**이다. 등록·수정 실패를 `200` + `code: 4xx`로 알리는 패턴이 있다면 놓친다.
  - → 변경계를 처음 붙이는 spec(`022` 순찰지점 CRUD)에서 실측해 확인한다. 그런 패턴이 발견되면 성공 인터셉터에 `code` 기반 실패 분기를 **추가**한다.
- [ ] **OQ-C. 에러 toast 발생 위치** — 현재 `finalizeAuthFailure`만 toast를 띄우고 일반 에러는 호출부(react-query) 책임이다. 정규화된 에러를 인터셉터에서 일괄 toast할지, 지금처럼 호출부에 맡길지. **화면이 붙는 `spec 020`에서 실사용을 보고 결정**하는 게 맞다고 보고 본 spec에서는 기존 방식(호출부 책임)을 유지한다.
