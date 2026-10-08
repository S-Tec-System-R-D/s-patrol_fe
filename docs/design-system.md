# 디자인 시스템 (design-system.md)

> 이 문서는 본 프로젝트의 **디자인 토큰 + 컨벤션 + 접근성 + 콘텐츠 톤**을 정의한다.
> 새 화면·컴포넌트를 만들 때 가장 먼저 참조하는 횡단 기반.
>
> **SSOT**
> - 토큰: [`src/index.css`](../src/index.css)
> - 리디자인 목업: [`docs/ui-mock/현장/**/*-신규.png`](./ui-mock/) (범위: 순찰이력, 코스/지점, 근무자, 배치관리, 공지사항)
> - 1차 목업(참고, `-신규` 없는 파일): 리디자인 이전 시안. 데이터·문구는 유효, 시각 표현은 폐기.
>
> **구현 디테일은 별도 문서**
> - 컴포넌트 사용법 → [`docs/components.md`](./components.md)
> - 레이아웃 → [`docs/layout.md`](./layout.md)
> - 상호작용 패턴 → [`docs/patterns.md`](./patterns.md)
>
> **리디자인 반영 상태**
> - 방향성: Notion / Linear / Vercel 계열 **미니멀·고밀도 SaaS** 스타일.
> - 대상: 현장 사이트 5개 화면(순찰이력·코스/지점·근무자·배치관리·공지사항).
> - 범위 밖: `/admin/*` 본사 사이트, 로그인/랜딩. → 이번 라운드 리디자인 미적용 상태 정상.
> - 데이터·기능 범위·문구는 유지. **UI만 교체**.

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

#### 리디자인 팔레트 컨셉 (OKLCH)

리디자인 목업은 **OKLCH 기반**으로 그려졌으나, 프로젝트는 위 4종 시맨틱 트리오 시스템을 그대로 유지한다. **팔레트 컨셉 → 기존 토큰 매핑**은 다음과 같다.

| 리디자인 컨셉 토큰 | 매핑 대상 | 용도 |
|---|---|---|
| `--bg` | `--background` / `--contents-bg` | 페이지 베이스 |
| `--surface` | `--card` | 카드 표면(흰색) |
| `--border` / `--border-soft` | `--border` (soft = `--border/50`) | 경계 |
| `--text` / `--text-2` / `--text-3` | `--foreground` / `--muted-foreground` / (신설: `--foreground/50`) | 본문 3단계 |
| `--accent` / `--accent-bg` / `--accent-dark` | `--point` / `--point-bg` / `--point-foreground` | 선택 상태·프라이머리 |
| `--success(-bg)` | `--success(-bg)` | 완료·활성 |
| `--danger(-bg)` | `--danger(-bg)` | 미완료·삭제 |
| `--amber(-bg)` | `--warning(-bg)` | 주의·대기 |
| `--rail` / `--rail-2` | 신설 (§1-1 하단 참고) | 다크 사이드바 레일 전용 |

**신설 필요 토큰**
- [x] `--rail` / `--rail-2` — **해소(007)**: `src/index.css`에 신설(`:root`/`.dark` 동일값 — 레일은 항상 다크). `@theme inline`에 `--color-rail`/`--color-rail-2` 연결. `bg-rail`/`bg-rail-2` Tailwind 유틸로 사용.
- `--text-3`(희미한 라벨·타임스탬프)은 현재 `text-muted-foreground/60~70` 유틸로 대체 가능. 자주 쓰이면 별도 토큰화 검토(§6 Open Q).

**사용 매트릭스 (어디에 어떤 시맨틱?)**

| 맥락 | 시맨틱 |
|---|---|
| 주요 액션 버튼 (등록/저장) | `primary` |
| 강조 액션/링크/포커스 / 코스 순찰이력 = 진행중 | `point` |
| 위험 액션 (삭제/사업장 삭제/거부) | `danger` |
| 사업장 상태 = 운영중 / 코스 결과 = 완료 / 지점 결과 = 이상없음 / 승인 | `success` |
| 시간초과 / 사업장 = 중지 / 대기중 배치요청 등 주의 상태 | `warning` |
| 미완료 / 이상 / 만료 | `danger` |
| 대기중 / 비활성 / 비강조 | `muted` |
| 인증수단 뱃지 = QR | `point-bg` + `point-foreground` |
| 인증수단 뱃지 = NFC | `success-bg` + `success-foreground` |

**지점 순찰이력 결과 뱃지 (5종 매핑)** — screens.md §1-2 지점 이력에서 사용.

| 결과 | 시맨틱 |
|---|---|
| 이상없음 | `success` |
| 순찰기록 (정보성, 기록 존재) | `point` |
| 시간초과 | `danger` |
| 미완료 | `danger` |
| 순찰제외 | `warning` |

#### 사이드바 / 차트

- 사이드바: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary(-foreground)`, `--sidebar-accent(-foreground)`, `--sidebar-border`, `--sidebar-ring`
- 차트: `--chart-1` ~ `--chart-5` (1=point, 2=청록, 3=success, 4=warning, 5=danger 계열)

#### 아바타 장식 팔레트 (013)

- `--avatar-1` ~ `--avatar-6` — **상태 의미 없는 순수 장식용** 6색. 이니셜 아바타(예: 근무자 목록)의 배경색을 id/name 해시로 순환 배정할 때만 사용.
- 시맨틱 4색(point/success/warning/danger, hue 260/150/70/25)과 겹치지 않도록 별도 hue(285/20/195/55/165/40)로 구성 — 뱃지·상태 표시와 혼동 금지.
- 라이트/다크 동일 값(장식용이라 다크 전용 보정 불필요, `--rail`과 동일 원칙).

### 1-2. 타이포

- **폰트**: **Pretendard** (sans + heading 공용). `@fontsource-variable/pretendard` 또는 CDN.
- **본문 기본값(body)**: **12.5px** / line-height 1.4. (009에서 13px 초안을 12.5px로 확정, `src/index.css` `body` 반영)
- **의도**: Linear/Notion 밀도 재현. 웹 슬라이드/문서 대비 의도적으로 작은 스케일 — 접근성은 명도 대비와 여백으로 보완.

**스케일 (009에서 확정, 목업 CSS 기반 10단계)** — `src/index.css` `@theme inline`에 `--text-*` 토큰으로 등록. weight는 토큰에 미포함, 기존처럼 `font-*` 유틸리티로 분리 적용.

| 크기 / weight | 유틸리티 클래스명 | 용도 | 적용 컴포넌트 예 |
|---|---|---|---|
| 17px / 700 | `text-page-title` | 페이지 타이틀 | `AppPageHeader` h1, `.panel__name`(근무자명 — 향후) |
| 15px / 700 | `text-panel-header` | 상세 패널 헤더 타이틀 | `.pointdetail__head`(코스/지점 페이지 — 향후) |
| 14.5px / 700 | `text-panel-title` | 상세 패널 타이틀 | `AppDetailCard` title |
| 14px / 700 | `text-section-title` | 섹션 타이틀 | 페이지 내 큰 섹션 헤딩(배치관리 등 — 향후) |
| 13px / 400·600 | `text-tab` | 본문 규격 값(참고), 탭 라벨 | `PatrolHistoryTabs`(비활성 600, 활성 700) |
| 12.5px | `text-body` | 테이블 셀·카드 kv 값·이름·필터 칩·버튼 라벨·타임라인 타이틀 | `AppDetailRow`, `AppFilterButton`, `PatrolTimeline` tl-title, `AppTable` td(010에서 해소), `PatrolRecordDialog` label/value |
| 12px | `text-caption` | 페이지 설명·타임라인 노트·footer | `AppPageHeader` subtitle, `PatrolTimeline` tl-note |
| 11.5px | `text-meta` | 보조 텍스트(시각 등) | `PatrolTimeline` tl-time |
| 11px | `text-badge` | 뱃지·pill | `AppBadge` |
| 10.5px uppercase | `text-label` | 테이블 헤더 라벨·섹션 라벨·플래그 라벨 | 섹션 `<h4>`(순찰 정보/타임라인), `PatrolTimeline` tl-flag, `AppTable` thead(이월 — §6 Open Q) |

- **헤딩 weight**: 표 참조(대부분 700). letter-spacing -0.01em.
- **본문 weight 기준**: 400(기본) / 500(강조 라벨) / 600(헤더 셀·탭 비활성) / 700(아주 강조·탭 활성). 800 이상은 지양.
- **적용 상태**: 순찰이력 전용 컴포넌트(`AppPageHeader`/`AppFilterButton`/`AppDetailCard`/`AppDetailRow`/`AppBadge`/섹션 라벨/`PatrolHistoryTabs`/`PatrolTimeline`)는 009에서, `AppTable` td는 010에서 시맨틱 토큰(`text-body`)까지 반영 완료. `AppTable` thead(10.5px 대상)·`AppButton`은 로그인·에러·미리디자인 zone/points 화면과 공유하므로 **미반영**(여전히 `text-xs`/`text-sm` 등) — 각 화면이 리디자인되는 Phase(3·5)에서 함께 토큰 전환 예정(§6 Open Q).

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

- 표준은 **`AppButton`** (단일 표준). `src/components/app/AppButton.tsx` 위치.
  - `variant`: `default` / `sub` / `destructive` / `dash`
  - `size`: `full` / `fit`
  - `icon`(LucideIcon) + `iconPosition`(left/right) 옵션 내장
- shadcn `components/ui/button.tsx`는 dialog/sheet/alert-dialog 내부 의존만 남음. 신규 화면에서 직접 import 금지.
- 마이그레이션 정책은 §5 D1 참고.

### 2-4. 폼

- 라이브러리: **react-hook-form + zod**. 스키마는 `features/{도메인}/form/schema.ts`.
- 인풋은 **`AppInput`** 사용(variant: `default` / `search` / `password`). 에러는 인풋 하단 `text-xs text-danger`.
- 체크박스는 **`AppCheckbox`**. 라벨·에러 동일 패턴.
- 라벨 표기는 `text-sm font-medium`. 필수 표시는 `*`(`text-danger`).

### 2-5. 반응형

- PC 기준 + 모바일은 **분할화면 대응 UI**만. 모바일 전용 기능 X.
- breakpoint는 Tailwind 기본값을 쓰고 커스텀하지 않는다.

#### 🔴 단계는 **`xl` 하나만** 쓴다 (2026-10-08 결정)

| 구간 | 기준 | 의도 |
|---|---|---|
| **넓은 화면** | `xl` 이상 (>= 1280px) | 기본. 모든 정보를 편다 |
| **좁은 화면** | `xl` 미만 | 분할화면. **덜어내기만** 한다 |

**왜 하나뿐인가** — 대응 대상이 "모바일 전용 UI" 가 아니라 **PC 분할화면** 하나다.
단계를 여러 개 두면 중간 구간마다 레이아웃을 설계·검증해야 하는데, 그 구간을 쓰는
사용자가 정의돼 있지 않다. **"편다 / 덜어낸다" 두 상태**면 충분하고 검증도 2배로 끝난다.

**덜어내는 방식 (우선순위)**
1. **라벨을 숨기고 아이콘만** 남긴다 (`hidden xl:inline`) — 🔴 이때 `aria-label` 을 반드시
   남긴다. 아이콘만 남으면 버튼에 **접근 가능한 이름이 없어진다**
2. **부차적 컬럼·섹션을 감춘다** — 식별·상태에 쓰이는 것은 끝까지 남긴다
3. **2단 레이아웃을 1단으로** 접는다 (`patterns.md` §8)

**적용 범위** — 🔴 **새로 쓰는 코드부터**다. 기존 `sm`/`md`/`lg` 사용처가 **25곳**
(`sm` 14 · `md` 9 · `lg` 2) 있는데, 한 번에 바꾸면 화면 전반을 다시 검증해야 한다.
**그 화면을 손볼 때 함께 정리**하고, 일괄 정리가 필요해지면 별도 spec 으로 다룬다.
⚠️ 그때까지 `sm`/`md`/`lg` 가 코드에 남아 있는 것은 **미정리이지 다른 규칙이 아니다.**

### 2-6. 클래스 사용 규칙

- 토큰을 직접 var()로 부르지 말고 Tailwind 유틸 사용(`bg-point` / `text-point-foreground`).
- 그림자보다 **border 우선**. 본 디자인은 평면 UI 베이스(목업 전반 확인).
- 호버 효과는 `hover:bg-muted` / `hover:bg-{semantic}/10` 정도로 절제.
- 🔴 **틴트 배경 버튼의 hover 는 투명도를 낮추지 않는다**(2026-10-08). `bg-point-bg` 처럼
  이미 밝은 틴트(`--point-bg` = `oklch(0.955 …)`)에 `hover:bg-point-bg/80` 을 주면 흰 배경에
  **더 묻혀** 상호작용이 아니라 **비활성처럼** 읽힌다. **한 단계 진해지는 쪽**으로 간다 —
  `hover:bg-{semantic}/20`. 솔리드 버튼(`bg-primary`)에서 `hover:bg-primary/90` 이 통하는 것은
  **원색이 어두워서**지 같은 규칙이 아니다.

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

- **결정**: 본 프로젝트의 표준 버튼은 **`AppButton`** (`src/components/app/AppButton.tsx`). shadcn `ui/button.tsx`는 dialog/sheet/alert-dialog 내부 의존만 남김.
- **사유**:
  - 본 프로젝트 variant는 4종(`default`/`sub`/`destructive`/`dash`)으로 충분.
  - shadcn `Button`은 size 8종 + variant 6종 + asChild 등 옵션이 과함. A5(단순하게)와 충돌.
  - 아이콘 + label 조합이 거의 모든 버튼에 등장 → `icon`/`iconPosition` 내장 형태가 더 효율.
- **마이그레이션 (006에서 완료)**:
  - `src/components/Button.tsx` → `src/components/app/AppButton.tsx` 이동 + default export 이름 `AppButton`으로 변경
  - `src/components/AppIconButton.tsx` → `src/components/app/AppIconButton.tsx` 이동
  - 11개 import 사이트 일괄 갱신 완료. `@/components/Button` / `@/components/AppIconButton` grep 결과 0건.
  - shadcn `ui/button.tsx`는 dialog/sheet/alert-dialog 내부 의존만 남음 — Phase 6에서 shadcn 의존 정리 시 함께 검토.

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

### D10. 리디자인 방향성 (Notion/Linear/Vercel 밀도)

- **결정**: 현장 사이트 5개 화면(순찰이력·코스/지점·근무자·배치관리·공지사항)의 UI를 **미니멀·고밀도 SaaS 스타일**로 전면 교체. 데이터·기능·문구는 유지.
- **사유**: 1차 시안이 "장난감 같다(toy-like)"는 피드백. 실사용 SaaS 도구의 밀도·정보량에 부합하도록.
- **범위 밖**: `/admin/*`(본사 사이트), 로그인/랜딩은 이번 라운드 미적용. 추후 별도 라운드.
- **주요 변화 포인트**:
  - 좌측 컴팩트 아이콘 레일(68px) + TopNav 제거 (layout.md §2, §3)
  - Pretendard + 작은 폰트 스케일(본문 13px 등, §1-2)
  - 페이지 헤더 = 제목 + 서브텍스트 한 줄 (layout.md §5-1)
  - 우측 상세 패널의 카드화 (layout.md §4-2)
  - 배치관리 = 마스터-디테일 폐기, KPI + 인라인 액션 대시보드 (screens.md §1-4A)
  - 코스 상세 = 지점 리스트 → **경로 다이어그램 카드 + 편집 리스트 분리** (screens.md §1-3)

### D11. 폰트 = Pretendard

- **결정**: Geist Variable → **Pretendard**로 교체.
- **사유**: 국문 렌더링 최적화. 리디자인 목업의 국문 폰트 매칭.
- **로딩(007에서 확정)**: `@fontsource-variable/pretendard`는 **존재하지 않는 패키지명**(fontsource의 Pretendard는 Latin 서브셋만 제공, 한글 미포함 — 사용 불가). 공식 **`pretendard`** npm 패키지(`pretendard/dist/web/variable/pretendardvariable.css`)로 채택. `font-family: 'Pretendard Variable'`(한글+라틴 통합 가변 폰트, woff2 단일 파일 2MB). `src/index.css` 최상단 `@import`로 로드, `--font-sans` 값을 `'Pretendard Variable', sans-serif`로 교체.

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
- [x] **AppButton 마이그레이션 완료 시점** — **해소(006)**: 파일 이동·이름 정합화·11개 import 일괄 갱신으로 종결. shadcn `ui/button.tsx`는 dialog/sheet/alert-dialog 내부 의존만 남음(Phase 6에서 별도 검토).
- [ ] **AppEmpty 장식 oklch → 토큰화** — 현재 인라인 oklch. `point` 트리오로 흡수할지, 별도 토큰 추가할지
- [ ] **그림자 시스템** — 현재 거의 미사용. 필요 시 elevation 토큰 정의할지
- [x] **코스 순찰이력 `진행중` 뱃지 시맨틱** — **해소(009)**: 목업(`docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png`) 재확인 결과 파란색 확정 → `point` 매핑. §1-1 사용 매트릭스에서 `warning` 행의 "진행 중" 제거, `point` 행에 "코스 순찰이력 = 진행중" 추가.
- [x] **`AppTable` td 타이포 스케일 미반영** — **해소(010)**: `text-[13px]` → `text-body`(12.5px)로 전환. 전역 컴포넌트라 로그인·에러·미리디자인 화면의 테이블도 함께 적용됨(의도된 일괄 반영).
- [ ] **`AppButton`/`AppTable` thead 타이포 스케일 미반영** — §1-2 신규 스케일(12.5px 버튼 라벨, 10.5px uppercase 테이블 헤더)이 두 곳엔 아직 미적용. 로그인·에러·미리디자인 zone/points 화면과 공유하는 탓에 범위 제외 유지. 각 화면이 리디자인되는 Phase(3·5)에서 함께 조정.
- [x] **뱃지(`AppBadge`) 텍스트 채도** — **해소(010)**: 1차로 채도 상향(예: point 0.12→0.19) 조정 후, 이어서 리디자인 목업 실제 CSS 값(`--success-bg/-foreground`, `--danger-bg/-foreground`, `--point-bg/-foreground`(목업명 accent), `--warning-bg/-foreground`)으로 최종 확정. 메인 토큰(`--point`/`--success`/`--warning`/`--danger`)은 버튼·포커스링·폼 에러 등 기존 용처가 많아 변경하지 않고 `-bg`/`-foreground`만 교체. `AppKpiCard`/`AppFilterButton` 활성 상태/인증뱃지 등 트리오 공유 컴포넌트에도 함께 반영됨(토큰 레벨 변경). `muted`(회색) 뱃지 변형은 `--muted`/`--muted-foreground`를 그대로 사용 — 이 토큰은 훨씬 넓게 공유되어 이번 범위에서 제외.
- [x] **필터 트리거(`AppFilterButton`) 배경** — **해소(010)**: `bg-background` → `bg-card`(surface)로 변경, 페이지 배경과 시각적으로 분리.
- [x] **클릭 요소 커서** — **해소(010)**: `src/index.css`에 `button:not(:disabled), [role='button']:not(:disabled) { cursor: pointer }` 전역 규칙 추가(Tailwind가 버튼 기본 커서를 pointer로 주지 않음). `AppTable` 행은 `onRowClick` 존재 시에만 `cursor-pointer`.
