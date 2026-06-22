# 001-api-foundation spec

> 위험도: **A** (출처: `roadmap.md` §2 Phase 0 묶음 위험도)
> 관련 화면: 전 화면 공통 — `data-model.md` §2-1 `ApiResponse`, §6 에러 응답
> Phase: `roadmap.md` Phase 0
>
> 본 spec은 Phase 0 분할의 첫 묶음(통신/캐시/알림 인프라)이다. 사전 lint 정비는 [`002-lint-cleanup`], 인증·401 refresh·가드는 [`003-auth-foundation`]에서, 라우트 상수·env 분기 헬퍼·Enum SSOT·`useQueryParams`·MSW·vitest·AppFormField·ErrorBoundary는 [`004-dev-infrastructure`]에서 다룬다.
> Phase 0 ↔ spec 매핑 단일 진실 출처: `roadmap.md` §3 표의 "소속 spec" 컬럼.

---

## User Stories

- US1. 화면 개발자가 react-query 훅을 작성하면 → 어떤 응답이든 동일한 `ApiResponse<T>` unwrap 규칙으로 `data` 페이로드만 전달된다.
- US2. 사용자가 변이(mutation)를 일으켜 실패하면 → 통일된 toast로 에러 메시지가 자동 노출된다.

---

## 1. 목적

모든 화면이 의존할 **API 통신 / 서버 상태 캐시 / 사용자 알림**의 토대를 한 번에 고정한다.

구체적으로:
- axios 인스턴스의 baseURL/타임아웃을 정비하고, **응답 인터셉터에서 `ApiResponse<T>`를 자동 unwrap**하며 `code !== 200` 시 `Error(message)`로 throw 한다.
- react-query `QueryClient`의 기본 옵션을 결정하고, **mutation 전역 에러는 toast로 자동 표출**한다.
- sonner를 도입해 `notify.success/error/info/warning` 헬퍼를 표준화한다.

인증·토큰·refresh·가드는 본 spec 범위 밖이다.

---

## 2. I/O

### Input
- env: `VITE_API_BASE_URL` (env 분기 헬퍼 정형화는 003. 본 spec은 단순 참조)
- 모든 API 응답이 `ApiResponse<T>` 래퍼(`data-model.md` §2-1):
  - 성공: `code: 200`, `message: '성공'`, `data: <페이로드>`
  - 실패: `code: 4xx/5xx`, `message: <사유>`, `data: null`
- 호출부 코드 형태: `await api.get<Worker>('/workers/:id')` → 반환값의 `data`가 곧 `Worker`

### Output
- `src/types/api.ts` — `ApiResponse<T>`, `PaginationMeta`, `PagedData<T>`, `ApiListResponse<T>`, `ApiDetailResponse<T>` SSOT
- `src/lib/axios.ts` (기존 보강) — baseURL/timeout + 응답 인터셉터(자동 unwrap + throw + 네트워크 실패 정규화)
- `src/lib/queryClient.ts` — `QueryClient` 인스턴스 + 기본 옵션, `MutationCache.onError`에서 `notify.error`
- `src/lib/notify.ts` — sonner 래핑: `notify.success/error/info/warning`
- `src/main.tsx` — `QueryClientProvider` + sonner `<Toaster>` 마운트

---

## 3. 제약

### 기술 제약

- 신규 의존성: `sonner` 설치.
- `data-model.md` §2-1의 타입을 `src/types/api.ts`에 SSOT로 둔다. 기능 spec들은 이 타입만 import.
- `src/lib/axios.ts` 응답 인터셉터 규칙:
  - `response.config.responseType === 'blob'` → unwrap 우회 (그대로 반환).
  - 그 외: `body = response.data as ApiResponse<unknown>`, `body.code !== 200` → `throw new Error(body.message)`, 통과 시 `response.data = body.data` 후 `response` 반환.
  - 응답이 `ApiResponse` 형태가 아닌 경우(서버 오설정 등) → `Error('알 수 없는 응답 형식')` throw + 콘솔 경고.
  - axios reject 핸들러: `error.response` 없음(네트워크 실패) → `Error('네트워크 연결을 확인해주세요')`로 정규화하여 다시 reject.
- react-query v5 기본 옵션 (잠정):
  - `queries`: `retry: 1`, `staleTime: 30_000`, `refetchOnWindowFocus: false`
  - 전역 mutation 에러 toast: `new MutationCache({ onError: (err) => notify.error((err as Error).message) })`로 `QueryClient`에 주입.
- Provider 마운트는 `main.tsx`에서. `App.tsx`는 현재 데모 화면이므로 본 spec에서 router 구조는 손대지 않는다.
- 기존 `axios.ts`의 Authorization 헤더 placeholder(`'* 여기 Access Token 넣기 *'`)는 본 spec에서 **제거**한다. 실토큰 주입은 002에서 처리.
- DTO → ViewModel 변환은 화면별 `select` 옵션 책임. 본 spec은 "select에서 변환한다"는 규칙만 명시.

### 비즈니스 규칙

- 호출부에서 `response.data.data`로 두 번 까는 코드 금지(자동 unwrap 위반).
- 모든 호출은 `src/lib/axios.ts`의 `api` 인스턴스를 거친다. 외부 도메인 호출이 필요해 wrapper를 우회해야 한다면 별도 axios 인스턴스를 만든다(본 spec에서는 발생하지 않음).
- toast 메시지 톤은 `design-system.md` 콘텐츠 톤 따름.

---

## 4. 엣지 케이스

- **네트워크 실패** (`error.response` undefined): `Error('네트워크 연결을 확인해주세요')`로 정규화 후 reject. react-query mutation onError → 동일 메시지 toast.
- **알 수 없는 응답 형식** (서버 오설정으로 wrapper 누락): `Error('알 수 없는 응답 형식')` throw + 콘솔 `console.warn(response)`.
- **blob / 파일 다운로드** (`responseType: 'blob'`): unwrap 우회. 호출부가 `response.data: Blob` 그대로 사용.
- **빈 응답** (`code: 200`, `data: null`): 그대로 `null` 전달. throw 안 함.
- **토큰 만료(401)**: 본 spec 범위 밖. 002에서 refresh + 영역별 로그인 리다이렉트.
- **인터셉터 검증 외 경로**: 인터셉터가 인스턴스 단위라 `api` 외부에서 직접 `axios.get`을 호출하면 검증을 우회한다. → 코드 컨벤션으로 금지(레퍼런스에 명시).
- **mutation 중 같은 에러 다중 발생**: sonner 기본 dedupe에 의존. 별도 dedupe 로직 없음.
- **권한 부족(403) / 미존재(404) / 5xx**: 인터셉터에서 동일하게 `Error(message)` throw → react-query error → mutation은 자동 toast, query는 화면이 `error` 상태 직접 처리.

---

## 5. 완료 조건 (DoD)

- [ ] `src/types/api.ts` 작성: `ApiResponse<T>`, `PaginationMeta`, `PagedData<T>`, `ApiListResponse<T>`, `ApiDetailResponse<T>` (`data-model.md` §2-1 정의와 1:1 일치)
- [ ] `src/lib/axios.ts` 보강:
  - [ ] baseURL이 `import.meta.env.VITE_API_BASE_URL`
  - [ ] 요청 인터셉터의 Authorization placeholder 제거 (002에서 재도입)
  - [ ] 응답 인터셉터: blob 우회 / `code === 200` → `response.data` 자동 unwrap / `code !== 200` → `Error(message)` throw / 응답 형식 검증
  - [ ] reject 핸들러: 네트워크 실패 정규화 메시지
- [ ] `src/lib/queryClient.ts` 생성: 기본 옵션 + `MutationCache.onError`에서 `notify.error`
- [ ] `sonner` 설치 (`package.json` dependencies 반영)
- [ ] `src/lib/notify.ts` 작성: `notify.success / error / info / warning`
- [ ] `src/main.tsx`에서 `QueryClientProvider` + `<Toaster>` 마운트
- [ ] `npm run verify` 통과 (`tsc --noEmit` + `eslint .`)
- [ ] 동작 확인 1건: 임의 호출(MSW 또는 모킹 함수)이 `useQuery`를 통해 unwrap된 `data`로 도달 / 실패 시 mutation에서 toast 확인 — 검증 증거 파일·라인 명시

---

## 참고

- 데이터 모델: `data-model.md` §2-1 (`ApiResponse` 래퍼), §6 (에러 응답)
- 로드맵: `roadmap.md` §3 Phase 0 (Foundation)
- 디자인 시스템: `design-system.md` D6 (toast 결정)
- 후속 spec: `002-lint-cleanup`, `003-auth-foundation`, `004-dev-infrastructure`

---

## Open Questions

- [ ] **react-query 기본 옵션 미세조정**: `staleTime: 30_000` / `retry: 1`은 잠정안. Phase 3 화면 작업하면서 체감 후 확정.
- [ ] **MutationCache 전역 toast vs 화면별 onError**: 전역 toast가 화면 상황에 안 맞는 케이스(예: 인라인 폼 에러 표시) 발견 시, 화면이 `meta: { suppressErrorToast: true }` 같은 플래그로 우회하도록 확장할지.
