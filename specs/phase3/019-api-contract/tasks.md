# 019-api-contract tasks

> 입력: [`spec.md`](./spec.md) (위험도 **A** — 잘게 분할, 검증 지점 다수)
> 응답 형태 근거: [`docs/api-spec.md`](../../../docs/api-spec.md) §1~§3
> 화면 없음 — 검증은 전부 **vitest 단위 테스트**로 한다.

---

## Phase 1: Setup — 타입·상수 정비

> **독립 테스트 기준**: `npm run typecheck` 통과. `api-spec.md` §2-1 표의 5개 code 값이 상수로 존재하고, `ProblemDetails`가 실측 필드와 일치한다.

- [x] T170 `ProblemDetails` 타입 + 성공 `code` 사전 상수 추가 in src/types/api.ts — `ProblemDetails`는 실측 필드(`errors?`·`type`·`title`·`status`·`detail?`·`traceId`) 그대로. code 상수는 `LOGIN_CODE = { SYSTEM: 101, MASTER: 102, MANAGER: 103, FIELD_MANAGER: 201, WORKER: 202 }` + `isAdminLoginCode`/`isServiceLoginCode`(100번대/200번대 판별). **`code`로 성공/실패를 판정하는 헬퍼는 만들지 않는다**(spec §3 비즈니스 규칙 1 — 성공 판정은 HTTP status 2xx)
- [x] T171 [P] 응답 판별 순수 함수 in src/lib/api/responseShape.ts — `isApiResponse(body)` / `isProblemDetails(body)` / `isEmptyBody(body)` 3종. 빈 문자열·`null`·`undefined`·비객체를 모두 안전하게 처리한다(throw 금지)
- [x] T172 [P] T171 단위 테스트 in src/lib/api/__tests__/responseShape.test.ts — 래퍼/ProblemDetails/빈 문자열/`null`/`undefined`/배열/숫자 입력에 대해 3개 함수가 각각 올바른 불리언을 내는지. **어떤 입력에도 throw하지 않는다**를 명시적으로 고정

---

## Phase 2: Foundational — 에러 정규화 (모든 US 선행 blocking)

> **독립 테스트 기준**: 에러 3종(래퍼 / ProblemDetails / 빈 body)과 네트워크 실패를 넣으면, 각각에서 **사용자에게 보여줄 메시지 문자열 1개**가 나오고 어떤 입력에서도 예외가 발생하지 않는다.

- [x] T173 [US2] 에러 정규화 함수 in src/lib/api/normalizeError.ts — `AxiosError → { kind, status, message, raw }`. `kind`는 `'network' | 'wrapper' | 'problem' | 'empty' | 'unknown'`. 메시지 추출 우선순위는 spec §3 비즈니스 규칙 2를 그대로 따른다: (A)`message` → (B)`errors` 첫 항목 → (B)`detail` → (B)`title` → (C) status별 기본 문구. **빈 body는 파싱을 시도하지 않는다**(규칙 3)
- [x] T174 [US2] status별 기본 문구 테이블 in src/lib/api/normalizeError.ts — `401` 다시 로그인 필요 / `403` 권한 없음 / `404` 대상 없음 / `5xx` 서버 오류 / 그 외 일반 문구. **403 문구는 서버가 빈 body를 주므로 클라이언트가 생성한다**(`api-spec.md` §3-(C))
- [x] T175 [US2] T173·T174 단위 테스트 in src/lib/api/__tests__/normalizeError.test.ts — spec §4 엣지 케이스 표의 각 행을 1건씩: 400+래퍼 / 400+ProblemDetails(`errors` 있음) / 400+ProblemDetails(`errors` 없고 `detail`만) / 401 빈 body / 403 빈 body / 500+ProblemDetails / 네트워크 실패(`error.response` 없음) / 알 수 없는 형식. 각 케이스의 `kind`와 `message`를 고정

---

## Phase 3: US1 — 성공 응답 unwrap

> **독립 테스트 기준**: `code`가 `200`·`101`·`201` 어느 값이어도 성공으로 처리되어 `response.data`에 `data` 내용물이 담긴다. 래퍼가 아닌 2xx 응답은 거부된다.

- [x] T176 [US1] 성공 인터셉터 재작성 in src/lib/axios.ts — **`body.code !== 200` 검사 제거**(현재 `:107` 부근. 로그인 성공 `code` 101/201을 에러로 던지는 지점). 성공 판정은 HTTP 2xx로만 하고, 래퍼면 `data`를 unwrap해 통과. blob 우회는 기존대로 유지
- [x] T177 [US1] `code` 보존 탈출구 추가 in src/lib/axios.ts — 로그인·재발급처럼 `code`가 필요한 호출이 **래퍼 전체**를 받을 수 있게 한다. blob 우회와 같은 방식(요청 config 플래그). 플래그 이름·타입은 `RetriableConfig`와 같은 모듈 내 확장 타입으로 선언
- [x] T178 [US1] T176·T177 단위 테스트 in src/lib/__tests__/axios.test.ts — `code: 200`/`101`/`201` 성공 unwrap / 2xx인데 래퍼 아님 → 거부 / blob 통과 / **탈출구 플래그 시 래퍼 전체 반환**(`code` 접근 가능)

---

## Phase 4: US2 — 에러 응답 인터셉터 결합

> **독립 테스트 기준**: 서버가 어떤 형태로 에러를 주든 호출부는 정규화된 에러 1개를 받는다. 빈 body(401·403)에서 파싱 예외가 나지 않는다.

- [x] T179 [US2] 에러 인터셉터에 T173 결합 in src/lib/axios.ts — 현재 `Promise.reject(error)`로 원본 `AxiosError`를 그대로 넘기는 경로를 정규화된 에러로 교체. 네트워크 실패 정규화(현재 `:113` 부근)도 T173으로 흡수해 중복 제거. **401 refresh 분기보다 뒤에서** 동작하도록 순서 유지(401은 재발급을 먼저 시도해야 함)
- [x] T180 [US2] 403 처리 확인 in src/lib/axios.ts — 403은 **재발급을 시도하지 않는다**(권한 부족이지 만료가 아님). 현재 401만 분기하므로 코드 변경은 없을 수 있으나, 테스트로 고정한다
- [x] T181 [US2] 에러 인터셉터 테스트 in src/lib/__tests__/axios.test.ts — 400+래퍼 / 400+ProblemDetails / **401 빈 body** / **403 빈 body → 재발급 시도 없음** / 500+ProblemDetails / 네트워크 실패. 각각 정규화된 에러가 reject되고 **throw·파싱 예외가 없다**를 고정

---

## Phase 5: US3 — 토큰 재발급 실경로화

> **독립 테스트 기준**: 401을 받으면 `/api/v1/Login/W/sign/RefreshToken`으로 Bearer 헤더와 함께 재발급 요청이 나가고, `code: 201` 응답을 정상 처리해 원 요청이 재시도된다. 재발급 실패 시 로그인으로 이동한다.

- [x] T182 [US3] `REFRESH_PATH` 실경로 교체 in src/lib/axios.ts — `/api/auth/refresh` → `/api/v1/Login/W/sign/RefreshToken`. **재귀 차단 조건(`isRefreshRequest`)이 같은 상수를 참조하는지 반드시 확인** — 상수만 바꾸고 차단 조건이 옛 경로를 보면 재발급 요청의 401이 무한루프가 된다
- [x] T183 [US3] `runRefresh` 수정 in src/lib/axios.ts — ① 요청에 `Authorization: Bearer {현재 accessToken}` 부착(실측상 body + 헤더 **둘 다** 필요) ② 성공 판정을 `code !== 200` → **HTTP 2xx 기준**으로 교체(실측 `code`는 `201`) ③ refreshToken은 회전하지 않으므로 응답값이 기존과 같아도 정상 처리(spec §3 규칙 7)
- [x] T184 [US3] 재발급 흐름 테스트 in src/lib/__tests__/axios.test.ts — 401 → 재발급(`code: 201`) → 원 요청 재시도 성공 / 재발급 요청에 Bearer 헤더 존재 / **동시 401 다발 시 재발급 1회만**(single-flight) / 같은 요청 두 번째 401은 `_retry`로 차단 / **재발급 요청 자체의 401이 재귀하지 않음** / refreshToken 없음 → 재발급 생략하고 즉시 로그인 이동

---

## Phase 6: Polish

- [ ] T185 MSW 핸들러 실경로 정리 in src/mocks/handlers/auth.ts — `/api/auth/refresh` → 실경로로 교체(`code: 201` 응답). **`/api/auth/me`는 대체 핸들러를 만들지 않고 제거**(엔드포인트 자체가 없음, JWT 디코딩으로 대체 — `spec 020`). `DEV_ROLE_KEY` 스왑 로직은 `useMe`가 살아 있는 동안 유지하되, 제거 예정임을 주석으로 명시
- [ ] T186 T185로 깨지는 기존 테스트 복구 — `/api/auth/me` 의존 테스트가 있다면(`AuthGuard`·`RequireRoute`·`ProfileBadge`·`DeploymentHistoryTabs` 4파일이 후보) 최소 수정으로 green 복구. **`useMe` 자체 교체는 `spec 020` 범위** — 여기서는 핸들러 변경에 따른 복구만 한다. 복구 범위가 `useMe` 재설계로 번지면 **멈추고 보고**(A3)
- [ ] T187 [P] `docs/data-model.md` §2-1·§6 갱신 — 구현 결과와 문서 정합 확인. P0에서 이미 교정했으므로 **차이가 없으면 "변경 없음"으로 기록**하고 넘어간다(불필요한 수정 금지)
- [ ] T188 [P] `docs/roadmap.md` §12에 019 행 추가 — 결과·이월 사항 기록
- [ ] T189 `npm run verify` + `npm run test` **병렬 실행** green 확인 (CLAUDE.md A4)
- [ ] T190 DoD 대조표 작성(증거 `파일:라인`) + 본 파일 하단 "다음 spec으로 이월" 블록 작성

---

## Dependencies & Execution Order

- T170 → T173 (정규화가 `ProblemDetails` 타입을 쓴다)
- T171 → T172, T173 (판별 함수가 정규화의 입력 분기)
- T170, T171은 다른 파일이라 `[P]`
- **Phase 1 + Phase 2 전체 → Phase 3·4·5 선행** (타입·판별·정규화가 인터셉터의 재료)
- T173 → T174 → T175
- T176 → T177 → T178
- T179 → T180 → T181. **T173 완료 필수**
- T182 → T183 → T184
- **Phase 3(US1)과 Phase 4(US2)는 같은 파일(`axios.ts`)을 건드린다 → 순차.** Phase 5도 동일 파일이므로 3 → 4 → 5 순서 고정 (`[P]` 없음)
- Phase 3·4·5 → T185 → T186
- T187, T188 서로 독립 `[P]`. 모두 T186 완료 후
- T189 → T190

---

## 구현 시 유의사항 (착수 전 예상)

> 결과는 WF-4에서 "예상 → 실제"로 덧붙인다.

- **`axios.ts` 한 파일에 3개 Phase가 몰린다** — Phase 3·4·5가 모두 같은 파일이라 병렬이 불가능하고, 중간 상태에서 테스트가 깨질 수 있다. 각 Phase 끝에서 green을 확인하고 넘어간다. 한 Phase가 다른 Phase의 코드를 되돌리는 상황이 보이면 **멈추고 보고**
- **기존 동작을 보존해야 하는 것 4가지** — single-flight refresh 구조, `_retry` 재시도 1회 제한, blob 우회, `finalizeAuthFailure`(토큰 클리어 + toast 1회 + 영역별 리다이렉트). 이번 수정은 **판정 기준과 경로**를 바꾸는 것이지 흐름 구조를 바꾸는 게 아니다
- **`code` 보존 탈출구(T177)의 설계 위험** — 범용 옵션을 만들면 A6(과한 옵션 금지) 위반이다. **지금 확정된 수요는 로그인·재발급 2곳뿐**이므로 그 2곳만 커버하는 최소 형태로 둔다. 범용화가 필요해 보이면 Open Q로 등재하고 진행하지 않는다
- **`/api/auth/me` 제거의 파급(T186)이 가장 불확실** — 4개 테스트 파일이 `useMe`를 통해 간접 의존한다. `useMe` 교체는 `spec 020` 범위라 여기서는 핸들러 변경에 따른 복구만 하는데, 복구가 불가능하고 `useMe` 재설계가 필요해지면 **T185·T186을 `spec 020`으로 이월**하는 선택지를 사용자에게 보고한다
- **에러 toast 위치(spec OQ-C)는 건드리지 않는다** — 현재대로 호출부(react-query) 책임 유지. 인터셉터 일괄 toast 여부는 화면이 붙는 `spec 020`에서 실사용을 보고 결정

---

## 진행 기록

> WF-3 각 Phase 완료 시 추가.

### Phase 1 완료 — 타입·상수 정비 (2026-10-02)

- T170~T172 완료. 테스트 **136 → 167건**(+31), 파일 32 → 33
- `npm run verify` 0 errors(경고 1건은 `public/mockServiceWorker.js` 기존 MSW 생성물) + `npm run test` 33 files / 167 tests green
- **구현 중 판단 3건**
  1. **`isProblemDetails`는 `title`+`status`로만 판정** — `type`·`traceId`도 실측에 있으나 판정에서 뺐다. 서버가 그 필드를 바꾸거나 빼도 판별이 깨지지 않게 하려는 것. 식별에 필요한 최소 조건만 사용
  2. **`isEmptyBody`가 공백 문자열도 빈 것으로 본다** — 실측 401/403은 `""`였지만 프록시·게이트웨이가 개행·공백을 붙이는 경우를 대비해 `trim()` 후 판정
  3. **`code` 기반 성공 판정 헬퍼를 두지 않고 그 사유를 `api.ts`에 주석으로 남겼다** — 없는 것은 눈에 보이지 않아 나중에 다시 만들어질 수 있다. "성공 code가 200/101/201로 갈리므로 code 판정은 로그인을 실패로 만든다"를 코드에 명시
- **테스트에서 고정한 것**: 비정상 입력 9종(`null`/`undefined`/`''`/공백/일반 문자열/숫자/불리언/배열/빈 객체) × 3함수에 대해 **throw 없음**. 빈 body 파싱 사고가 019가 막으려는 핵심이라 명시적으로 못 박았다. `code: 101`/`201`도 래퍼로 식별되는지 별도 고정(Phase 3에서 바꿀 동작의 사전 고정)
- `src/lib/api/` 디렉토리 신설(기존 `src/lib/auth/`와 같은 묶음 방식). Phase 2의 `normalizeError.ts`도 여기 들어간다
- 다음: Phase 2(에러 정규화, T173~T175) → 완료

### Phase 2 완료 — 에러 정규화 (2026-10-02)

- T173~T175 완료. 테스트 **167 → 194건**(+27), 파일 33 → 34
- `npm run verify` 0 errors + `npm run test` 34 files / 194 tests green
- `normalizeError(AxiosError) → { kind, status, message, raw }`. `kind`는 `network`/`wrapper`/`problem`/`empty`/`unknown` 5종
- **계획 대비 변경 1건**: `errors` 첫 항목 추출을 인덱스 접근(`Object.values()[0][0]`)에서 `.flat().find()`로 바꿨다. 계획대로면 `errors: { siteSeq: [] }`처럼 **키는 있는데 배열이 빈 경우** `undefined[0]`로 터진다. 서버가 그런 응답을 줄지는 미확인이나, 이 함수의 존재 이유가 "어떤 형태가 와도 안 터진다"라서 방어하는 쪽을 택했다(동작 동일, 한 줄 차이)
- **테스트에서 고정한 핵심**: 비정상 body 8종에 대해 **throw 없음 + `message.length > 0`**. 빈 메시지가 나오면 화면에 아무것도 안 뜨는 더 나쁜 상황이 되므로 "문구가 반드시 하나 나온다"를 보장한다
- `kind`를 소비하는 곳은 아직 없다 — Phase 4에서 403 재발급 제외 판정에 쓰고, 실사용은 화면이 붙는 `spec 020`부터
- 다음: Phase 3(성공 unwrap, T176~T178) — **여기부터 `axios.ts` 직접 수정** → 완료

### Phase 3 완료 — 성공 응답 unwrap (2026-10-02)

- T176~T178 완료. 테스트 **194 → 208건**(+14), 파일 34 → 35
- `npm run verify` 0 errors + `npm run test` 35 files / 208 tests green
- **핵심 수정**: `if (body.code !== 200) throw` 제거. 성공 판정을 HTTP 2xx 전담으로 바꾸고 `code`는 해석하지 않고 통과시킨다. 형식 검증 인라인 로직은 Phase 1의 `isApiResponse`로 교체
- **계획 대비 변경 1건**: `_raw`를 `RawResponseConfig` 타입 캐스팅이 아니라 **axios 모듈 확장**으로 선언했다. 계획대로면 `InternalAxiosRequestConfig`가 `headers`를 필수로 요구해 호출부 캐스팅이 지저분해지고, `spec 020`의 로그인·재발급 두 곳이 모두 그 모양이 된다. 모듈 확장이면 호출부는 `{ _raw: true }`만 넘기고 읽는 쪽도 `response.config._raw`로 캐스팅이 사라진다. **기존 `_retry`는 건드리지 않았다**(A3)
- **테스트 신규**: `src/lib/__tests__/axios.test.ts`. 003 이후 `axios.ts`에 테스트가 없었다. **패키지를 추가하지 않고** `api.defaults.adapter`를 교체하는 방식 — axios 공개 확장점이고 인터셉터 체인을 실제로 통과시킨 결과를 검증한다
- **가장 중요한 회귀 방지선**: 로그인 성공 code 5종(101·102·103·201·202)을 `it.each`로 전부 고정. 기존 코드가 막던 지점이다
- 다음: Phase 4(에러 인터셉터 결합, T179~T181) → 완료

### Phase 4 완료 — 에러 인터셉터 결합 (2026-10-02)

- T179~T181 완료. 테스트 **208 → 215건**(+7), 파일 35 유지
- `npm run verify` 0 errors + `npm run test` 35 files / 215 tests green
- **`axios.ts` 변경 3지점**: 네트워크 실패 인라인 `new Error(...)` 삭제(정규화가 같은 문구로 흡수) / 재발급 실패 후 reject / 최종 reject(403 포함). **401 refresh 분기는 위치·로직 모두 무변경** — 재발급을 먼저 시도해야 하므로 정규화보다 앞이어야 한다
- **계획 대비 변경 없음**. 계획대로 `ApiError extends Error`로 감쌌다 — 정규화 결과를 그대로 reject하면 `instanceof Error`가 false가 되어 기존 `error.message` 접근부·에러 바운더리가 깨진다. `message`는 사용자 문구, `detail`/`kind`/`status`는 추가 분기용
- **403 재발급 제외를 요청 횟수로 고정**: 어댑터가 호출 URL을 기록하게 해서 403일 때 `RefreshToken` 경로가 **한 번도 호출되지 않음**을 확인. 토큰을 둘 다 넣은 상태로 돌려 "토큰이 없어 재발급을 안 한 것"이 아님도 확실히 했다. 기존에는 "401만 분기하니 자연히 그렇다"는 암묵적 상태였는데 명시적 계약이 됐다
- **테스트 작성 실수 1건(자체 수정)**: `403 빈 body` 검증을 `rejects.not.toThrow()`로 썼다가 실패. 403은 reject되는 게 정상인데 "거부되지 않음"을 검증하는 꼴이었다. 의도대로 `SyntaxError`/`TypeError`가 아니고 `name === 'ApiError'`인지 보도록 고쳤다 — **빈 body를 JSON 파싱하면 나는 예외**가 019가 막으려는 사고라서 그걸 직접 겨냥한다
- 다음: Phase 5(재발급 실경로화, T182~T184) → 완료

### Phase 5 완료 — 토큰 재발급 실경로화 (2026-10-02)

- T182~T184 완료. 테스트 **215 → 224건**(+9), 파일 35 유지
- `npm run test` 35 files / 224 tests green
- **재발급이 동작하지 않던 3가지를 고쳤다**
  1. 경로 `/api/auth/refresh` → `/api/v1/Login/W/sign/RefreshToken`
  2. `Authorization: Bearer {accessToken}` 부착 — 실측상 body의 `refreshToken`과 헤더를 **둘 다** 요구한다
  3. 성공 판정 `code !== 200` → HTTP 2xx + 토큰 존재 여부. 실측 재발급 성공 code는 **201**이라 기존 검사는 항상 실패했다
- 재귀 차단(`isRefreshRequest`)은 이미 `REFRESH_PATH` 상수를 참조하고 있어 자동 정합. 테스트로 고정
- 🔴 **테스트가 Phase 4의 누락을 잡았다** — `refreshToken` 부재 분기(`:164`)만 정규화에서 빠져 원본 `AxiosError`를 던지고 있었다. "모든 에러는 `ApiError`로 정규화된다"는 계약이 깨진 상태. Phase 4 종료 시 전체 green이었는데도 안 잡힌 이유는 **그 경로를 덮는 테스트가 그때 없었기** 때문이다. 수정 후 `Promise.reject` 4곳 전수 확인
- **테스트 설계**: `runRefresh`는 재귀 회피를 위해 **인터셉터를 타지 않는 전역 axios**를 쓴다. `api.defaults.adapter`만 바꾸면 재발급 요청이 안 잡혀서 `axios.defaults.adapter`도 함께 깔았다(패키지 추가 없음, `afterEach`에서 둘 다 원복)
- **덮은 케이스 9건**: 재시도 성공 / 실경로 / Bearer 헤더 / refreshToken 무회전 / 동시 401 → 재발급 1회 / 재발급 후 401 → `_retry` 차단(요청 2회로 종료) / 재발급 경로 자체의 401 → 재귀 없음 / refreshToken 부재 / 재발급 실패 시 토큰 클리어
- 다음: Phase 6(MSW 정리·문서·DoD, T185~T190)
