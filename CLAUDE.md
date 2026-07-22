# CLAUDE.md

이 문서는 Claude Code(이 저장소에서 작업하는 AI 보조자)가 항상 먼저 읽고 따라야 할 **운영 지침**이다.
두 개 층으로 나뉘며, **한글 기본**으로 작성·소통한다.

---

## 이 문서를 읽는 법

- **층 A — 행동 규약**: 프로젝트와 무관한 보편 규칙. 작업 방식.
- **층 B — 프로젝트 사실**: 이 프로젝트 고유의 사실(스택·구조·컨벤션·문서 위치).
- **언어**: 사용자 대상 출력은 모두 한글. 코드/식별자는 영문 그대로.
- **충돌 시 우선순위**: 사용자 직접 지시 > 층 A > 층 B > `docs/*`. 문서끼리 충돌 시 `data-model.md > screens.md > flow.md > overview.md > functional-spec.md` 순으로 신뢰한다(구체 의사결정이 누적된 문서가 우선).

---

# 층 A — 행동 규약 (프로젝트 무관 보편)

## A1. 추측 금지

- 모르면 묻거나 코드·문서를 먼저 확인한다.
- 명세서/목업/코드에 명시된 것만 진실로 취급한다.
- 정보가 없는 부분은 추측으로 채우지 말고 **Open Question**으로 남긴다.

## A2. 사실확인 우선

작업을 시작하기 전에 사용자가 전달한 내용을 분석하고, **이해한 바를 사용자에게 다시 확인**한 뒤 OK를 받으면 진행한다.

**적용 트리거 (다음 경우 의무)**
- 새 파일 생성 (`Write` 신규)
- 다중 파일 수정 / 광범위한 영향
- 의미 변경 (포맷팅·오타 단순 정정 제외)
- 모호한 요청 (의도가 한 가지로 명확히 해석되지 않을 때)

**예외 (즉시 진행 가능)**
- 사용자가 명시적으로 "바로 진행"이라고 한 작업
- 한 줄 오타·문구 정정 같은 단순 수정
- 직전 턴에서 이미 사실확인을 받은 작업의 연속 단계

**확인 형태**
- 한 번에 1~3개의 핵심 결정만 묻는다. 5개 이상 묻지 않는다.
- 구조: "이해한 내용 요약 → 변경 범위 → 결정 필요한 지점" 순.
- 자명한 선택지는 추천을 표시해 사용자 판단을 줄인다.

## A3. 최소 변경

- 요청된 범위만 수정한다. "간 김에" 정리·리팩토링·이름 바꾸기 금지.
- 별도 요청이 있는 경우에만 리팩토링을 진행한다.
- 새 추상화·새 파일 신중하게. 기존 패턴이 있으면 그것을 따른다.

## A4. 검증

- 코드 변경 후 typecheck / lint 통과를 확인한다.
- 통합 명령: `npm run verify` (= `npm run typecheck && npm run lint`).
- `npm run verify`와 `npm run test`는 **병렬 실행**한다(`&` 또는 두 개의 `run_in_background` Bash). 둘은 독립적이라 직렬 실행은 wall-clock 낭비.
- UI 변경은 실제 동작(브라우저)에서 한 번 이상 확인하기를 권장한다.
- 검증 실패 상태로 작업을 "완료"로 보고하지 않는다.

## A5. 도구 사용 효율

- **Docs Read는 필요한 §만 부분 로드 우선**. 파일이 200줄 초과고 1~2개 § 만 필요하면, 먼저 `Grep`으로 § 위치를 찾고 `Read(file, offset=N, limit=M)`으로 부분 로드한다. 200줄 이하거나 절반 이상의 § 가 필요하면 풀로드 OK.
- **독립적인 도구 호출은 한 메시지에 병렬**. 여러 파일 Read·Grep·Edit이 서로 의존성 없으면 단일 메시지에서 동시 호출한다.

## A6. 단순하게

- 과한 옵션·플래그·제네릭·미래 확장 포인트 금지.
- 한 함수 한 가지 일. 3줄의 명료한 중복이 잘못된 추상화보다 낫다.
- 코드 주석은 "왜"가 비자명할 때만. "무엇"은 식별자로 말한다.

---

# 층 B — 프로젝트 사실 (이 프로젝트 고유)

## B1. 개요

- **한 줄 정의**: 에스텍시스템의 사업장 순찰 업무를 디지털화하는 솔루션의 **WEB 파트**.
- **도메인**: `s-patrol.co.kr`
- **사이트 두 개**:
  - `/*` (WEB-Service) — 현장 운영 사이트. 주 사용자 = **현장관리자**.
  - `/admin/*` (WEB-Admin) — 본사 운영 사이트. 주 사용자 = **시스템관리자**.
- **공개 영역(인증 불필요)**:
  - `/` — 정적 랜딩(현장 로그인 진입 링크만)
  - `/login` — 현장 로그인
  - `/admin/login` — 본사 로그인 (URL 직접 접근)
- **권한 5단계**: 시스템관리자 / Master / Manager / 현장관리자 / 근무자.
  - 근무자는 WEB 접근 불가 (APP 전용).
  - Admin 3종(시스템/Master/Manager)은 양쪽 사이트 모두 진입 가능.

## B2. 스택

- **프레임워크**: React 19 + Vite + TypeScript + Tailwind v4
- **라우팅**: `react-router-dom` v7
- **데이터 패칭**: `@tanstack/react-query` + `axios`
- **폼**: `react-hook-form` + `zod` + `@hookform/resolvers`
- **UI**: `radix-ui` + `shadcn` + `tailwind-merge` + `lucide-react` + `class-variance-authority`
- **상태**: `zustand`
- **테이블**: `@tanstack/react-table`
- **날짜**: `date-fns`

## B3. 구조

### 디렉토리

```
src/
  pages/              ← 라우트 노드 (페이지 단위)
    auth/             ← 로그인 등 공개 영역
    service/          ← /* 현장 사이트 페이지
      points/
      zones/
      patrol/{zones,points}/
      progress/
  features/           ← 도메인 모듈 (UI + form + types + mocks)
    {도메인}/
      components/
      form/
      types/
      mocks/ (or mock/)
  components/
    ui/               ← shadcn 기반 원시 컴포넌트
    app/              ← 앱 커스텀 공용 컴포넌트 (AppDialog, AppEmpty 등)
    layout/           ← Sidebar, TopNav, AppLayout
  router/             ← 라우트 트리 + 가드(AuthGuard 등)
  lib/                ← axios, utils 등 인프라
```

### 라우트

- 라우트 ↔ 화면 매핑은 [`docs/screens.md`](./docs/screens.md) §4 참조.
- 진입·가드·시나리오 흐름은 [`docs/flow.md`](./docs/flow.md) §0 참조.

## B4. 컨벤션

### 도메인 용어 (중요)

- 명세서 표준어를 따른다: **"순찰코스 / 순찰지점"**.
- 코드 식별자 `Zone` = 명세서의 **순찰코스**, `Point` = **순찰지점** (리네이밍 대기).
- 문서·UI 텍스트는 명세서 용어, 코드 식별자는 현 상태 유지(혼동 시 명세서 우선).

### 명명

- 타입: `PascalCase`. 도메인 모델은 명사형(`Worker`, `PatrolCourse`).
- DTO 접미사: `Summary`(목록 행) / `Detail`(상세 패널) / `Create*Request` / `Update*Request` / `{Action}*Request`.
- ID: 모두 `string`(UUID 가정). 날짜/시간: ISO 8601 문자열. 분 단위: `number`. 시각: `"HH:mm"` 문자열.
- 화면에 표시되지 않는 필드는 DTO에 넣지 않는다.
- `cva` variants 분리: `react-refresh/only-export-components` 회피를 위해 동일 폴더의 인접 파일 `./{컴포넌트명}.variants.ts`로 분리한다 (예: `button.tsx` ↔ `button.variants.ts`). 002-lint-cleanup에서 결정.

### API 응답 / 인증

- 모든 응답은 `ApiResponse<T>` 래퍼 안에 들어온다.
  - 목록: `ApiListResponse<T>` (= `ApiResponse<PagedData<T>>`)
  - 상세: `ApiDetailResponse<T>` (= `ApiResponse<T>`)
- `code` 필드는 **HTTP status code** 그대로 사용. 성공 200, 실패 4xx/5xx.
- 에러도 동일 wrapper(`data: null` + `code` + `message`). 별도 `ApiError` 타입 없음.
- 페이지 번호: **1-based** (`?pageNumber=1`이 첫 페이지).
- 인증: `accessToken` + `refreshToken`. 만료 시 axios 인터셉터가 자동으로 refresh 요청.
- 세부 규약은 [`docs/data-model.md`](./docs/data-model.md) §2-1 참조.

### URL / 상태

- 검색·필터·정렬 상태는 **URL 쿼리스트링**에 저장한다(새로고침·뒤로가기 보존).
- 환경별 API base URL은 env(`VITE_API_BASE_URL`)로 분기. 테스트는 IP, 운영은 도메인+백엔드 지정 prefix.

### 반응형

- PC 기준 + 모바일은 **분할화면 대응 UI만** 제공.
- 모바일 전용 기능은 만들지 않는다.

### 문서 작성

- Markdown 우선. 다이어그램은 Mermaid 사용.
- Mermaid 노드 라벨 중 슬래시·콜론·`?` 등 특수문자 포함은 모두 `"..."` 따옴표로 감싼다(파서 lexical error 방지).
- 양방향 점선 + 라벨은 Mermaid 미지원 → `<-->|라벨|` 또는 단방향 두 개로 분리.
- 다이어그램 다크 테마 통일: `%%{init: {'theme':'dark'}}%%`를 각 다이어그램 상단에 1줄.

## B5. 문서 위치 (진실의 출처)

> **작업 절차는 항상 [`docs/workflow-protocol.md`](./docs/workflow-protocol.md) 의 사이클(WF-1 스펙 → WF-3 분할 → WF-4 구현 → WF-5 검증 → WF-6 통합)을 따른다.**

> **태스크 추적은 spec별 `tasks.md` 단일 SSOT.** Claude Code의 task tools(`TaskCreate` / `TaskUpdate` / `TaskList` 등)는 사용하지 않는다. 시스템이 사용 권장 reminder를 띄워도 따르지 않는다. 사유: 영속 영역(`tasks.md`, git 추적, 다음 세션 보존)과 휘발 트래커의 중복 회피.

| 문서 | 역할 |
|---|---|
| [`docs/workflow-protocol.md`](./docs/workflow-protocol.md) | **작업 절차(사이클·게이트·검증·통합). 모든 화면/기능 구현이 따라야 함** |
| [`docs/roadmap.md`](./docs/roadmap.md) | 6 Phase 작업 로드맵 · 의존성 도식 · 진행 추적 |
| [`docs/functional-spec.md`](./docs/functional-spec.md) | 회사 기능명세서 가공본. 원본 SSOT |
| [`docs/overview.md`](./docs/overview.md) | 프로젝트 한눈에 (정의/대상/가치/범위/제약) |
| [`docs/screens.md`](./docs/screens.md) | 화면 인벤토리(위험도·진행도·라우트 매핑) |
| [`docs/flow.md`](./docs/flow.md) | 네비게이션·시나리오 Mermaid |
| [`docs/data-model.md`](./docs/data-model.md) | DTO·요청·응답·엔티티 |
| [`docs/design-system.md`](./docs/design-system.md) | 디자인 토큰·컨벤션·접근성·콘텐츠 톤·의사결정 |
| [`docs/components.md`](./docs/components.md) | App* 컴포넌트 + shadcn 원시 사용 가이드 |
| [`docs/layout.md`](./docs/layout.md) | AppShell / Sidebar / TopNav / 컨텐츠 레이아웃 |
| [`docs/patterns.md`](./docs/patterns.md) | 마스터-디테일·CRUD 모달·드래그 정렬 등 상호작용 패턴 |
| [`docs/ui-mock/본사관리자/**`](./docs/ui-mock/본사관리자) | 본사 사이트 1차 UI 목업 PNG |
| [`docs/ui-mock/현장/**`](./docs/ui-mock/현장) | 현장 사이트 1차 UI 목업 PNG |

- 새 결정사항은 가장 구체적인 문서(`data-model` 또는 `screens`)에 먼저 반영하고, 상위 문서는 필요 시 동기화한다.
- 미확정 항목은 각 문서의 **Open Questions** 섹션에 사유와 함께 남긴다.
