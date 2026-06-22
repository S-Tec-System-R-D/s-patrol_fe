# 004-dev-infrastructure spec

> 위험도: **B** (도구·SSOT — 인증·권한·데이터 변형 없음. `roadmap.md` §3 "주 위험도 A"는 phase 단위 기준이며 본 spec 항목 8종 모두 인프라/SSOT/테스트 도구라 A 정의에 부합하지 않음. 다른 의견 있으면 검토 단계에서 조정)
> 관련 화면: 없음 (인프라). 사용처는 Phase 1 이후 모든 화면.
> Phase: `roadmap.md` Phase 0 (분할 4번째 묶음 — Phase 0 마지막 spec)
>
> 본 spec은 Phase 0의 잔여 인프라 항목 **8종**(paths / env / Enum / `useQueryParams` / MSW / vitest / AppFormField / ErrorBoundary)을 한 번에 처리한다. 다음 phase(Layout Plus)로 넘어가기 위한 마지막 토양.

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `003-auth-foundation`. 이월 블록(`tasks.md` §"다음 spec으로 이월")에서 옮김.

- [ ] **003 — 영역 prefix(`/admin/`) 하드코딩 → 라우트 상수 SSOT 교체** → **본 spec에서 해소**. `src/lib/auth/redirect.ts`가 paths 상수를 import해 사용하도록 갱신.
- [ ] **003 — URL 쿼리스트링 동기화(`useQueryParams`) 정형화**(002 이월 잔여) → **본 spec에서 해소**. US3 핵심.
- [ ] 003 — 인증 인프라 대상 단위 테스트(single-flight refresh / RequireRole / redirectToLogin) → **본 spec 범위 외**. vitest 도입까지만 본 spec에서 처리. 003 코드 대상 단위 테스트 작성은 Phase 1 작업 흐름에 자연 흡수.
- [ ] 003 — `<RequireRole>` 라우트 가드 변형 / `?redirect=` 쿼리 활용 / 다중 탭·JWT·refresh status code Open Q → **본 spec 범위 외**(각각 Phase 1 / Phase 3 / 백엔드 연동 시점).
- [ ] 003 — 002 T029 수동 회귀 → 본 spec 범위 외. **Phase 1**(AuthGuard 실제화)로 이미 재이월됨.
- [ ] 001 — react-query 기본 옵션(`staleTime` / `retry`) / MutationCache 우회 Open Q → 본 spec 범위 외. Phase 3에서 체감 후 확정.

---

## User Stories

- US1. (라우트·env SSOT) 모든 코드가 `src/router/paths.ts` 상수로 라우트를 참조하고, env(`VITE_API_BASE_URL` 등)로 환경별 base URL을 분기한다.
- US2. (Enum SSOT) Role / UserStatus / AuthMethod 등 enum이 `src/types/enum.ts`에 단일화되고 화면 표시용 라벨 매핑이 함께 제공된다. 003에서 `features/auth/types/me.ts`로 임시 거주하던 Role 계열을 enum.ts로 이관한다.
- US3. (URL 상태 표준) 화면이 `useQueryParams<T>()` 훅을 통해 검색·필터·정렬 상태를 URL 쿼리스트링에 일관되게 읽고 쓴다. 003에서 작성한 `redirect.ts`의 prefix 하드코딩도 본 spec paths로 교체.
- US4. (테스트 인프라 — MSW + vitest) 백엔드 연결 전 단위·통합 테스트가 가능하다. MSW 핸들러는 도메인별 분할(`src/mocks/handlers/{auth,points,zones,...}`), vitest는 jsdom 환경 + `@testing-library/react` + MSW setupFile 통합.
- US5. (AppFormField 도입) `label / required / error / hint` 폼 영역이 컨테이너 컴포넌트로 분리되어 새 폼 컴포넌트(Phase 2 AppSelect / AppDatePicker)가 동일 패턴을 따른다. `AppInput`은 폼 영역 props를 deprecation 마킹(즉시 제거 X, 점진 이관).
- US6. (안전망 — ErrorBoundary) 페이지 단위 ErrorBoundary가 렌더 예외를 잡아 fallback 화면을 보여준다.

---

## 1. 목적

Phase 0의 잔여 인프라 항목을 일괄 처리해, **Phase 1 이후 어떤 화면도 라우트·env·Enum·URL 상태·테스트·폼 구조·에러 경계를 직접 다루지 않아도 되게** 한다. 후속 spec(Phase 1~5)이 안정적으로 출발할 수 있는 마지막 토양.

특히 다음 두 항목은 본 spec 외에는 해소될 곳이 없는 미해소 결정:
- `design-system.md` §6 Open Q "AppFormField 도입 + 구조 분석" — **본 spec에서 해소** (D9로 design-system.md §5에 추가)
- 003에서 잠정으로 둔 `/admin/` 하드코딩 → paths 상수 교체

---

## 2. I/O

### Input

- 기존 자산:
  - `src/lib/axios.ts` env 사용(`VITE_API_BASE_URL`)
  - `src/features/auth/types/me.ts` Role / UserStatus(003에서 도입)
  - `src/features/{points,zone}/{mock,mocks}/*.ts` 도메인별 mock 데이터(데이터 자체는 보존, MSW 핸들러가 import)
  - `src/components/app/AppInput.tsx` (label/error/required 흡수 상태)
  - `src/lib/auth/redirect.ts` 의 `/admin/` 하드코딩
- 외부:
  - 추천 라이브러리 신규: **`msw`**, **`vitest`**, **`@testing-library/react`**, **`@testing-library/jest-dom`**, **`jsdom`**

### Output

**US1 — paths / env**
- `src/router/paths.ts` — 라우트 상수 SSOT. `service`/`admin`/`auth` 그룹으로 묶음. 동적 세그먼트(`:id`)는 함수 형태(`adminLocationDetail(id)`).
- 기존 `src/router/index.tsx` 라우트 정의가 paths 상수를 사용하도록 갱신.
- env: `VITE_API_BASE_URL` 외 신규 추가 — `VITE_USE_MSW`(string `'true'`로 비교, 추천 default 미지정 = MSW off), `VITE_ENV`(`development|test|production`, 표시 전용).
- `.env.example` 갱신.

**US2 — Enum SSOT**
- `src/types/enum.ts` — `AdminRole` / `FieldRole` / `Role` / `UserStatus` / `WorkStatus` / `LocationStatus` / `AuthMethod` / `CourseResult` / `PointResult` / `DayOfWeek` (data-model.md §2-2 그대로).
- 같은 파일에 화면 표시용 **라벨 매핑** `roleLabel: Record<Role, string>` / `userStatusLabel` 등.
- 003 `src/features/auth/types/me.ts` 는 `Role` / `AdminRole` / `FieldRole` / `UserStatus`를 enum.ts에서 re-export. `MeRaw` / `MeDto`만 그대로 유지(도메인 타입이라 features 폴더에 잔류).

**US3 — useQueryParams**
- `src/hooks/useQueryParams.ts` — react-router `useSearchParams` 위 얇은 래퍼.
  - API: `const [params, setParams] = useQueryParams<T>(defaults?)`
  - `params`는 `Record<string, string | undefined>`(타입 매개변수 `T`는 키 union으로만 사용). 파싱·검증(zod 등)은 호출부 책임 — 본 spec은 read/update primitive만.
  - `setParams`는 부분 갱신(merge) + `replace?: boolean` 옵션. 빈 문자열/undefined는 키 제거.
- `src/lib/auth/redirect.ts` — `paths.adminLogin` / `paths.serviceLogin`을 import해 하드코딩 제거. 영역 판별도 paths 상수 기반으로(또는 그대로 `/admin` prefix 검사하되 상수와 정합).

**US4 — MSW + vitest**
- `src/mocks/handlers/index.ts` — 도메인별 `auth.ts` / `points.ts` / `zones.ts` 핸들러 모듈 묶음.
  - 초기 도입은 **auth만**(`/api/auth/me`, `/api/auth/refresh`) — 003 인증 인프라가 즉시 의존. 도메인 핸들러는 점진 이관(roadmap "기존 features/{도메인}/mock/* 이관").
- `src/mocks/browser.ts` — `setupWorker(...)`. dev 환경 `VITE_USE_MSW === 'true'`일 때만 `main.tsx`에서 동적 import 후 `worker.start()`.
- `src/mocks/server.ts` — `setupServer(...)`. 테스트 환경(vitest)용. setupFile에서 listen/restore/close.
- `vitest.config.ts` — `environment: 'jsdom'` / `setupFiles: ['./src/test/setup.ts']` / Vite 플러그인(React) 재사용.
- `src/test/setup.ts` — `@testing-library/jest-dom` import + MSW server lifecycle.
- `package.json` 스크립트: `test` (`vitest run`) / `test:watch` (`vitest`).
- `npm run verify` 정의에는 영향 없음(test는 별도 명령. 단위 테스트는 본 spec 다음 단계에서 점진 추가).

**US5 — AppFormField**
- `src/components/app/AppFormField.tsx` — props: `label?: string` / `required?: boolean` / `error?: string` / `hint?: string` / `children`. 컨테이너만 담당. 내부는 `<label> + children + (error|hint)` 구조.
- `src/components/app/AppInput.tsx` — props 그대로 유지하되 `label` / `error` / `required` 세 props에 JSDoc `@deprecated` 추가 + 콘솔 경고는 추가하지 않음(소음 회피).
- 신규 폼 컴포넌트(Phase 2 AppSelect 등)는 AppFormField로 감싸는 패턴을 표준으로 한다.
- 기존 6개 폼 파일(`features/{zone,points}/form/*Form.tsx`)은 **본 spec에서 마이그레이션하지 않음**(A3 최소 변경 — 해당 화면 작업 시 자연 교체. Phase 3 화면 spec이 흡수).
- `design-system.md` §5에 **D9. AppFormField + AppInput 역할 분리** 결정 기록 추가. §6 Open Q에서 해당 항목 제거.

**US6 — ErrorBoundary**
- `src/components/app/AppErrorBoundary.tsx` — class component(React 본체만, 신규 라이브러리 없음). `fallback?: ReactNode` 또는 `fallbackRender?: (error) => ReactNode` props.
- 라우트 트리: 각 페이지 element를 감싸는 헬퍼(예: `withErrorBoundary(<Page/>)`) 또는 router 정의에 `errorElement` 활용. 추천: **react-router v7의 `errorElement` 사용**(라우트 로더 에러도 함께 잡힘).
- 전역 fallback도 router의 최상위 route에 `errorElement` 1개.

### env 분기 정책

| key | dev | test | prod |
|---|---|---|---|
| `VITE_API_BASE_URL` | 서버 IP(또는 빈 문자열 → MSW 사용 시 무시) | (테스트는 MSW가 가로채므로 무시) | `s-patrol.co.kr` + 백엔드 prefix |
| `VITE_USE_MSW` | `'true'`로 켜고 끔(개발자 선택) | (vitest는 server.ts로 자동 가동) | 미지정 |
| `VITE_ENV` | `development` | `test` | `production` |

---

## 3. 제약

### 기술 제약

- **신규 라이브러리**: `msw` / `vitest` / `@testing-library/react` / `@testing-library/jest-dom` / `jsdom`. devDependencies. 그 외 신규 의존성 없음.
- **AppInput 호환 유지**: `label` / `error` / `required` props는 deprecation 마킹만, 동작은 그대로(기존 6개 폼 파일이 깨지지 않게).
- **MSW 활성화는 opt-in**: dev에서도 `VITE_USE_MSW=true`일 때만 worker 시작. 실 백엔드 붙일 때 즉시 토글 가능.
- **MSW 핸들러는 점진 이관**: 본 spec에서는 `auth.ts`만 가동. 도메인 핸들러는 해당 도메인 spec(Phase 3+)에서 이관.
- **`useQueryParams`는 read/update primitive만**: zod 파싱·디폴트 채움 등 고급 기능은 화면 spec에서 추가(Phase 3 `/patrol/zones` 등).
- **paths 상수는 문자열 리터럴 + 함수**: 동적 세그먼트는 `(id: string) => '/admin/locations/' + id` 형태. 라우트 정의는 `<Route path={paths.adminLocationDetailPattern}>` 같은 별도 패턴 상수 필요 — 둘 다 paths.ts에 둔다.
- **ErrorBoundary**: react-router v7의 `errorElement` 우선. 자체 `AppErrorBoundary`는 라우터 외부 영역(예: 일반 컴포넌트 래핑)에 사용.
- **003 me.ts 이관**: enum.ts가 Role 계열을 가지면, me.ts는 re-export만 남기거나 import로 갱신. 둘 다 안전. 추천: **me.ts에서 Role / AdminRole / FieldRole / UserStatus를 enum.ts에서 import해 사용**, me.ts 자체는 Role의 출처가 아닌 형태로 정리. 외부에서 me.ts를 통해 import한 003 코드(예: redirect.ts, RequireRole.tsx)는 그대로 두되, 새 코드부터 enum.ts를 사용.

### 비즈니스 규칙

- 본 spec 자체는 UI/도메인 로직 변경 없음. 인프라 정비.
- vitest 도입 후 003 인증 인프라 단위 테스트 작성은 **본 spec 외**. 별 작업으로 분리(Phase 1 일정과 함께).

---

## 4. 엣지 케이스

공통 규칙 따름 (B급).

추가로 고려:
- **MSW 활성화 시 실 백엔드 우회 누락**: dev에서 `VITE_USE_MSW=true`인데 실 백엔드를 같이 띄워 디버그하고 싶을 때는 env 토글로 즉시 끔.
- **paths 변경 시 라우터·redirect 동시 갱신 누락**: redirect.ts 단일 사용처라 grep 누락 없을 것이나 PR 단위로 한 번 검증.
- **AppInput deprecation 콘솔 경고 없음**: 점진 마이그레이션 의도. 새 폼은 AppFormField 패턴 follow(`patterns.md` 또는 `components.md` 가이드 추가 필요).

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필요**.

- [ ] `src/router/paths.ts` — service / admin / auth 그룹 + 동적 세그먼트 함수 + 라우터용 패턴 상수
- [ ] `src/router/index.tsx` — 라우트 정의가 paths 상수를 import해 사용
- [ ] `src/lib/auth/redirect.ts` — paths 상수 import로 하드코딩 제거 (003 Carry-over 해소)
- [ ] `.env.example` — `VITE_API_BASE_URL` / `VITE_USE_MSW` / `VITE_ENV` 3종 키 포함
- [ ] `src/types/enum.ts` — data-model.md §2-2 enum 10종 + 라벨 매핑
- [ ] `src/features/auth/types/me.ts` — Role/UserStatus 계열이 enum.ts를 import해 사용. `MeRaw` / `MeDto`는 잔류
- [ ] `src/hooks/useQueryParams.ts` — `[params, setParams]` 튜플 반환, setParams 부분 갱신 + replace 옵션
- [ ] `src/mocks/handlers/auth.ts` + `src/mocks/handlers/index.ts` — `/api/auth/me` / `/api/auth/refresh` 핸들러
- [ ] `src/mocks/browser.ts` + `src/main.tsx` — `VITE_USE_MSW === 'true'`일 때만 동적 import + `worker.start()`
- [ ] `src/mocks/server.ts` + `src/test/setup.ts` — vitest server lifecycle
- [ ] `vitest.config.ts` — jsdom + setupFiles
- [ ] `package.json` — `test` / `test:watch` 스크립트
- [ ] `src/components/app/AppFormField.tsx` — label/required/error/hint + children 컨테이너
- [ ] `src/components/app/AppInput.tsx` — label/error/required props에 `@deprecated` JSDoc 마킹
- [ ] `docs/design-system.md` §5에 **D9. AppFormField + AppInput 역할 분리** 추가 + §6 Open Q 해당 항목 제거
- [ ] `docs/components.md` AppFormField 사용 가이드 1절 추가 + AppInput deprecation 메모
- [ ] `src/components/app/AppErrorBoundary.tsx` — class component + fallback / fallbackRender
- [ ] `src/router/index.tsx` — 최상위 route + 페이지 element에 `errorElement` 적용
- [ ] `npm run verify` exit 0
- [ ] `npm run test` 통과 (스모크 1개 — `expect(true).toBe(true)` 수준이라도, vitest 동작 증명)

---

## 참고

- 직전 spec: `specs/phase0/003-auth-foundation/`
- 데이터 모델: `data-model.md` §2-2 Enum, §4 화면 매핑(paths의 prefix와 정합)
- 흐름: `flow.md` §0 진입(redirect prefix), §3-2 가드 실패(ErrorBoundary 위치 결정 참고)
- 패턴: `patterns.md` §6 URL 쿼리스트링 (`useQueryParams` 설계 기준)
- 디자인: `design-system.md` §6 Open Q "AppFormField 도입"
- 컴포넌트: `components.md` "AppFormField 도입" 추후 task 줄

---

## Open Questions

- [ ] **paths 상수 명명 규약** — `paths.service.zones` (그룹 객체) vs `paths.serviceZones` (flat). 본 spec은 **그룹 객체** 추천(IDE 자동완성 + 가시성). 다른 의견 있으면 검토 시 변경.
- [ ] **`useQueryParams`에 zod 통합 시점** — 본 spec은 primitive만, Phase 3 첫 사용처(`/patrol/zones` 필터)에서 zod 파싱 헬퍼 도입 검토.
- [ ] **MSW 핸들러 default 응답 데이터** — 인증 핸들러의 `MeRaw` mock은 어느 role로 둘 지(현장관리자 or 시스템관리자). 추천: `FIELD_MANAGER`(현장이 1차 타겟). 다른 의견 시 검토.
- [ ] **ErrorBoundary fallback UI 디자인** — 본 spec은 텍스트 위주 최소 fallback(`"문제가 발생했습니다. 새로고침 해주세요"`). 풀 디자인은 Phase 1 401/403/404 화면 작업 시 통일.
- [ ] **vitest로 003 인증 인프라 단위 테스트 작성** — 본 spec 외 작업으로 분리(Phase 1 합류 또는 별 spec). 본 spec은 인프라까지만.
