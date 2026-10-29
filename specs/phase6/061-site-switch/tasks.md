# 061-site-switch tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 **B** — 화면 단위로 크게.

## 구현 방향 (WF-2 결정 — spec §3 "방법은 WF-2 에서" 2건)

| 문제 | 방법 |
|---|---|
| `getSiteSeq()` 가 반응형이 아니라 홈(`/zones`)에서 바꾸면 다시 그려지지 않는다 | `ServiceLayout` 이 현재 `siteSeq` 를 state 로 들고 **`<Outlet key={siteSeq} />`** — 전환 = 현장 영역 통째 재마운트. 렌더 때 `getSiteSeq()` · `getSiteName()` 을 읽는 37개 파일을 손대지 않는다. 배치 대기 뱃지도 레이아웃 재렌더로 새 `siteSeq` 를 읽는다 |
| 오버레이를 "홈 첫 조회가 끝나면" 걷기 · 영영 안 걷히는 경우 방지 | 재마운트 커밋 뒤(자식 쿼리가 시작된 뒤) `queryClient.isFetching()` 이 0 이 되면 해제(QueryCache 구독). **상한 10초**(axios `timeout` 5초 + refresh 1회 여유) 지나면 강제 해제 |

---

## Phase 1: Foundational

- [x] T1058 [P] 사업장 선택지 조회 훅 in src/features/auth/hooks/useSiteOptions.ts — `fetchUserSiteSelect` + `toSiteOptions` 재사용 · `enabled` 인자(현장 레이아웃만 켠다). 로그인(`LoginForm`)의 직접 호출은 그대로
- [x] T1059 [P] 전환 중 오버레이 in src/components/app/AppBlockingOverlay.tsx — 화면 전체 · `z-50` 위 · `role="status"` · 문구 prop("사업장 전환 중"). 🔄 **포커스는 판 안에 가두지 않고 뒤 영역에 `inert`**(`ServiceLayout`) — 포커스할 것이 없는 판이라 뒤를 통째로 끄는 쪽이 단순하다

## Phase 2: US1 — 사업장 전환

> **독립 테스트 기준**: mock `333333` 으로 레일 · floating nav 전환 버튼 → 모달(현재 사업장 표시) → 다른 사업장 → 오버레이 → `/zones` 에 새 사업장 코스 목록 · 배치 대기 뱃지 · 제목 사업장명 교체. `/zones` 에서 바꿔도 같음. 현재 사업장 선택 = 닫힘만

- [x] T1060 [US1] 선택지 목록 분리 in src/features/auth/components/SiteSelectStep.tsx · src/features/auth/components/SiteOptionList.tsx — 목록(+ `currentSiteSeq` 표시)만 떼고, 로그인 카드 제목 · 문구는 `SiteSelectStep` 에 남긴다(로그인 겉모습 그대로)
- [x] T1061 [US1] 전환 모달 in src/features/auth/components/SiteSwitchDialog.tsx — `AppDialog` + `SiteOptionList`. 현재 사업장 선택 = 닫기만
- [x] T1062 [US1] 전환 버튼 in src/components/layout/sidebar/SiteSwitchButton.tsx(툴팁 = 현재 사업장명) · RailSidebar.tsx(로그아웃 위) · FloatingNav.tsx(로그아웃 옆) — 레일 · nav 는 **버튼 자리(prop)만** 받는다(본사 공용 — 본사는 넘기지 않는다)
- [x] T1063 [US1] 전환 흐름 in src/components/layout/ServiceLayout.tsx — `siteSeq` state · `<Outlet key>` · 오버레이 on → `setSite` → `navigate(paths.service.zones)` → 조회 끝 / 10초 → off

## Phase 3: US2 — 숨김

> **독립 테스트 기준**: `555555`(1개) · 본사 계정에 버튼 없음 · 본사 화면에서 `UserSiteSelect` 요청 0건 · 목록 로딩 · 실패 중 버튼 없음

- [x] T1064 [US2] 선택지 2개 미만 · 로딩 · 실패면 버튼을 넘기지 않는다 in src/components/layout/ServiceLayout.tsx

## Phase 4: 검증 · 문서

- [x] T1065 [P] 단위 테스트 in src/components/layout/__tests__/ServiceLayout.test.tsx(전환 · 재마운트 · 오버레이 해제 · 10초 상한 · 숨김) · src/features/auth/components/__tests__/(모달 · 목록) · 기존 로그인 테스트 green
- [x] T1066 [P] e2e 흐름 **S8** in e2e/flow-service.pw.ts — `333333` 로그인 → 홈(2-1)에서 루트(코스 0건)로 → 빈 목록 → 2-1 로 → 목록 · 1280(레일) + 390(floating nav). 본사 숨김은 `AdminLayout.test.tsx` 에 추가
- [x] T1067 `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) + `npm run test` 1488/1488 병렬 · `npm run e2e` 34/34
- [x] T1068 브라우저 확인(1280 · 390 · mock — 사용자 확인 2026-10-29). 🔄 아이콘 ⇄ → `Building2`(배치관리 메뉴와 겹침 — 사용자 결정) in src/components/layout/sidebar/SiteSwitchButton.tsx
- [x] T1069 문서 — `screens.md` 사업장 전환 행 · `flow.md` §0 · `layout.md`(레일 · floating nav 버튼) · `components.md`(`AppBlockingOverlay`) · `roadmap.md` 061 행 · 021 tasks OQ-021-C 해소 표기

---

## Dependencies & Execution Order

- T1058 → T1062, T1064 · T1059 → T1063
- T1060 → T1061 → T1062 → T1063 → T1064
- T1065 · T1066 은 Phase 2 · 3 뒤. T1067 → T1068 → T1069
- `[P]` 끼리 병렬 가능

---

## 다음 spec으로 이월

- 없음. 059 OQ(F) · 057 OQ(A · B) · 056 OQ(A)는 그대로 범위 외.
