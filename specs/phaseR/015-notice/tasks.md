# 015-notice tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 B — 화면 단위로 크게 분할.

---

## Phase 1: Setup

- [x] T094 [P] 타입 정의(`Notice`/`NoticeSummary`/`NoticeAttachment`, data-model.md §3-5 그대로) in src/features/notice/types/notice.ts
- [x] T095 [P] zod 스키마(제목/본문 필수, `sendAppPush` boolean) in src/features/notice/form/schema.ts

## Phase 2: Foundational

- [x] T096 mock 데이터(구목업 4건 상당, 최신순, 최소 1건 `attachments` 2건 포함) in src/features/notice/mocks/noticeData.ts
- [x] T097 [P] 라우트 상수 — `noticeDetail(id)` 함수 + `pathPatterns.noticeDetail: '/notice/:id'` 추가(`adminLocationDetail` 패턴 동일) in src/router/paths.ts

## Phase 3: US1 — 목록 조회 + 상세 페이지 이동

> **독립 테스트 기준**: `/notice` 접속 시 리스트(읽음 dot·제목·첨부 아이콘·작성자·작성일·뱃지) 렌더. 아이템 클릭 시 `/notice/:id`로 이동해 제목·작성자·작성일·본문·(있으면)첨부 표시. 존재하지 않는 id는 `AppEmpty`.

- [x] T098 [US1] `NoticeListItem.tsx` — 읽음 dot + 제목 + 첨부 아이콘(`hasAttachment`) + 작성자 + 작성일 + `AppBadge`("신규"=point, "읽음"=muted) in src/features/notice/components/NoticeListItem.tsx
- [x] T099 [US1] `NoticeList.tsx` — 검색 `AppInput`(비와이어드) + `NoticeListItem` 반복 + `AppPagination`(mock 슬라이스는 `useMemo`) + 빈 상태 `AppEmpty` in src/features/notice/components/NoticeList.tsx
- [x] T100 [US1] `NoticeDetailView.tsx` — 제목/작성자/작성일/(있으면) 앱 푸시 `AppBadge`/본문/(있으면) 첨부 파일명 리스트(읽기전용) 표시부만 우선 구현(액션 풋터는 Phase 4에서 연결) in src/features/notice/components/NoticeDetailView.tsx
- [x] T101 [US1] `NoticeListPage.tsx` — `AppPageHeader`(제목 "공지사항", 서브타이틀 "총 {N}건") + `NoticeList` 조립 in src/pages/service/notice/NoticeListPage.tsx
- [x] T102 [US1] `NoticeDetailPage.tsx` — `useParams<'id'>()`로 mock 조회 + `NoticeDetailView` 렌더, 미존재 시 `AppEmpty` in src/pages/service/notice/NoticeDetailPage.tsx
- [x] T103 [US1] 라우터 등록 — `paths.service.notice`(목록)·`pathPatterns.noticeDetail`(상세) 라우트 연결 in src/router/index.tsx

## Phase 4: US2 — 수정 / 삭제

> **독립 테스트 기준**: 상세 페이지 "수정" 클릭 → 모달에 기존 값이 채워진 채 오픈. "삭제" 클릭 → 확인 모달 → 확인 시 `/notice`로 리다이렉트.

- [x] T104 [US2] `NoticeForm.tsx` — 작성/수정 겸용, react-hook-form+zod(013 `EditWorkerForm` 패턴), 제목/본문/`sendAppPush` `AppCheckbox` in src/features/notice/form/NoticeForm.tsx
- [x] T105 [US2] `NoticeDetailView.tsx`에 액션 풋터 연결 — "수정"(`AppDialog`+`NoticeForm`, 기존 값 프리필) / "삭제"(`AppAlertDialog`, 확인 시 `console.log` 스텁 + `navigate(paths.service.notice)`) in src/features/notice/components/NoticeDetailView.tsx

## Phase 5: US3 — 공지 작성

> **독립 테스트 기준**: 목록 "공지 작성" 클릭 → 모달 오픈. 제목/본문 미입력 시 zod 에러로 제출 차단. 입력 후 제출 시 `console.log` 스텁 처리(013 관례 동일 — 모달 자동 닫힘 없음, 폼은 비제어형 유지).

- [x] T106 [US3] `NoticeListPage.tsx`에 "공지 작성" `AppButton`(primary) + `AppDialog`+`NoticeForm`(생성 모드) 연결 in src/pages/service/notice/NoticeListPage.tsx

## Phase 6: Polish

- [x] T107 [P] vitest — `NoticeForm` 제목/본문 미입력 시 zod 에러 노출 in src/features/notice/form/__tests__/NoticeForm.test.tsx
- [x] T108 [P] vitest — `NoticeDetailPage` 존재하지 않는 id 접근 시 `AppEmpty` 렌더 in src/pages/service/notice/__tests__/NoticeDetailPage.test.tsx
- [x] T109 [P] `docs/screens.md` §1-5 진행도 ✗→✓ + §4 라우트 매핑 `/notice` 행 갱신, `docs/roadmap.md` §12 "R Redesign — 015" 행 갱신 in docs/screens.md, docs/roadmap.md (`docs/patterns.md` §1도 함께 갱신 — 우측 패널이 아닌 상세 라우트 예외로 편입)
- [~] T110 [P] 브라우저 확인(M2) — Playwright(msedge channel, 임시 설치·작업 종료 후 제거, 014 관례 동일)로 목록/상세/수정모달 프리필/삭제확인/미존재id 5개 화면 스크린샷 확보 + 콘솔 에러 0건 확인 완료. **사용자 최종 시각 확인은 대화 응답에서 대기**(M2는 사용자 판단이 의무)

## Phase 7: 사용자 피드백 — 리스트 아이템 레이아웃 재설계

> 사용자가 카드형 대신 npm 목록형(제목/내용 미리보기/작성자 좌측, 배지+날짜 우측, 구분선 리스트) 요청. 읽음 dot·첨부 아이콘·신규/읽음 배지는 유지하되 재배치(사용자 확인).

- [x] T111 `NoticeSummary`에 `contentPreview`(1줄 미리보기) 필드 추가 in src/features/notice/types/notice.ts, docs/data-model.md §3-5, src/features/notice/mocks/noticeData.ts
- [x] T112 `NoticeListItem.tsx` 재설계 — flex-row(왼쪽 flex-1: dot+제목+첨부아이콘 / 내용 미리보기 1줄 truncate / 작성자, 오른쪽: 신규·읽음 배지 + 날짜 `yy.MM.dd`) in src/features/notice/components/NoticeListItem.tsx
- [x] T113 `NoticeList.tsx` 컨테이너를 개별 카드 목록에서 `divide-y` 리스트(카드 박스 없음)로 변경 in src/features/notice/components/NoticeList.tsx
- [x] T114 `npm run verify` + `npm run test` green 재확인(27 files/81 tests, 타입 확장에 따른 테스트 mock 보정 포함) in src/features/notice/form/__tests__/NoticeForm.test.tsx
- [x] T115 브라우저 확인(M2) — Playwright로 재설계된 목록 화면 스크린샷 확보, 사용자 요청 레이아웃과 일치 확인

## Phase 8: 사용자 피드백 — 타이포/정렬/간격 미세조정

> 제목 폰트를 읽음 여부 무관 통일(14~17px 중 추천값 + semibold), 제목 좌측 정렬(읽음 dot는 신규일 때만 표시), 제목·내용·작성자 간 간격 확대.

- [x] T116 `NoticeListItem.tsx` 제목을 `text-panel-header`(15px, 기존 등록됐으나 미사용 토큰의 첫 실사용) + `font-semibold`로 통일(읽음 여부 무관), 읽음 dot는 `notice.isNew`일 때만 렌더(공간 항상 예약 안 함) in src/features/notice/components/NoticeListItem.tsx
- [x] T117 제목/내용 미리보기/작성자 세로 간격 `gap-1` → `gap-2`로 확대 in src/features/notice/components/NoticeListItem.tsx
- [x] T118 `npm run verify` + `npm run test` green 재확인(27 files/81 tests) + Playwright 스크린샷으로 최종 레이아웃 확인

## Phase 9: 사용자 피드백 — 신규/읽음 뱃지 제거

> 088에서 제안한 대로, 신규/읽음 뱃지를 완전히 제거하고 신규 항목은 dot만으로 표시(사용자 확인). 우측엔 날짜만 남음.

- [x] T119 `NoticeListItem.tsx`에서 `AppBadge`(신규/읽음) 제거, 우측 컬럼을 날짜 단독 `<span>`으로 단순화 in src/features/notice/components/NoticeListItem.tsx
- [x] T120 `npm run verify` + `npm run test` green 재확인(27 files/81 tests) + Playwright 스크린샷으로 최종 레이아웃 확인

---

## Dependencies & Execution Order

- T094, T095 [P] 서로 독립, 다른 모든 태스크 선행.
- T096 = T094 완료 후(mock이 타입을 사용). T097은 T094/T095와 무관하게 독립적으로 아무 때나 가능.
- T098, T100 = T096 완료 후(컴포넌트가 mock 데이터 형태 참조). T098 → T099.
- T101 = T099 완료 후. T102 = T100 완료 후.
- T103 = T097 + T101 + T102 완료 후(라우트 상수와 두 페이지가 모두 있어야 등록 가능). Phase 3 종료 지점.
- T104 = T095 완료 후. T105 = T104 + T100 완료 후. Phase 4는 Phase 3 완료 후 이어서 진행(같은 컴포넌트 `NoticeDetailView`를 이어서 수정).
- T106 = T104 + T101 완료 후. Phase 5는 Phase 4와 독립적으로 병렬 착수 가능(다른 페이지, `NoticeForm`만 공유).
- T107 = T104 이후 / T108 = T102 이후.
- T109, T110 = 모든 코드 태스크(T094~T106) 완료 후.
- **세션 분할 권장**: B급이라 Phase 1~3(목록+상세 조회, US1)을 한 세션으로, Phase 4~5(수정/삭제/작성, US2~US3)를 이어지는 세션으로 진행 가능. Phase 6은 전체 완료 후 마무리 세션.

## 다음 spec으로 이월

> 다음 spec(**016-redesign-regression**, R3, 전역 회귀)의 `§0 Carry-over` 입력원.

- [ ] **공지 읽음 처리 실효성** — `data-model.md` §7 기존 Open Question, 015에서도 결론 없이 mock 고정값 표시만 함. `/notice`와 무관한 전역 판단 필요 → 016(전역 회귀)에서 다룰 사안 아님, Phase 3 이후(실 API 연동 단계)로 계속 이월.
- [ ] **첨부파일 업로드/다운로드** — roadmap Phase 2 "Notice 첨부 업로드 위젯" 완성 후 015의 표시 전용 첨부 리스트에 실제 업로드·다운로드 연동 필요. 016과 무관, Phase 2로 이월.
- [ ] **T110 브라우저 확인 최종 사용자 승인** — Playwright로 5개 화면 스크린샷·콘솔 에러 0건까지는 확인 완료. 사용자의 최종 시각 확인(M2 의무)이 대화 응답에서 아직 대기 중 → 완료 시 본 항목 체크.
- DoD 미달 항목: 없음(위 T110 사용자 확인 대기 1건 제외, 나머지 전 항목 완료 — `npm run verify` exit 0 · `npm run test` 27 files/81 tests 통과).
