# 003-auth-foundation spec

> 위험도: **A** (인증·권한 — `roadmap.md` §3 "주 위험도 A" / `CLAUDE.md` A 정의에 부합)
> 관련 화면: 없음 (인프라). 사용처는 Phase 1 AuthGuard 실제화, Phase 3 `/login` 실구현, 모든 화면 액션 권한.
> Phase: `roadmap.md` Phase 0 (분할 3번째 묶음)
>
> 본 spec은 화면이 기대는 **인증 인프라**(자동 토큰 갱신 · 본인 정보 훅 · 액션 권한 가드 헬퍼)만 다룬다.
> **AuthGuard 본체 연결(`isAuthentication=true` 제거 + 실 토큰 검사 + 영역별 분기)은 Phase 1 — Layout Plus 책임**(`roadmap.md` §4)이므로 본 spec 범위 밖이다. 로그인 화면 실구현은 Phase 3.

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `002-lint-cleanup`. 이월 블록(`tasks.md` §"다음 spec으로 이월")에서 옮김.

- [ ] **002 T029 — set-state-in-effect 4개 화면(AppTabs / LocationTabs / PointsPage / ZonesPage) 수동 회귀 미완** → **본 spec 범위 외**. AuthGuard 본체 연결이 선행돼야 안정적 수동 검증이 가능한데, 본 spec은 인증 인프라만 다루고 AuthGuard는 Phase 1이다. → **Phase 1 — Layout Plus(AuthGuard 실제화) 작업 시 동시 검증**으로 재이월. 본 spec 종료 시 `002/tasks.md` 이월 블록을 갱신한다.
- [ ] **001 T011/T012 — `src/App.tsx` 데모 런타임 미검증**(useQuery unwrap + mutation 실패 toast) → **본 spec에서 해소**. 003의 `useMe()`가 실제 `/auth/me` 호출로 useQuery unwrap 패턴을 실증하고, refresh 실패 시 toast가 `queryClient.ts`의 `MutationCache.onError` 패턴을 실증한다. → 데모 파일(`src/App.tsx`) 제거를 §5 DoD에 포함.
- [ ] 001 Open Q — react-query 기본 옵션(`staleTime`/`retry` 잠정안) → **본 spec 범위 외**. Phase 3 화면 작업 시 체감 후 확정. (useMe는 잠정안 그대로 사용)
- [ ] 001 Open Q — MutationCache 전역 toast vs 화면별 onError 우회 → **본 spec 범위 외**. 발생 시 검토.
- [ ] 002 Open Q — set-state 옮긴 페이지 중 URL 쿼리스트링 동기화 필요 여부 → **본 spec 범위 외**. `004-dev-infrastructure`에서 `useQueryParams` 정형화와 함께 처리.

---

## User Stories

- US1. (자동 갱신) 사용자가 화면 사용 중 accessToken이 만료되어 401이 떨어지면 → axios 인터셉터가 `/auth/refresh`를 자동 호출해 신규 토큰을 받고 원 요청을 재시도해 작업이 끊기지 않는다.
- US2. (재방문 동기화) 사용자가 새로고침/재방문하면 → 저장된 토큰으로 `useMe()`가 `/auth/me`를 동기화해 본인 정보(`MeDto`)가 즉시 상태에 채워진다.
- US3. (만료 종료) refreshToken까지 만료/거부되면 → 토큰을 정리하고 현재 경로를 `?redirect=`로 보존한 채 영역별 로그인(`/* → /login`, `/admin/* → /admin/login`)으로 이동한다.
- US4. (액션 권한) 화면 내 액션이 `<RequireRole roles={[...]}>`로 감싸지면 본인 role이 포함될 때만 자식이 렌더된다.

---

## 1. 목적

화면이 기대는 인증 인프라를 갖춰, **Phase 1 이후 모든 화면이 토큰 만료·본인 정보·액션 권한 분기를 직접 다루지 않게** 한다.
본 spec은 axios 인터셉터에 401 → refresh 흐름과 토큰 부착을 추가하고, react-query 기반의 `useMe()`와 UI 액션 가드 컴포넌트 `<RequireRole>`을 제공한다. AuthGuard 본체 연결과 로그인 화면 구현은 각각 Phase 1·Phase 3 책임이라 본 spec에서 다루지 않는다.

---

## 2. I/O

### Input

- **API** (data-model.md §4-3)
  - `POST /api/auth/refresh` → `ApiDetailResponse<{ accessToken: string; refreshToken: string }>`
  - `GET /api/auth/me` → `ApiDetailResponse<MeRaw>`
- **저장소**: `localStorage`
  - `accessToken: string` / `refreshToken: string`
- **env**: `VITE_API_BASE_URL` (기존 `src/lib/axios.ts`에서 사용 중)
- **현재 경로**: `window.location.pathname + search`(인터셉터는 라우터 외부 컨텍스트이므로 `useLocation` 불가)

### Output

- **axios 요청 인터셉터** — accessToken 존재 시 `Authorization: Bearer ${accessToken}` 자동 부착 (`src/lib/axios.ts` 확장)
- **axios 응답 인터셉터 (401 분기)** — 401 응답 시 single-flight refresh → 신규 토큰 저장 → 원 요청 재시도(1회) → 실패 시 토큰 클리어 + 영역별 로그인 리다이렉트
- **토큰 헬퍼** `src/lib/auth/tokens.ts` — `getAccessToken / setAccessToken / getRefreshToken / setRefreshToken / clearTokens`
- **리다이렉트 헬퍼** `src/lib/auth/redirect.ts` — `redirectToLogin(currentPath)` (`/admin/` prefix → `/admin/login?redirect=...`, 그 외 → `/login?redirect=...`)
- **`useMe()` 훅** `src/features/auth/hooks/useMe.ts` — queryKey `['auth','me']`, MeRaw → MeDto 변환은 react-query `select`에서
- **`<RequireRole>` 컴포넌트** `src/features/auth/components/RequireRole.tsx` — `roles: Role[]`, optional `fallback?: ReactNode`
- **데모 제거** — `src/App.tsx`(001 T011/T012 임시 데모) 파일 삭제

---

## 3. 제약

### 기술 제약

- **재사용 컴포넌트/훅**: 없음(본 spec이 신규 제공). 후속 spec은 `useMe` / `<RequireRole>`만 사용해 권한 분기.
- **라이브러리**: 신규 의존성 없음. 기존 `axios` · `@tanstack/react-query` · `react-router-dom` 사용.
- **토큰 부착**: 요청 인터셉터에서 `getAccessToken()` 호출. accessToken 없으면 헤더 미부착(서버 401 → 로그인 이동 흐름에 위임).
- **single-flight refresh**: 동시 401 폭주 시 refresh 호출은 한 번만. 진행 중 Promise를 모듈 스코프 변수로 보유하고 모든 401 콜백이 같은 Promise를 await한다.
- **재시도 무한루프 방지**: 원 요청 config에 `_retry: true` 마커. 두 번째 401에서는 재시도 없이 reject.
- **/auth/refresh 자체는 분기에서 제외**: `config.url`이 refresh 엔드포인트면 일반 reject(재귀 방지).
- **MeRaw → MeDto 변환은 `select`에서**: `data-model.md` §4-3의 `MeDto` 형태로만 화면에 노출. 변환 헬퍼는 `useMe` 모듈 내부에 두고 export하지 않는다(외부 의존 차단).
- **react-query 옵션**: 001 잠정안(`staleTime: 30_000`, `retry: 1`) 유지. 본 spec에서 재조정 없음.
- **영역 판별**: `window.location.pathname.startsWith('/admin')` 기준. 라우트 상수 SSOT(004)와 동기화 전까지 문자열 리터럴 허용 — 004 도입 시 교체.
- **lib/axios.ts 손대는 영역만 수정**: 기존 응답 인터셉터의 ApiResponse unwrap 로직은 그대로. 401 분기를 그 앞에 삽입.
- **`<RequireRole>`은 UI 액션 가드**: 라우트 가드 아님. 라우트 단위 권한 분기는 Phase 1 AuthGuard 실제화 책임.

### 비즈니스 규칙

- **WORKER role은 WEB 접근 불가**(`flow.md` §0). `useMe()` 응답이 WORKER여도 본 spec은 화면 차단을 하지 않고, `<RequireRole>`에 `WORKER`를 포함시키지 않은 모든 사용처에서 자연스럽게 자식이 렌더되지 않는다. 라우트 단위 차단은 Phase 1.
- **토큰 갱신은 묵시적**: refresh가 성공적으로 토큰을 갱신할 때 toast/알림 노출 없음. 사용자가 인지하지 않게.
- **refresh 실패 시 toast 1회**: 영역 이동 직전 "다시 로그인이 필요합니다" 안내. 중복 호출 방지를 위해 single-flight 흐름의 종단 1회만.
- **현재 경로 보존**: refresh 실패 → 로그인 이동 시 현재 경로를 `?redirect=`에 그대로 담는다(다음 spec 로그인 화면이 활용. 본 spec은 작성만).

---

## 4. 엣지 케이스

- **동시 401 폭주(in-flight 다수)** → single-flight: refresh 1회, 나머지는 신규 토큰을 받은 뒤 자동 재시도. 큐는 진행 중 Promise 참조로 충분.
- **refresh 응답이 4xx/5xx** → 즉시 `clearTokens()` + toast 1회 + `redirectToLogin(currentPath)`. 진행 중이던 다른 401 요청은 모두 같은 실패로 reject(공유 Promise).
- **재시도 후 또 401** → 원 요청 `_retry` 마커가 true이므로 재시도 없이 reject(무한루프 차단).
- **accessToken/refreshToken 둘 다 없음**(미인증 상태) → 요청 인터셉터는 헤더 미부착. 401 받으면 refreshToken 없음을 확인하고 refresh 시도 없이 곧장 로그인 이동.
- **localStorage 값 손상/타입 비정상** → getter는 항상 `string | null` 반환(부적합 값은 `null` 취급, 자동 클리어는 하지 않음 — 비파괴 원칙).
- **/auth/me 자체 401** → 일반 응답 분기와 동일 흐름(refresh → 재시도). refresh 실패 시 로그인 이동. `useMe.error`는 호출부에 노출되지 않고 인터셉터가 흐름을 끝낸다.
- **/auth/me 응답 형식 비정상** → 기존 axios 응답 인터셉터의 ApiResponse 검증이 throw. `useMe`는 error 상태. `<RequireRole>`은 `data === undefined`이면 자식 렌더 안 함(보수적).
- **로딩 상태(useMe.isLoading)** → `<RequireRole>`은 fallback prop(또는 null) 표시. children을 조기 노출해 권한 누설 깜빡임 발생하지 않게.
- **권한 미일치** → children 렌더 안 함. fallback 있으면 fallback, 없으면 null.
- **로그아웃 진행 중 in-flight 요청** → 토큰 클리어 후 다음 401에서 refreshToken 없음 → refresh 시도 없이 reject + 로그인 이동. 정상 정리.
- **다중 탭 동기화** → 본 spec 범위 외. 다른 탭의 로그아웃은 그 탭의 다음 401에서 자연스럽게 로그인 이동. `storage` 이벤트 listen 도입은 후속 spec(Open Q).

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필요**.

- [ ] `src/lib/auth/tokens.ts` — `getAccessToken` / `setAccessToken` / `getRefreshToken` / `setRefreshToken` / `clearTokens` 5종 구현, 손상 값은 `null` 취급
- [ ] `src/lib/axios.ts` 요청 인터셉터 — accessToken 존재 시 `Authorization: Bearer` 헤더 자동 부착(없으면 미부착)
- [ ] `src/lib/axios.ts` 응답 인터셉터 — 401 분기에서 single-flight refresh + 원 요청 재시도(1회) + `_retry` 마커로 무한루프 차단 + `/auth/refresh` 자체는 분기에서 제외
- [ ] `src/lib/auth/redirect.ts` — `redirectToLogin(currentPath)` 헬퍼, `/admin/` prefix 분기, `?redirect=` 쿼리에 현재 경로 보존
- [ ] refresh 실패 → `clearTokens()` + toast 1회("다시 로그인이 필요합니다") + `redirectToLogin` 호출
- [ ] `src/features/auth/hooks/useMe.ts` — react-query, queryKey `['auth','me']`, `select`로 MeRaw→MeDto 변환, `staleTime: 30_000` / `retry: 1`(001 잠정안)
- [ ] `src/features/auth/components/RequireRole.tsx` — `roles: Role[]` / optional `fallback` props, 로딩/미인증/권한 미일치 시 children 렌더 안 함
- [ ] `src/App.tsx` 데모 파일 제거 — 001 T011/T012 검증은 `useMe`의 useQuery unwrap + refresh 실패 toast 흐름으로 대체됨을 메모
- [ ] `npm run verify` exit 0 (typecheck + lint)
- [ ] 본 spec 종료 시 `specs/phase0/002-lint-cleanup/tasks.md`의 이월 블록에서 T029 항목에 "→ Phase 1 — AuthGuard 실제화로 재이월" 표시

---

## 참고

- 직전 spec: `specs/phase0/002-lint-cleanup/`
- 다음 spec 후보: `004-dev-infrastructure` (paths/env/Enum/`useQueryParams`/MSW/vitest/AppFormField/ErrorBoundary)
- 데이터 모델: `data-model.md` §4-3 인증/본인 정보, §6 에러 응답
- 흐름: `flow.md` §0 진입/공통, §3-2 가드 실패
- 로드맵: `roadmap.md` §3 Phase 0 003 행
- 워크플로우: `workflow-protocol.md` WF-1 ~ WF-5

---

## Open Questions

- [ ] `<RequireRole>`의 **라우트 가드 변형** 필요 여부 — Phase 1 AuthGuard 실제화 시 라우트 단위 role 분기 패턴이 필요할 수 있다. 본 spec은 UI 액션 가드만 제공.
- [ ] **다중 탭 토큰 동기화**(`storage` 이벤트 listen) 도입 여부 — 일단 미도입. 한 탭 로그아웃을 다른 탭이 즉시 인지해야 하는 요구가 발생하면 검토.
- [ ] **JWT 사전 만료 검사** — 본 spec은 서버 401 응답 기반만. 만료 임박 시 사전 갱신(slidng window refresh) 도입 여부는 백엔드 토큰 수명 확정 후.
- [ ] **`/auth/refresh` 응답이 별도 status code**(예: 419 = 만료)로 만료를 표현할지 — 백엔드 확정 시 401 분기에 OR 추가.
- [ ] **redirectToLogin의 현재 경로 소스** — 본 spec은 `window.location` 사용(인터셉터가 라우터 외부 컨텍스트). 라우터 안쪽에서 호출하는 별도 헬퍼가 필요해지면 분리.
- [ ] **영역 prefix 문자열**(`/admin/`) 하드코딩 → 004 라우트 상수 SSOT 도입 시 교체.
