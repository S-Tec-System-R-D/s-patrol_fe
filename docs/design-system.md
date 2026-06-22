# 디자인 시스템 (design-system.md)

> 이 문서는 본 프로젝트의 **디자인 토큰 + 컨벤션 + 접근성 + 콘텐츠 톤**을 정의한다.
> 새 화면·컴포넌트를 만들 때 가장 먼저 참조하는 횡단 기반.
>
> **SSOT**
> - 토큰: [`src/index.css`](../src/index.css)
> - 1차 시안: [`docs/ui-mock/`](./ui-mock/)
>
> **구현 디테일은 별도 문서**
> - 컴포넌트 사용법 → [`docs/components.md`](./components.md)
> - 레이아웃 → [`docs/layout.md`](./layout.md)
> - 상호작용 패턴 → [`docs/patterns.md`](./patterns.md)

---

## 1. 디자인 토큰

토큰은 `src/index.css`에 CSS 변수로 정의되어 있고, Tailwind v4 `@theme inline` 블록을 통해 `bg-*`/`text-*`/`border-*` 유틸리티로 연결되어 있다. **임의 hex/oklch 사용 금지**, 항상 토큰 이름을 통해 접근한다.

### 1-1. 컬러

#### shadcn 베이스 토큰

| 토큰 | 라이트 | 다크 | 사용처 |
|---|---|---|---|
| `--background` | #f8fafc | #0f172a | 페이지 베이스 |
| `--foreground` | #0f172a | #f8fafc | 본문 텍스트 |
| `--contents-bg` | 연한 회색 | (상속) | 컨텐츠 영역 |
| `--card` | 흰색 | #1e293b | 카드 surface |
| `--popover` | 흰색 | #1e293b | 팝오버/메뉴 |
| `--primary` | #1e293b | #f8fafc | 주요 액션 |
| `--secondary` | 연한 회색 | #334155 | 보조 surface |
| `--muted` | 연한 회색 | #334155 | 비강조 배경 |
| `--muted-foreground` | #64748b | #94a3b8 | 보조 텍스트 |
| `--accent` | 연한 회색 | #334155 | 호버/포커스 surface |
| `--border` / `--input` | #e2e8f0 | #334155 | 경계 |
| `--ring` | #3b82f6 | #3b82f6 | 포커스 링 |

#### 커스텀 시맨틱 (point / success / warning / danger)

각 색상은 **`{main, -bg, -foreground}` 트리오**로 운영. 액션 색·뱃지 배경·뱃지 텍스트가 서로 짝이어야 가독성·접근성이 보장됨.

| 시맨틱 | 의미 | main | -bg | -foreground |
|---|---|---|---|---|
| `point` | 브랜드 강조(파랑) | #3b82f6 | 연파랑 | 짙은 파랑 |
| `success` | 성공/운영중/완료 | #22c55e | 연녹색 | 짙은 녹색 |
| `warning` | 주의/시간초과/중지 | #f59e0b | 연주황 | 짙은 주황 |
| `danger` | 위험/삭제/이상 | #ef4444 | 연빨강 | 짙은 빨강 |

> `--destructive`는 `--danger`와 동일. shadcn 호환을 위해 둘 다 노출.

**사용 매트릭스 (어디에 어떤 시맨틱?)**

| 맥락 | 시맨틱 |
|---|---|
| 주요 액션 버튼 (등록/저장) | `primary` |
| 강조 액션/링크/포커스 | `point` |
| 위험 액션 (삭제/사업장 삭제) | `danger` |
| 사업장 상태 = 운영중 / 코스 결과 = 완료 / 지점 결과 = 이상없음 | `success` |
| 시간초과 / 사업장 = 중지 / 진행 중 등 주의 상태 | `warning` |
| 미완료 / 이상 / 만료 | `danger` |
| 대기중 / 비활성 / 비강조 | `muted` |
| 인증수단 뱃지 = QR | `point-bg` + `point-foreground` |
| 인증수단 뱃지 = NFC | `success-bg` + `success-foreground` |

#### 사이드바 / 차트

- 사이드바: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary(-foreground)`, `--sidebar-accent(-foreground)`, `--sidebar-border`, `--sidebar-ring`
- 차트: `--chart-1` ~ `--chart-5` (1=point, 2=청록, 3=success, 4=warning, 5=danger 계열)

### 1-2. 타이포

- **폰트**: Geist Variable (sans + heading 공용). `@fontsource-variable/geist`로 import.
- **본문**: 14px / line-height 20px (0.875rem / 1.25rem).
- **헤딩 위계**: h1 24 / h2 20 / h3 17 / h4 15. h5·h6는 body(14)와 동일하므로 별도 운영 X.
- **헤딩 weight**: 500. letter-spacing -0.01em.
- **본문 weight 기준**: 400(기본) / 500(강조 라벨) / 600(헤더 셀·강조 숫자) / 700(아주 강조). 800 이상은 지양.

### 1-3. 라디우스

`--radius: 0.5rem` 기준, 0.6x ~ 1.8x로 스케일.

| 토큰 | 값 | 사용 |
|---|---|---|
| `rounded-sm` | 0.6 × 0.5rem | **본 프로젝트 기본**. 인풋·버튼·카드·테이블 |
| `rounded-md` | 0.8 × 0.5rem | 다이얼로그 내부 박스 |
| `rounded-lg` | 0.5rem | 큰 카드/사이드 패널 |
| `rounded-xl` | 1.4 × | 시안성 강조 |
| `rounded-2xl` | 1.8 × | 모달/큰 카드 |
| `rounded-full` | — | 아바타·점 표시 |

> 본 프로젝트는 **`rounded-sm`이 기본**이다(`AppInput`, `AppTable`, `AppIconButton` 모두 sm). 새 컴포넌트도 별다른 이유 없으면 sm.

### 1-4. 간격

Tailwind 기본 스케일 그대로 사용(별도 커스텀 없음). 자주 쓰는 조합:

| 맥락 | 권장 |
|---|---|
| 페이지 패딩 | `p-8` |
| 카드 패딩 | `p-4` |
| 리스트/세로 stack | `gap-2` ~ `gap-4` |
| 아이콘-텍스트 | `gap-2` |
| 필터 바 행 | `gap-3` |

### 1-5. 아이콘

- 라이브러리: **`lucide-react` 단일**.
- 기본 stroke: **`strokeWidth={1.5}`**. (강조 체크 표시 등 예외만 더 굵게.)
- 기본 사이즈: **16**(본문 인라인) / **14**(테이블 셀·뱃지) / **20~24**(헤더·빈 상태).
- 색은 컨텍스트의 텍스트 색을 상속(`text-muted-foreground` 등). 별도 색 지정은 시맨틱 토큰만.

### 1-6. 모션

- 기본 transition: `transition-colors` / `transition-all`.
- 인터랙션 피드백: 버튼 활성 시 `active:translate-y-px` (shadcn 패턴 따름).
- `prefers-reduced-motion: reduce` → 자동 0.01ms 단축(전역 CSS).
- 커스텀 키프레임:
  - `bounce-y` 1.5s ease-in-out infinite (`.bounce-anim`) — 빈 상태 아이콘 등.

### 1-7. 다크 모드

- **토큰은 라이트/다크 모두 유지** (`.dark` 변수 정의됨).
- **1차 범위에서는 토글·스위처 미구현**.
- 새 컴포넌트도 반드시 토큰을 통해 색을 받는다. 임의 hex를 박으면 추후 다크 전환 시 깨짐.
- 다크 전환을 활성화하려면 `<html>` 또는 상위 요소에 `.dark` 클래스를 토글하면 끝(0 코드 변경).

---

## 2. 컨벤션

### 2-1. 색상

- 시맨틱 토큰만 사용. **임의 hex/oklch 작성 금지**. (예외: AppEmpty의 장식 도트가 oklch를 직접 쓰는데, 이는 토큰화 대기 항목으로 §6 Open Q에 등록.)
- `point/success/warning/danger`를 사용할 땐 트리오(`-bg`, `-foreground`)도 동일 시맨틱으로.

### 2-2. 클래스 결합

- **`cn()` 헬퍼 우선** (`@/lib/utils`). 동적 조건부 클래스는 `cn(base, condition && '...')` 패턴.
- 변형이 3개 이상이면 **CVA(`class-variance-authority`)** 사용. (shadcn 컴포넌트가 이미 그렇게 작성됨.)
- `tailwind-merge`로 충돌 자동 해결 (cn 내부에 포함).

### 2-3. 버튼

- 표준은 **`AppButton`** (단일 표준). `src/components/Button.tsx` 위치.
  - `variant`: `default` / `sub` / `destructive` / `dash`
  - `size`: `full` / `fit`
  - `icon`(LucideIcon) + `iconPosition`(left/right) 옵션 내장
- shadcn `components/ui/button.tsx`는 **점진 제거 대상**. 새 화면에서 사용 금지.
- 마이그레이션 정책은 §5 D1 참고.

### 2-4. 폼

- 라이브러리: **react-hook-form + zod**. 스키마는 `features/{도메인}/form/schema.ts`.
- 인풋은 **`AppInput`** 사용(variant: `default` / `search` / `password`). 에러는 인풋 하단 `text-xs text-danger`.
- 체크박스는 **`AppCheckbox`**. 라벨·에러 동일 패턴.
- 라벨 표기는 `text-sm font-medium`. 필수 표시는 `*`(`text-danger`).

### 2-5. 반응형

- PC 기준 + 모바일은 **분할화면 대응 UI**만. 모바일 전용 기능 X.
- breakpoint는 Tailwind 기본(`sm`/`md`/`lg`/`xl`). 따로 커스텀하지 않음.

### 2-6. 클래스 사용 규칙

- 토큰을 직접 var()로 부르지 말고 Tailwind 유틸 사용(`bg-point` / `text-point-foreground`).
- 그림자보다 **border 우선**. 본 디자인은 평면 UI 베이스(목업 전반 확인).
- 호버 효과는 `hover:bg-muted` / `hover:bg-{semantic}/10` 정도로 절제.

---

## 3. 접근성

- **포커스 링**: `ring` 토큰 사용. shadcn 컴포넌트는 `focus-visible:ring-ring/50` 기본 적용.
- **aria 속성**: `aria-invalid`(폼 에러), `aria-expanded`(드롭다운/메뉴) 활용(shadcn 패턴).
- **모션 감소**: `prefers-reduced-motion: reduce`는 전역 CSS에서 처리됨. 새 애니메이션도 동일 정책 준수.
- **색만으로 상태 전달 금지**: 상태 뱃지는 반드시 텍스트(예: "운영중", "완료") 동반. 인증수단 뱃지도 "QR"/"NFC" 텍스트 노출.
- **명도 대비**: 시맨틱 트리오의 `-foreground`는 `-bg` 위에서 대비 충족하도록 설계됨. 다른 조합(예: `text-point on bg-warning`) 사용 시 대비 검증 필수.
- **키보드 동선**: 사이드바·탭·다이얼로그는 shadcn(radix) 기본 키보드 처리 그대로 사용.

---

## 4. 콘텐츠 톤 (Voice & Tone)

UI 텍스트(라벨, 확인 문구, 빈 상태, 에러)의 한국어 일관성 규칙.

### 4-1. 라벨

- **명사형 기본**: "순찰코스", "지점 추가", "공지 작성".
- 동사형으로 늘이지 않는다: ❌ "새 순찰코스를 생성합니다" → ✅ "순찰코스 추가".

### 4-2. 확인 문구

- 형식: **"{대상}을(를) {동작}하시겠습니까?"**
- 예: "사업장 '강동 그랜드타워'을(를) 삭제하시겠습니까?"
- 위험 동작은 결과를 한 줄로 부연: "삭제된 데이터는 복구할 수 없습니다."

### 4-3. 빈 상태

- 패턴: **상태 한 줄 + 다음 행동 한 줄**.
- 예: "선택된 구역이 없습니다 / 좌측에서 구역을 선택하거나 새로 생성해주세요"
- AppEmpty의 `title` / `description` 매핑.

### 4-4. 에러 메시지

- **원인 + 해결책** 구조. 부정 표현 최소화.
- 예: ❌ "잘못된 비밀번호입니다" → ✅ "비밀번호가 일치하지 않습니다. 다시 입력해주세요."
- 필드 에러는 한 줄.

### 4-5. 숫자·단위

- 단위 띄어쓰기: "12분", "3 / 4 개" (목업 표기 그대로 유지).
- 시각: `HH:mm` 24시간 표기.
- 날짜: `YYYY-MM-DD` 표기.

### 4-6. 호칭

- 사용자 대상 호칭은 사용하지 않는다("님" 등 생략). 단, 고지·안내 문구는 "~해주세요" 정중체.

---

## 5. 의사결정 기록 (Decisions)

이미 결정된 디자인 시스템 사항. 향후 번복 비용을 줄이기 위해 사유를 함께 남긴다.

### D1. Button: AppButton 단일 표준

- **결정**: 본 프로젝트의 표준 버튼은 **`AppButton`** (`src/components/Button.tsx`). shadcn `ui/button.tsx`는 점진 제거.
- **사유**:
  - 본 프로젝트 variant는 4종(`default`/`sub`/`destructive`/`dash`)으로 충분.
  - shadcn `Button`은 size 8종 + variant 6종 + asChild 등 옵션이 과함. A5(단순하게)와 충돌.
  - 아이콘 + label 조합이 거의 모든 버튼에 등장 → `icon`/`iconPosition` 내장 형태가 더 효율.
- **마이그레이션**:
  - 신규 화면: AppButton만 사용.
  - 기존 코드: 화면 작업 시 그 화면 안의 shadcn Button을 함께 교체. 한 번에 전수 교체는 하지 않음(A3 최소 변경).
  - 완전 제거 시점: 별도 결정(Open Q).

### D2. 다크 모드: 토큰 유지, 토글 미구현

- **결정**: `.dark` 토큰은 유지하되, 1차 범위에서 토글·테마 스위처 미구현.
- **사유**: 1차 범위 외. 토큰만 살려두면 추후 0 코드 변경으로 활성화 가능.
- **제약**: 새 컴포넌트도 **반드시 토큰 경유**해 색 사용(임의 hex 금지).

### D3. 색상은 시맨틱 토큰만

- **결정**: 모든 색은 `index.css`의 토큰 → Tailwind 유틸을 통해서만 접근.
- **사유**: 다크 전환 + 리브랜딩 + 접근성 검토 모두에 안전.
- **예외**: 현재 `AppEmpty`의 장식 도트가 oklch를 직접 사용 중 → 토큰화 대기(§6 Open Q).

### D4. UI 라운드 기본은 `rounded-sm`

- **결정**: 인풋·버튼·테이블·카드 기본 라운드는 `sm`.
- **사유**: 목업 전반의 톤이 sharp-soft 중간. 본 프로젝트 분위기와 일치.

### D5. 아이콘은 lucide + strokeWidth 1.5

- **결정**: 모든 아이콘 라이브러리는 lucide-react. 기본 stroke 1.5.
- **사유**: 일관성. 본 프로젝트 컴포넌트 전반(`AppIconButton`, `AppInput`, `AppCheckbox`, `AppEmpty`)이 이미 1.5로 통일.

### D6. Toast = sonner

- **결정**: 토스트 시스템은 **sonner** 단일. 자체 구현·radix `useToast` 사용하지 않음.
- **사유**: 가벼움 + DX 우수 + tanstack-query mutation 패턴과 정합. shadcn 가이드도 sonner 권장.
- **사용 가이드**:
  - 성공/실패 양쪽 모두 표시(특히 CRUD·삭제).
  - 메시지는 콘텐츠 톤 §4 규칙 따름("순찰코스가 추가되었습니다" / "삭제에 실패했습니다. 다시 시도해주세요").
  - 위치: 기본(우측 상단). 위험 액션 결과는 약간 더 길게 노출.

### D7. 다국어 = 한국어 단일

- **결정**: 1차 범위에서 **한국어 단일**. i18n 라이브러리 도입하지 않음.
- **사유**: 사용처가 단일 회사(에스텍시스템). 영문 요구 없음.
- **확장 대비**: 사용자 대상 텍스트를 컴포넌트 안에 인라인으로 두되, 추후 키 추출이 가능하도록 **하드코딩 위치를 한 군데로 모아두지 말고** 각 컴포넌트 옆에 둔다(자연 분포). 라이브러리 도입 시점에 일괄 추출.

### D8. 옵티미스틱 업데이트 정책

- **결정**:
  - **옵티미스틱 적용**: 단일 boolean 토글류(코스 활성화 / 교대 허용 / 헬스체크 사용 / 지점 사용 등). tanstack-query `onMutate` + 롤백 패턴.
  - **응답대기 + sonner toast**: 모든 CRUD(등록·수정·삭제·배치 변경 등). 위험 액션은 반드시 응답대기.
- **사유**: 토글은 실패 시 시각적 롤백 비용이 낮고 즉시 반응이 가치 큼. CRUD는 검증 결과를 사용자가 인지해야 하므로 응답 후 toast가 더 안전.

### D9. AppFormField + AppInput 역할 분리

- **결정**:
  - **폼 영역(label / required / error / hint)은 `AppFormField` 컨테이너**가 책임.
  - **`AppInput`은 "디자인된 인풋"** 책임만 가짐. 기존 `label` / `error` / `required` props는 보존하되 JSDoc `@deprecated` 마킹 — 점진 마이그레이션, 콘솔 경고는 없음.
  - 신규 폼(Phase 2 `AppSelect` / `AppDatePicker` 포함)은 **`AppFormField`로 감싸는 패턴이 표준**.
- **사유**:
  - Phase 2 신규 폼 컴포넌트가 동일한 label/error/required 처리 로직을 중복하지 않기 위해 컨테이너 단일화.
  - shadcn `Form` / react-hook-form `Controller` 패턴과 정합. 폼 외부 인풋 사용처(예: 검색바)도 폼 영역 props 없이 사용 가능해짐.
- **마이그레이션**:
  - 신규 폼: `AppFormField` + `AppInput`(base props만) 조합 사용.
  - 기존 6개 폼 파일(`features/{zone,points}/form/*Form.tsx`)은 **각 화면 작업 시 자연 교체**. 일괄 교체 X(A3 최소 변경).
- **컨벤션**:
  - `AppFormField`의 helper 영역은 `error`가 있으면 에러 메시지, 없으면 `hint`를 표시. 둘 다 14px 미만 보조 텍스트.

---

## 6. Open Questions

미언급은 미정으로 본다.

- [ ] **헤딩 위계 미세 조정** — h5/h6가 body(14)와 동일. 별도 운영 안 한다면 사용 금지로 못박을지
- [ ] **AppButton 마이그레이션 완료 시점** — 기존 shadcn `Button` 사용처 일괄 교체 일정
- [ ] **AppEmpty 장식 oklch → 토큰화** — 현재 인라인 oklch. `point` 트리오로 흡수할지, 별도 토큰 추가할지
- [ ] **그림자 시스템** — 현재 거의 미사용. 필요 시 elevation 토큰 정의할지
