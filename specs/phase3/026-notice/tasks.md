# 026-notice tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 037 이 **T567** 에서 끝났으므로 **T568** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **위험도 B → 화면 단위로 크게 쪼갠다.** 골격은 037 `PatrolPointsPage`·`PatrolPointDetailPage`
> 를 따르고, **새 공용 컴포넌트는 만들지 않는다**(재사용 목록은 `spec.md` §3).

---

## Phase 1: Setup — 서버 모듈 (US1·US2 선행)

> **독립 테스트 기준**: `noticeListParams` 단위 테스트가 빈 값에서 키를 빼고, `pageSize > 100`
> 을 깎고, 깨진 `page` 를 1 로 수렴시킨다.

- [x] T568 서버 타입 선언 in src/features/notice/types/notice.ts — `NoticeRow`·`NoticeDetail`·`NoticeAttach`·`NoticeListParams`. `api-spec.md` §23·24 **실측 그대로 전량**(안 쓰는 `description`·`userSeq` 포함). 🔴 구 타입(`Notice`·`NoticeSummary`·`NoticeAttachment`)은 **이 파일에서 지우지 않는다** — 소비처를 옮긴 뒤 T589 에서 지운다(지금 지우면 Phase 3 전까지 빌드가 깨진다)
- [x] T569 [P] `noticeListParams.ts` 신설 in src/features/notice/lib/noticeListParams.ts — URL 키 `q`·`from`·`to`·`page` → 서버 `keyword`·`fromDt`·`toDt`·`pageNumber`. 🔴 `clampPageSize`·`parsePageNumber`·`toDateQuery` 는 **재사용**(`course-history/lib`) — 다시 만들지 않는다
- [x] T570 [P] `noticeKeys` in src/features/notice/queryKeys.ts — `lists`/`list(params)`/`detail(noticeSeq)`. 🔴 `list` 는 **`siteSeq` 를 키에 포함**(사업장 전환 시 이전 사업장 공지가 남는다)
- [x] T571 [P] API 2종 in src/features/notice/api/getNoticeList.ts · src/features/notice/api/getNoticeDetail.ts — `GET Notice/W/sign/GetNoticeList` · `GET Notice/W/sign/DetailNotice?noticeSeq`
- [x] T572 [P] `noticeListParams` 테스트 in src/features/notice/lib/__tests__/noticeListParams.test.ts — 빈 값 키 제거 · 상한 100 · 1-based · 깨진 URL 수렴

## Phase 2: Foundational — 훅 · MSW · 라우트

> **독립 테스트 기준**: MSW 에서 목록·상세 핸들러가 **각각 1번만** 선언되어 있고(037 T547 의
> 중복 선언 사고), 키워드·기간·페이징 파라미터를 받아 걸러 준다.

- [x] T573 훅 2종 in src/features/notice/hooks/useNoticeList.ts · src/features/notice/hooks/useNoticeDetail.ts — 037 `usePointHistoryList`·`usePointHistoryDetail` 과 같은 모양. 🔴 `noticeSeq` 가 `null` 이면 `enabled: false`
- [x] T574 MSW 핸들러 신설 in src/mocks/handlers/notices.ts · src/mocks/handlers/index.ts — 시드는 `features/notice/mocks/noticeData.ts` 를 **서버 형태로 옮겨** 쓴다(이미지·파일 첨부가 있는 행 / 고정 행 / 첨부 없는 행이 모두 있게). 키워드는 **제목 부분일치**(OQ-026-A 가정), 기간은 `createDt` 기준(OQ-026-C 가정)
- [x] T574a [P] 훅·핸들러 테스트 in src/features/notice/hooks/__tests__/useNotice.test.tsx — 🔴 **계획 외 추가**: Phase 2 게이트("핸들러가 키워드·기간·페이징을 실제로 걸러 준다")를 증명할 자리가 없었다. 목록 정렬·필터 3종·페이지 2·`null` 미요청 · 상세 첨부 2배열·없는 ID 오류
- [x] T575 라우트 파라미터 전환 in src/router/paths.ts · src/router/index.tsx — `noticeDetail(noticeSeq: number)` + `pathPatterns.noticeDetail = '/notice/:noticeSeq'` — ⚠️ **구 목록·상세가 Phase 3·4 까지 동작하도록 한 줄씩만 맞췄다**(`NoticeListItem` 의 `Number(notice.id)` · `NoticeDetailPage` 의 `useParams` 이름 · 그 테스트의 라우트 패턴). 파일째 교체·삭제된다(T578·T585·T589)

## Phase 3: US1 — 목록 테이블화 + 서버 전환

> **독립 테스트 기준**: MSW 200 에서 서버 행이 테이블로 그려지고, 검색·기간·페이지가 URL 에
> 실려 새로고침·뒤로가기에 보존된다. 필터 변경 시 첫 페이지로 돌아간다.

- [ ] T576 [US1] 컬럼 정의 in src/features/notice/components/NoticeColumn.tsx — 4컬럼: 고정(`isPin` 핀 아이콘, 헤더는 `sr-only` 이름) · 제목(+ `attachCount > 0` 클립 아이콘) · 작성자 · 작성일(`yyyy-MM-dd`). 🔴 정렬 화살표 **없음**(서버 정렬 파라미터가 없다)
- [ ] T577 [US1] [P] 카드 모드 in src/features/notice/components/NoticeCard.tsx — 034 타일 골격(`patterns.md` §14). 카드 안에 버튼 없음
- [ ] T578 [US1] 🔴 **페이지 재작성** in src/pages/service/notice/NoticeListPage.tsx — `noticeData` import 삭제. `AppPageHeader`(+ "공지 작성" 모달 유지) → 필터 줄(검색 → `role="group"` 기간 + 초기화 → spacer) → `AppTable`(`hidePagination` + `renderCard`) → `AppPagination`(20/50/100). 검색은 로컬 draft + 디바운스(037 규약)
- [ ] T579 [US1] 상태 분기 in src/pages/service/notice/NoticeListPage.tsx — 조회 실패(다시 시도) / 로딩 스켈레톤 / 0건(필터 있음 "조건에 맞는 공지가 없습니다" · 없음 "등록된 공지가 없습니다") / 목록
- [ ] T580 [US1] [P] 화면 테스트 in src/pages/service/notice/__tests__/NoticeListPage.test.tsx — 서버 행 렌더 · 검색·기간 → 파라미터 · 필터 변경 시 `page` 제거 · 상태 분기 4종 · 행 클릭 → 상세 경로

## Phase 4: US2 — 공지 상세 2열 골격

> **독립 테스트 기준**: MSW 200 에서 `/notice/:noticeSeq` 가 본문·기본정보를 그리고, 이미지·
> 첨부가 없으면 그 카드가 **없다**. `/notice/abc` 는 요청 없이 즉시 오류 화면이다.

- [ ] T581 [US2] 본문 카드 in src/features/notice/components/detail/NoticeBodyCard.tsx — `description` `whitespace-pre-line`
- [ ] T582 [US2] [P] 이미지 카드 in src/features/notice/components/detail/NoticeImageCard.tsx — `imageList` 썸네일 + 🔴 **onError 폴백**(`patterns.md` §15, B-40). 0장이면 렌더하지 않는다(호출부가 아니라 카드가 `null` 반환 — 037 `PointLocationMapCard` 와 같은 규약)
- [ ] T583 [US2] [P] 기본정보 카드 in src/features/notice/components/detail/NoticeInfoCard.tsx — `AppDetailCard`+`AppDetailRow`: 작성자 · 작성일시(`yyyy-MM-dd HH:mm`) · 고정 여부 · 첨부(이미지 n · 파일 m)
- [ ] T584 [US2] [P] 첨부파일 카드 in src/features/notice/components/detail/NoticeFileCard.tsx — `fileList` 파일명 + 확장자, `attachPath` 새 탭 링크. 0건이면 렌더하지 않는다. ⚠️ 링크는 B-40 으로 지금은 404 — 폴백 대상이 아니다(다운로드는 브라우저가 처리)
- [ ] T585 [US2] 🔴 **상세 페이지 재작성** in src/pages/service/notice/NoticeDetailPage.tsx — 037 골격: 브레드크럼(`공지사항 > 공지 상세`) → 머리 줄(제목 + `고정` 뱃지 + 수정 `AppDialog`·삭제 `AppAlertDialog`) → `lg:grid-cols-3 items-start` (좌 2/3: 본문 → 이미지 / 우 1/3: 기본정보 → 첨부파일). 분기 4종: 🔴 **주소 오류를 로딩보다 먼저**(037 T557 결함) → 로딩 → 조회 실패(다시 시도 + 목록으로) → 정상
- [ ] T586 [US2] [P] 화면 테스트 in src/pages/service/notice/__tests__/NoticeDetailPage.test.tsx — 🔴 기존 테스트 **대체**(mock id 문자열 기준이라 성립하지 않는다). 정상 렌더 · 이미지/파일 없을 때 카드 없음 · 이미지 onError 폴백 · `/notice/abc` 즉시 오류 · 조회 실패 분기

## Phase 5: US3 — 작성·수정·삭제 (mock 유지, 입력 타입만)

> **독립 테스트 기준**: 수정 모달이 `NoticeDetail` 의 제목·본문을 기본값으로 채우고, 작성
> 모달은 빈 값 + 앱 푸시 체크 기본 on 이다.

- [ ] T587 [US3] 폼 입력 타입 전환 in src/features/notice/form/NoticeForm.tsx — prop 을 `notice?: Pick<NoticeDetail, 'title' | 'description'>` 로. `sendAppPush` 기본값은 **항상 `true`**(구 `appPushSent` 는 서버에 없다). 🔴 **스키마 필드명(`content`)은 바꾸지 않는다** — 요청 DTO 는 변경계 전환 spec 에서 swagger 기준으로 맞춘다(지금 바꾸면 그때 또 바꾼다). 제출은 콘솔 스텁 유지
- [ ] T588 [US3] [P] 폼 테스트 갱신 in src/features/notice/form/__tests__/NoticeForm.test.tsx — 기본값 출처만 바뀐다. 🔴 검증 규칙 테스트는 **고치지 않고 통과해야** 한다

## Phase 6: Polish

- [ ] T589 🔴 **삭제** in src/features/notice/components/NoticeList.tsx · src/features/notice/components/NoticeListItem.tsx · src/features/notice/components/NoticeDetailView.tsx · src/features/notice/mocks/noticeData.ts — 그리고 `types/notice.ts` 의 구 타입 3종. grep 으로 소비처 **0건** 확인 후
- [ ] T590 OQ-026-A·B·C 실측 in docs/api-spec.md — `npm run dev:real` 에서 GET 만: 키워드가 제목/작성자/본문 중 무엇을 거르는지 · 고정 공지가 위로 오는지 · 기간이 `createDt` 기준인지. 결과로 placeholder·MSW 가정을 교정한다
- [ ] T591 `npm run verify` 0 + `npm run test` green(1051 → 증가). 🔴 **병렬 실행**(`CLAUDE.md` A4)
- [ ] T592 🔴 **사용자 브라우저 확인**(`npm run dev:real`) — 목록 검색·기간·페이지 · 상세 진입 · 이미지 폴백 · 작성/수정/삭제 모달 · 좁은 폭 카드
- [ ] T593 `npm run capture` — `현장/notice--목록`·`notice--상세` 교체. 🔴 **나머지는 덮지 않는다**(바뀌었으면 원인을 눈으로 가린다)
- [ ] T594 문서 동기화 — docs/screens.md(§1-5 행 · 015 결정 블록 · §4 라우트 · `:277` 목업 항목) · docs/patterns.md(§1 공지 예외 문구) · docs/flow.md(공지 흐름 "상세 패널" → 상세 페이지) · docs/data-model.md(§3-5 공지 타입 · 조회 엔드포인트 표) · docs/roadmap.md(026 행 · §12)
- [ ] T595 DoD 20개 대조표 + `## 다음 spec으로 이월` in specs/phase3/026-notice/tasks.md — 변경계 전환(작성·수정·삭제·첨부 업로드·OQ-12) · OQ 잔여

---

## Dependencies & Execution Order

- **T568 → 나머지 전부** (타입이 먼저)
- **T569·T570·T571** 은 T568 뒤 병렬. **T572** 는 T569 뒤
- **T573 → T578 · T585** (훅이 화면보다 먼저)
- **T574 → T580 · T586** (화면 테스트는 MSW 위에서 돈다)
- **T575 → T578 · T585** 🔴 목록의 행 클릭이 경로를 만들려면 `paths` 가 먼저다(037 T550 선례)
- **T576·T577 → T578 → T579 → T580**
- **T581~T584 → T585 → T586**
- **T587 은 T585 와 함께** — 상세의 수정 모달이 `NoticeDetail` 을 넘긴다
- **T589 는 Phase 3~5 뒤** 🔴 삭제는 전환 후(037 T537·T549 와 같다)
- **T590 은 T591 앞** — 실측으로 placeholder·MSW 가 바뀌면 테스트가 함께 바뀐다
- Phase 3(US1)과 Phase 4(US2)는 T573~T575 이후 **독립 진행 가능**. Phase 6 은 모든 US 뒤
