# 026-notice spec

> 위험도: **B** (`screens.md` §1-5 공지사항 행의 B 를 그대로 따른다)
> 관련 화면: 공지사항 목록 `/notice` + 공지 상세 `/notice/:noticeSeq`
> Phase: `roadmap.md` Phase 3 표의 `026`(☐) — 공지사항으로 예약된 번호를 쓴다(사용자 결정 2026-10-20)
> 목업: **없음.** `docs/ui-mock/현장/공지사항/목록.png` 는 리디자인 **이전** 판(우측 패널형)이라
> 구조 근거로 쓰지 않는다. 기준은 **기존 리디자인 화면과의 통일**이다(아래 §1).

> **WF-1-0 — 해당 없음.** 이 spec 은 **조회계만 서버 전환**한다(사용자 결정 2026-10-20).
> 작성·수정·삭제(`AddNotice`·`UpsertNotice`·`DeleteNotice`)는 **모달 UI 와 mock 동작을 그대로
> 둔다** — 첨부 업로드(multipart)와 OQ-12(`attachList` ↔ `imageList`/`fileList` 분리 기준)를
> 함께 풀어야 해서 범위가 커진다. 변경계 전환 spec 에서 WF-1-0 을 수행한다.

---

## 0. Carry-over

### 직전 spec(`037-point-history`) `## 다음 spec으로 이월` 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| ① US4 `historySeq` 회신 대기 | **범위 외** — 이력 화면 전용. 037 이월 그대로 유지 |
| ② Export | **범위 외** — 이력 2화면 공용 액션. 공지에는 수요 없음 |
| ③ OQ-037-F leaflet 셸 3벌 | **범위 외** — 공지에 지도 없음 |
| ④ baseline 흔들림 | ✅ **해소됨**(`fc58e61` 캡쳐 설비 결정화). 본 spec 캡쳐는 고정된 설비 위에서 찍는다 |
| ⑤ B-40 첨부 404 | 🔴 **본 spec 에 걸린다** — 공지 첨부(`notices/202607/`, `attachSeq 17`)도 404 다. 이미지는 **onError 폴백**(`patterns.md` §15, 036 선례)으로 그린다 |
| ⑥ 실측 못 한 것(메모 2건 이상·OQ-037-B·C) | **범위 외** — 이력 화면 전용 |

### 리디자인(`015-notice`)이 남긴 것

- `screens.md` §1-5 "리스트형 목록(테이블 아님) + 별도 상세 페이지" — 🔴 **본 spec 이 뒤집는다.**
  목록은 **테이블**로, 상세는 별도 페이지를 유지하되 다른 상세 화면 골격으로 바꾼다.
- `screens.md:277` "공지사항 리디자인 목업 — 아직 없음" — **본 spec 이 목업 없이 진행한다**(통일이 기준).

---

## User Stories

- **US1.** 현장관리자가 `/notice` 에서 공지를 **테이블**로 보고, 기간·키워드로 좁히고, 페이지를
  넘긴다. 필터·페이지는 URL 에 남아 새로고침·뒤로가기에도 유지된다.
- **US2.** 현장관리자가 행을 눌러 `/notice/:noticeSeq` 에서 공지 1건의 본문·이미지·첨부파일·
  기본정보를 **다른 상세 화면과 같은 골격**으로 본다.
- **US3.** 현장관리자가 목록에서 공지를 작성하고, 상세에서 수정·삭제한다 — **UI 와 흐름만**
  유지하고 저장은 mock 이다(서버 전환은 별도 spec).

---

## 1. 목적

공지사항은 리디자인(015) 때 목업이 없어 **리스트형 목록 + 카드 한 장 상세**로 만들어졌고,
그 뒤 순찰이력(036·037)·코스/지점 관리(023·027·029)가 **테이블 목록 + 필터 바 + 2열 상세**로
자리 잡으면서 공지만 다른 화면처럼 읽힌다. 본 spec 은 공지를 **같은 골격으로 맞추고**, 그
김에 mock 이던 조회를 **서버 응답 위로** 옮긴다(UI 를 mock 타입 위에 다시 만들면 서버 전환 때
한 번 더 뜯는다 — 037 이 지점 이력에서 한 것과 같은 판단).

---

## 2. I/O

### 2-1. 목록 `/notice`

**요청** — `GET /api/v1/Notice/W/sign/GetNoticeList`

| 서버 파라미터 | URL 키 | 출처 |
|---|---|---|
| `siteSeq` | — (URL 에 두지 않는다, `spec 021` DoD #13) | `getSiteSeq()` |
| `fromDt` / `toDt` | `from` / `to` | `AppDatePicker` 기간 |
| `keyword` | `q` | 검색창(디바운스) |
| `pageNumber` | `page` | `AppPagination` (1-based) |
| `pageSize` | — (로컬 state, 027·036·037 승계) | 20 / 50 / 100 |

**응답** — `ApiListResponse<NoticeRow>` (`api-spec.md` §23, 실측 전량 선언)

```ts
interface NoticeRow {
  noticeSeq: number
  title: string
  description: string   // 목록인데 본문 전문(B-8) — 화면에 쓰지 않는다
  userSeq: number
  userName: string
  isPin: boolean
  createDt: string
  attachCount: number
}
```

**화면**
- `AppPageHeader`(제목 "공지사항" + 액션 "공지 작성") → 필터 줄 → `AppTable` → `AppPagination`.
- 필터 줄: **검색창(앞) + 기간 + 초기화 아이콘**. 037 `PatrolPointsPage` 와 같은 배치·규약
  (`role="group" aria-label="목록 필터"`, 필터 변경 시 첫 페이지, 히스토리 쌓기, "전체" = 키 삭제).
- 컬럼(초안): **고정**(`isPin` 핀 아이콘) · **제목**(+ `attachCount > 0` 이면 클립 아이콘) ·
  **작성자**(`userName`) · **작성일**(`createDt` → `yyyy-MM-dd`).
- `xl` 미만은 `renderCard`(030 규약) — `NoticeCard` 신설.
- 상태 분기 4종: 조회 실패(다시 시도) / 로딩 스켈레톤 / 0건(필터 유무로 문구 구분) / 목록.
- 행 클릭 → `/notice/:noticeSeq`.

### 2-2. 상세 `/notice/:noticeSeq`

**요청** — `GET /api/v1/Notice/W/sign/DetailNotice?noticeSeq=`

**응답** — `ApiDetailResponse<NoticeDetail>` (`api-spec.md` §24)

```ts
interface NoticeDetail {
  noticeSeq: number
  title: string
  description: string
  userSeq: number
  userName: string
  isPin: boolean
  createDt: string
  imageList: NoticeAttach[]
  fileList: NoticeAttach[]
}
interface NoticeAttach {
  attachSeq: number
  attachPath: string    // 절대 URL — 현재 404(B-40)
  attachName: string
  attachExt: string
}
```

**화면** — 037 `PatrolPointDetailPage`·027 `PointDetailPage` 골격
- 브레드크럼 `공지사항 > 공지 상세`.
- 머리 줄: 제목 + `고정` 뱃지(`isPin`) + 액션(**수정** 모달 / **삭제** 확인 모달).
- **2열**(`lg:grid-cols-3`, `items-start`):
  - 좌(2/3): **본문 카드**(`whitespace-pre-line`) → **이미지 카드**(`imageList` 가 있을 때만, onError 폴백)
  - 우(1/3): **기본정보 카드**(`AppDetailCard` — 작성자 · 작성일시 · 고정 여부 · 첨부 수) →
    **첨부파일 카드**(`fileList` 가 있을 때만, 파일명 + 확장자, 링크)
- 분기 4종(037 승계): **주소 오류**(숫자 아님 → 요청 안 함, 로딩보다 먼저 분기) / 로딩 / 조회 실패
  (다시 시도 + 목록으로) / 정상.

### 2-3. 작성·수정·삭제 (mock 유지)

- `NoticeForm` 은 **입력 타입만** 서버 이름으로 맞춘다 — 수정 시 기본값을 `NoticeDetail` 의
  `title`·`description` 에서 채운다. 제출은 지금처럼 **콘솔 출력 스텁**.
- 삭제 확인 → 목록으로 이동(지금 동작 유지). 실제 삭제 없음.

---

## 3. 제약

### 기술 제약

- 재사용: `AppTable`(`hidePagination` + `renderCard`) · `AppPagination` · `AppInput variant="search"` ·
  `AppDatePicker` · `AppIconButton` · `AppEmpty` · `AppDetailCard` · `AppBadge` · `AppDialog` ·
  `AppAlertDialog` · `useQueryParams` · `useDebouncedCallback` · `getSiteSeq` · `toDateQuery` ·
  `toPageIndex`/`toPageNumber`.
- 신설 위치: `features/notice/{api,hooks,lib,types,components}` + `queryKeys.ts` — 기존 도메인
  (`features/points`·`course-history`) 구조를 따른다.
- **MSW 핸들러 신설**: `src/mocks/handlers/notices.ts`(목록·상세). 기존 `noticeData.ts` 시드를
  서버 형태로 옮겨 쓴다.
- 라우트 파라미터 `:id`(문자열) → **`:noticeSeq`(숫자)**. `paths.service.noticeDetail(noticeSeq: number)`.

### 비즈니스 규칙 / 결정

- 🔴 **서버에 없는 필드는 화면에서 뺀다**(CLAUDE.md B4 "서버 응답이 메인"):
  `readByMe`·`isNew`(읽음/신규) · `appPushSent`(앱 푸시 발송 뱃지) · `index`(# 번호) ·
  `contentPreview`. 읽음은 근무자(APP) 개념이라 WEB 관리 화면에 필요 없고, 푸시는 **작성 시점의
  옵션**이라 조회 응답에 없다. → 백엔드 요청 없음.
- 🔴 **목록 `description` 은 쓰지 않는다** — 본문 미리보기 컬럼을 두지 않는다(B-8 은 백엔드 결함으로 남긴다).
- 🔴 **이미지는 폴백을 전제로 만든다**(B-40) — 지금은 전부 404 라 폴백만 보인다.
- 내보내기 없음(엔드포인트 없음).

---

## 4. 엣지 케이스

공통 규칙 따름(B급). 상태 분기는 §2 에 적은 4종이 전부다.

---

## 5. 완료 조건 (DoD)

**목록 (US1)**
- [ ] 1. `/notice` 가 `GetNoticeList` 응답으로 `AppTable` 을 그린다 — mock 배열 import 0건
- [ ] 2. 컬럼 4종(고정·제목·작성자·작성일), 첨부가 있는 행은 제목 옆 아이콘
- [ ] 3. 필터 줄이 037 지점 이력과 같은 배치(검색 → 기간 → 초기화 아이콘)
- [ ] 4. `q`·`from`·`to`·`page` 가 URL 에 있고 서버 파라미터로 나간다. 필터 변경 시 첫 페이지
- [ ] 5. `siteSeq` 는 URL 에 없다
- [ ] 6. 상태 분기 4종(실패·로딩·0건 2문구·목록)이 테스트로 확인된다
- [ ] 7. `xl` 미만에서 카드(`NoticeCard`)로 바뀐다
- [ ] 8. 행 클릭 → `/notice/:noticeSeq`

**상세 (US2)**
- [ ] 9. `/notice/:noticeSeq` 가 `DetailNotice` 응답으로 그려진다
- [ ] 10. 브레드크럼 + 머리 줄(제목·고정 뱃지·수정·삭제) + 2열 골격
- [ ] 11. 이미지·첨부 카드는 목록이 비면 **카드 자체가 없다**
- [ ] 12. 이미지 `onError` 폴백이 동작한다(B-40)
- [ ] 13. 주소 오류(숫자 아님)는 요청 없이 즉시 오류 화면 — 스켈레톤이 남지 않는다
- [ ] 14. 조회 실패 시 다시 시도 + 목록으로

**작성·수정·삭제 (US3)**
- [ ] 15. 작성 모달(목록) · 수정 모달(상세, `NoticeDetail` 기본값) · 삭제 확인(→ 목록) 흐름이 유지된다

**정리**
- [ ] 16. 구 타입(`Notice`·`NoticeSummary`·`NoticeAttachment`)과 구 컴포넌트(`NoticeList`·
      `NoticeListItem`·`NoticeDetailView`)·`noticeData.ts` 가 소비처 0건이 되어 삭제됐다
- [ ] 17. `npm run verify` + `npm run test` green
- [ ] 18. 브라우저 확인 + 캡쳐 baseline(`notice--목록`·`notice--상세`) 갱신
- [ ] 19. 문서 동기화 — `screens.md`(§1-5 행·결정 블록·§4 라우트) · `patterns.md`(§1 공지 예외 문구) ·
      `flow.md`(공지 흐름) · `data-model.md`(§3-5 공지 타입) · `roadmap.md`(026 행·§12)
- [ ] 20. `## 다음 spec으로 이월` — 변경계 전환(작성·수정·삭제·첨부) · OQ 잔여

---

## Open Questions

- **OQ-026-A `keyword` 검색 대상** — 제목만인지, 작성자·본문까지인지 **미실측**. GET 이라 WF-3
  에서 `dev:real` 로 확인하고 placeholder 를 맞춘다(그 전까지 "제목 검색" 가정).
- **OQ-026-B 고정(`isPin`) 정렬** — 서버가 고정 공지를 **위로 올려 주는지** 미확인. 올려 주지
  않으면 프론트에서 재정렬하지 **않는다**(서버 페이징이라 현재 페이지 안에서만 올라간다) — 확인 후 판단.
- **OQ-026-C 기간 필터 기준** — `fromDt`/`toDt` 가 `createDt` 기준인지 확인(같이 실측).

---

## 참고

- 응답 실측: `api-spec.md` §23·24 · B-8 · B-40 · OQ-12
- 골격 참조: `pages/service/patrol/points/PatrolPointsPage.tsx` · `PatrolPointDetailPage.tsx`
- 패턴: `patterns.md` §14(반응형 카드) · §15(이미지 onError 폴백)
