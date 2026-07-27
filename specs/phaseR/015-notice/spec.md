# 015-notice spec

> 위험도: **B** (출처: `roadmap.md` §5-2, `screens.md` §1-5 "공지사항 목록 + 선택 공지 상세" 진행도 ✗)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#1-5-알림--환경설정) §1-5
> Phase: roadmap.md Phase R (R2-7)
> **비고**: 013·014와 달리 **리디자인판 목업(`-신규.png`) 없음**. `docs/ui-mock/현장/공지사항/`엔 1차(구) 목업(`목록.png`, `생성.png`)만 존재 — 데이터·문구는 유효, 시각 표현은 폐기(`design-system.md` 안내). roadmap 지시("다른 리디자인 화면과 동일 컨셉 자동 적용")에 따라 013(근무자)의 마스터-디테일 컨셉을 계승하되, 공지 도메인 특성(콘텐츠 소비형)에 맞춰 **우측 상세 패널 대신 리스트 목록 + 별도 상세 페이지(`/notice/:id`)** 구조로 신규 설계(사용자 확인 완료, 아래 §1 참조).

---

## 0. Carry-over (014 → 015)

- **거부된 요청(REJECTED)의 이력 노출 여부** — 014 Open Question. `/notice`와 무관 → 실 API 연동 단계(Phase 3 이후)로 계속 이월.
- **근무자 삭제 시 대기중 배치요청 영향** — 013→014 이월분. `/notice`와 무관 → 실 API 연동 단계로 계속 이월.
- **비밀번호 초기화 실제 값 생성 방식** — 013 Open Question. `/notice`와 무관 → Phase 3 이후 유지.
- **`AppTable`/파생 배열 참조 불안정 → 실 브라우저 무한 재렌더 위험(014 T093)** — 015는 목록에 `AppTable`을 쓰지 않으므로(§1 결정) 직접 해당 없음. 다만 `NoticeList`가 검색어로 mock을 필터링해 파생 배열을 만들 경우 동일 위험이 있으므로 `useMemo`로 감쌀 것(본 spec DoD에 반영).
- DoD 미달 항목 없음(014는 전 항목 완료).

---

## User Stories

- US1. 현장관리자가 `/notice`에 접속하면 리스트(읽음 상태·제목·첨부 여부·작성자·작성일)에서 공지를 훑어보고, 항목을 클릭해 `/notice/:id` 상세 페이지로 이동해 전체 내용(작성자·작성일·앱 푸시 발송 여부·본문·첨부파일)을 확인한다.
- US2. 현장관리자가 상세 페이지의 "수정"/"삭제" 액션으로 각각 수정 모달, 삭제 확인 모달을 열고, 삭제 확정 시 목록으로 돌아간다.
- US3. 현장관리자가 목록 상단 "공지 작성" 버튼으로 작성 모달(제목·본문·"저장 시 앱 푸시 발송" 체크박스)을 연다.

---

## 1. 목적

`/notice`(공지사항) 화면을 신규 구현한다. 리디자인판 목업이 없어 013(근무자)의 마스터-디테일 컨셉을 기본으로 삼되, 공지는 근무자 관리처럼 필드별로 비교·조회하는 데이터가 아니라 "제목을 훑고 하나를 골라 읽는" 콘텐츠형 화면이므로, 좌측 전체 폭 **테이블** 대신 **리스트 아이템**으로, 우측 **상세 패널** 대신 **별도 상세 페이지(`/notice/:id`)**로 구조를 조정한다. 상세를 별도 라우트로 분리하는 방식은 `patterns.md` §1이 명시한 기존 예외 사례(`/admin/locations/:id`)와 동일한 컨벤션이다. 작성/수정은 기존 결정대로 모달을 유지한다(`patterns.md` §2 CRUD 모달에 "공지" 이미 포함).

---

## 2. I/O

### Input
- 공지 mock 데이터: `features/notice/mocks/noticeData.ts` 신규 작성(`data-model.md` §3-5 `Notice`/`NoticeSummary`/`NoticeAttachment` 기반). 구목업(`목록.png`) 4건 상당 + 최신순 정렬, 최소 1건은 `attachments` 2건 포함(첨부 표시 케이스 확보).
- 검색어: 페이지 로컬 `useState`(013/009/010과 동일하게 **비와이어드** — 입력창만 존재, 실 필터링은 Phase 3 이후).
- 라우트 파라미터: `:id` — 상세 페이지에서 mock 배열 조회에 사용.

### Output
- 화면 전환: 목록 아이템 클릭 → `/notice/:id` 이동. 상세 페이지 "목록으로" → `/notice`. 삭제 확정 → `/notice`로 리다이렉트.
- 상태 변화: 작성/수정/삭제 모달 제출은 `console.log` 스텁(002~014 관례 동일, 실 API는 Phase 3 이후).
- 외부 효과: 없음.

---

## 3. 제약

### 기술 제약
- **재사용(필수)**: `AppPageHeader`, `AppInput`, `AppButton`, `AppBadge`, `AppEmpty`, `AppPagination`, `AppDialog`, `AppAlertDialog`, `AppDetailRow`(상세 페이지 메타 정보 표시에 활용).
- **신규 파일**:
  - `src/features/notice/types/notice.ts` — `Notice`/`NoticeSummary`/`NoticeAttachment`(data-model.md §3-5 그대로, 화면 미표시 필드 제외).
  - `src/features/notice/mocks/noticeData.ts` — 데모 데이터.
  - `src/features/notice/components/NoticeListItem.tsx` — 리스트 아이템 1행(읽음 dot + 제목 + 첨부 아이콘(`hasAttachment`) + 작성자 + 작성일 + `AppBadge`("신규"=point, "읽음"=muted)).
  - `src/features/notice/components/NoticeList.tsx` — 검색 `AppInput`(비와이어드) + `NoticeListItem` 반복 + `AppPagination` + 빈 상태(`AppEmpty`) 조립.
  - `src/features/notice/components/NoticeDetailView.tsx` — 상세 뷰(제목 + 작성자 + 작성일 + `appPushSent`면 `AppBadge` "앱 푸시 발송" + 본문 + 첨부 리스트(있는 경우, 읽기전용 파일명만) + 하단 액션 풋터(수정/삭제, `patterns.md` §11 패턴)).
  - `src/features/notice/form/schema.ts` + `NoticeForm.tsx` — 작성/수정 겸용 react-hook-form+zod(제목/본문/`sendAppPush` 체크박스 — `AppCheckbox`), 013 `AddWorkerForm`/`EditWorkerForm` 패턴.
  - `src/pages/service/notice/NoticeListPage.tsx` — 목록 페이지 조립(`AppPageHeader` + "공지 작성" 버튼 + `NoticeList`).
  - `src/pages/service/notice/NoticeDetailPage.tsx` — 상세 페이지 조립(`useParams<'id'>()`로 mock 조회, 미존재 시 `AppEmpty`).
- **라우터 연동**:
  - `src/router/paths.ts`에 `noticeDetail(id: string)` 함수 + `pathPatterns.noticeDetail: '/notice/:id'` 추가(기존 `adminLocationDetail` 패턴 그대로).
  - `src/router/index.tsx`에 `paths.service.notice`(목록, 경로 상수는 007에서 이미 예약됨 — 페이지 연결만 추가) + `pathPatterns.noticeDetail`(상세, 신규) 라우트 등록.
- **필드명 주의**: 작성/수정 요청은 `CreateNoticeRequest.sendAppPush`(data-model.md §5-3), 조회 응답은 `Notice.appPushSent`(§3-5) — 이름이 다르다. 폼 제출 스텁에서 혼동하지 않는다.

### 비즈니스 규칙
- **목록 정렬**: 작성일 최신순. `index`는 mock에서 구목업의 `#`처럼 부여.
- **읽음 상태 표시**: `NoticeSummary.isNew`/`readByMe`는 mock 고정값을 그대로 뱃지로 표시만 한다. 읽음 처리 로직 자체는 `data-model.md` §7 Open Question("공지 읽음 처리") 미확정 상태를 그대로 유지 — 015 범위 아님.
- **첨부파일**: 결정대로 **표시만**. mock 데이터 일부에 `attachments`를 포함해 상세 페이지에 읽기전용 파일명 리스트로 노출한다. 다운로드/미리보기 기능 없음. 작성/수정 모달에는 첨부 UI를 넣지 않는다(업로드 위젯은 roadmap Phase 2 "Notice 첨부 업로드 위젯" 항목, 015 범위 밖).
- **삭제**: `AppAlertDialog`(destructive) 확인 모달 → 확인 시 스텁 처리 후 `/notice`로 리다이렉트.
- **파생 배열 안정성**: 검색은 013/009/010과 동일하게 **비와이어드**(입력창만 존재, 실 필터링 없음)로 둔다. 대신 `NoticeList`가 `AppPagination` 페이지에 맞춰 mock 배열을 슬라이스할 때는 `useMemo([notices, pageIndex, pageSize])`로 배열 참조를 안정화한다(014 T093 교훈 이월, §0 참조).

---

## 4. 엣지 케이스

공통 규칙 따름(`CLAUDE.md`/`design-system.md`).

- 공지 목록이 비어 있으면 `AppEmpty` 표시.
- `/notice/:id`에 존재하지 않는 id로 접근하면 `AppEmpty`(또는 목록으로 안내) 표시 — 404 페이지 전환은 아님(라우트 자체는 유효).
- 첨부파일이 없는 공지는 상세 페이지에서 첨부 섹션 자체를 렌더하지 않는다.

---

## 5. 완료 조건 (DoD)

- [x] `/notice` 접속 시 `AppPageHeader` + 검색 `AppInput` + "공지 작성" 버튼 + 리스트(읽음 dot·제목·첨부 아이콘·작성자·작성일·`AppBadge`) + `AppPagination` 렌더 — src/pages/service/notice/NoticeListPage.tsx, src/features/notice/components/NoticeList.tsx, src/features/notice/components/NoticeListItem.tsx
- [x] 리스트 아이템 클릭 시 `/notice/:id`로 이동, 상세 페이지에 제목·작성자·작성일·(해당 시)앱 푸시 뱃지·본문·(해당 시)첨부 리스트 표시 — src/pages/service/notice/NoticeDetailPage.tsx, src/features/notice/components/NoticeDetailView.tsx. Playwright 확인 완료(id=4 "6월 정기 순찰 점검 안내", 첨부 2건)
- [x] 상세 페이지 "수정" 클릭 시 작성 모달과 동일 폼이 기존 값으로 채워진 채 오픈, "삭제" 클릭 시 확인 모달 → 확인 시 `/notice`로 리다이렉트 — src/features/notice/components/NoticeDetailView.tsx:56-79. Playwright로 프리필/확인모달 노출 확인
- [x] "공지 작성" 버튼 클릭 시 작성 모달 오픈, 제목/본문 필수 zod 검증 통과해야 제출 가능 — src/features/notice/form/schema.ts, src/features/notice/form/NoticeForm.tsx, vitest(src/features/notice/form/__tests__/NoticeForm.test.tsx)로 검증
- [x] 공지 없음/미존재 id 모두 `AppEmpty`로 처리 — src/features/notice/components/NoticeList.tsx(빈 목록), src/pages/service/notice/NoticeDetailPage.tsx(미존재 id), vitest 1건 + Playwright 확인
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 27 files/81 tests 통과(기존 77 + 신규 4)
- [x] `screens.md` §1-5 진행도 ✗ → ✓ 갱신, `roadmap.md` §12 "R Redesign — 015" 행 갱신, `screens.md` §4 라우트 매핑의 `/notice` 행 갱신(015 구현 완료로 반영) — docs/screens.md, docs/roadmap.md, docs/patterns.md(§1 상세 라우트 예외 추가)
- [~] 브라우저 확인(M2) — Playwright(msedge, 임시 설치 후 제거)로 목록·상세·수정모달 프리필·삭제확인모달·미존재id 5개 화면 스크린샷 + 콘솔 에러 0건까지 확인 완료. 사용자의 최종 시각 확인은 대화 응답에서 대기 중(M2는 사용자 판단 의무 — 스크린샷 첨부해 보고함)

---

## Open Questions

- [ ] **공지 읽음 처리 실효성** — `data-model.md` §7 기존 Open Question 유지(근무자는 WEB 미접속이라 `readByMe`가 관리자 본인 읽음인지 불명확). 015는 mock 고정값 표시만 하고 결론 내지 않음.
- [ ] **첨부파일 업로드/다운로드** — Phase 2 "Notice 첨부 업로드 위젯" 완성 후 015의 표시 전용 목록에 실제 업로드·다운로드 연동 필요.

---

## 참고

- 관련 목업(1차, 참고용): `docs/ui-mock/현장/공지사항/목록.png`, `docs/ui-mock/현장/공지사항/생성.png` — 데이터·문구만 참고, 시각 표현은 폐기.
- 관련 데이터 모델: `data-model.md` §3-5(`Notice`/`NoticeSummary`/`NoticeAttachment`), §5-3(`CreateNoticeRequest`/`UpdateNoticeRequest`).
- 관련 패턴: `patterns.md` §1(마스터-디테일, 상세 단위 라우트 예외), §2(CRUD 모달), §11(액션 풋터).
- 참고 구현: `src/pages/service/users/UsersPage.tsx`(013, 액션 풋터·모달 구성), `src/router/paths.ts`(`adminLocationDetail` 상세 라우트 패턴).
