# 044-admin-sites tasks

> 입력: 같은 폴더 `spec.md`. 위험도 **A** — 검증 · 제출 · 에러를 나눠 잘게.
> 태스크 ID 는 043 다음부터(T778~). `[P]` = 병렬 가능 · `[US?]` = spec User Story.
> ✅ **plan-first 결정(사용자 2026-10-23)**: ① `GetGroupList` 조회 함수·타입은 **`features/groups`** 에 둔다(045 도 쓴다) ② 좌측 패널은 **`AdminSiteSelect` 그대로**(바꾸지 않고 진행) ③ 사업장 MSW 는 043 그룹 저장소와 **한 출처로 묶는다** ④ 탭 · 토글 · 표 등은 **전부 기존 컴포넌트**로(새 공용 컴포넌트 없음).

---

## Phase 1: 기반 — 타입 · API · 순수 함수 · 훅 · MSW

> **독립 테스트 기준**: `lib` 단위 테스트 green · MSW 로 목록·상세·변경 3종 응답이 실측 모양 그대로 온다(문자열 (D) · 409 · 연쇄 삭제 포함).

- [x] T778 타입 in src/features/sites/types/site.ts — `SiteDetail`(재시도·시각 `null` 허용) · `ExceptionTime` · `AddSiteRequest` · `UpdateSiteRequest`(전부 선택 + `siteSeq`) · `UpdateExceptionTime`(`detailSeq` 0 = 새 행) — `api-spec.md` §5-2 그대로 전량
- [x] T779 [P] `GetGroupList` 조회 · 타입 in src/features/groups/api/getGroupList.ts · types/group.ts(`GroupListNode` · `GroupListSite`) — 파라미터 없음 · 루트 1개 객체
- [x] T780 [P] 사업장 API in src/features/sites/api/ — `getSiteDetail`(`?siteSeq`) · `addSite`(POST) · `updateSite`(PUT) · `deleteSite`(DELETE `?siteSeq`). 주석에 실측 규칙(ID 미반환 · 부분 갱신 · `""` 지우기 · 예외시간 통째 교체)
- [x] T781 [P] 🔴 목록 순수 함수 in src/features/sites/lib/siteList.ts — 선택 그룹 + 자손 그룹 사업장 모으기(응답 순서) · **하위 사업장 평탄화(깊이 표기)** · 검색(이름·주소, 하위만 맞으면 **모 사업장 동반**) · `siteSeq` 로 노드·소속 그룹 찾기 · 그룹 경로(`본부 › 지사`) · 지사(`layer 2`) 선택지 목록. 🔴 단계는 `layer` 로만(B-55 `depth` 불일치)
- [x] T782 [P] 헬스체크 순수 함수 in src/features/sites/lib/healthCheck.ts — "값이 비었나"(`Interval` 0 또는 시각 `null`) · `HH:mm:ss` ↔ `HH:mm` · 예외시간 폼 행 → 요청(기존 `detailSeq` 유지 · 새 행 0)
- [x] T783 쿼리 키 · 훅 in src/features/sites/queryKeys.ts · hooks/useSiteDetail.ts · hooks/useSiteMutations.ts + 목록 훅은 src/features/groups/hooks/useGroupList.ts(조회 함수와 같은 곳 — 사용자 승인 2026-10-23) — 목록·상세 쿼리 · 변경 훅(추가 · 정보 수정 · 헬스체크 저장 · 토글 · 삭제). 🔴 성공 시 **목록 · 상세 · 좌측 트리(`groupKeys.tree`) 모두 무효화** · 실패 토스트는 전역(043 규약)
- [x] T784 043 무효화 확장 in src/features/groups/hooks/useGroupMutations.ts — 그룹 변경 성공 시 `GetGroupList` 키도 무효화(연쇄 삭제 B-51 이 목록에 반영돼야 한다)
- [x] T785 🔴 **상태 보유 MSW** in src/mocks/handlers/groups.ts(043 저장소 확장 — 한 출처) — `GetGroupList`(실측 모양 · `healthCheckYn` 항상 `false` · 그룹 `count` · 사업장 `count`) · `GetSiteDetail`(없으면 400 "잘못된 요청입니다." `data: null`) · `AddSite`(빈 이름 ProblemDetails · 없는 그룹 400 · 409 · 부모 규칙 · **`exceptionTime` 버림**) · `UpdateSite`(생략·`null` 유지 · `""` 지움 · 예외 교체 규칙 · 없는 `detailSeq` 400 · 하위 사업장 그룹 변경 400 · 그룹 이동 시 하위 동반 · 409) · 헬스체크 검증(필수 누락 = **(D) 문자열** · 0 이하 래퍼 · 시작=종료 래퍼) · `DeleteSite`(하위 연쇄 · 없음 400) · 043 그룹 연쇄 삭제가 사업장에도 반영 · reset(`groupHandlers` 에 합쳐 등록 변경 없음). ⚠️ 핸들러 전용 테스트는 두지 않았다 — Phase 3~6 화면 테스트가 검증한다
- [x] T786 [P] 테스트 in src/features/sites/lib/__tests__/siteList.test.ts · healthCheck.test.ts — 범위 · 평탄화 · 모 사업장 동반 검색 · 경로 · 지사 선택지 · 빈 값 판정 · 예외시간 바디

## Phase 2: US5 — 에러 형태 (D)

> **독립 테스트 기준**: 400 + body `"간격은 필수입니다."` → `ApiError.message` 가 그 문구 · body `""` → 기존대로 `empty`.

- [x] T787 [US5] 문자열 분기 in src/lib/api/normalizeError.ts — `kind: 'text'` 추가 · 순서 빈 body → 래퍼 → ProblemDetails → **비지 않은 문자열** → unknown · 머리 주석 "3가지" → 4가지
- [x] T788 [US5] [P] 테스트 in src/lib/api/__tests__/normalizeError.test.ts — 문자열 → 문구 · 빈 문자열은 `empty` · 공백만 문자열 처리(plan-first 에서 정한 대로)

## Phase 3: US1 — 사업장 목록

> **독립 테스트 기준**: MSW 로 `/admin/locations?group=3` → 강동지사 사업장 + 하위 들여쓰기 · `?q=` 검색 · 행 클릭 → 상세 경로.

- [x] T789 [US1] 목록 열 in src/features/sites/components/SiteColumns.tsx(표는 기존 `AppTable` — 파일명 변경, 사용자 승인 2026-10-23) — 열 4개(담당 관리자 `—` — 🔄 2026-10-23 재결정으로 코스·지점 · 운영 상태 열 제거) · XL 미만 주소 보조 줄 · 하위 사업장 `└` 들여쓰기 · 행 클릭 · "총 N개" · 빈 상태 2종 · 로딩 스켈레톤 · 실패 + 다시 시도
- [x] T790 [US1] 필터 줄 — 🔴 별도 파일 없이 LocationsPage.tsx 안에(`UsersPage` 패턴, 사용자 승인 2026-10-23) — 검색(`?q=`, 이름·주소, 300ms 디바운스) · ~~운영 상태 필터~~(🔄 재결정 2026-10-23 — 제거)
- [x] T791 [US1] 페이지 in src/pages/admin/locations/LocationsPage.tsx — 빈 본문 → 필터 줄 + 표 · 부제 "{그룹명} 하위 사업장 N개" · [사업장 추가] 는 T795 에서
- [x] T792 [US1] [P] 테스트 in src/pages/admin/locations/__tests__/LocationsPage.test.tsx — 그룹 범위 · 하위 들여쓰기 · 검색 · 담당 관리자 `—` · 없는 열 · 빈 상태 · 행 클릭 이동

## Phase 4: US2 — 사업장 추가

> **독립 테스트 기준**: MSW 로 추가 → 바디에 헬스체크·`exceptionTime`·`parentSiteSeq` 없음 · 목록에 새 행 · 409 면 모달 유지.

- [x] T793 [US2] 폼 스키마 in src/features/sites/form/schema.ts(기존 `form/schema.ts` 관례) — 이름(trim · 필수) · 소속 그룹(필수) · 주소(trim · 필수) · 연락처(선택)
- [x] T794 [US2] 폼 in src/features/sites/form/SiteForm.tsx — 추가/수정 겸용 · 🔴 **필드·검증만, 제출은 호출부**(`useAddSite`/`useUpdateSiteInfo` — 사용자 승인 2026-10-23) · 모달은 호출부 `AppDialog`(520px) · 소속 그룹 `AppSelect`(**지사만**, `본부 › 지사` 표기) · 계약 기간 칸 없음(재결정) · 지사 0개 안내 + [등록] disabled · 처리 중 비활성
- [x] T795 [US2] 추가 제출 in src/pages/admin/locations/LocationsPage.tsx — 기본 그룹 = 현재 `?group` 이 지사면 그것 · 바디 `{ groupSeq, siteName, address, tel? }`(빈 연락처 생략) · 성공 토스트 + 닫기 · 409 모달 유지
- [x] T796 [US2] [P] 테스트 in src/features/sites/form/__tests__/SiteForm.test.tsx(폼 단위) + LocationsPage.test.tsx(MSW 바디 · 새 행 · 409) — 지사만 선택지 · 기본값 · 필수 검증 · 추가 바디 · 409 유지

## Phase 5: US3 — 상세 · 정보 수정 · 삭제

> **독립 테스트 기준**: MSW 로 `/admin/locations/3` → 기본정보 카드 · 담당 관리자 카드 · 수정 바디(`tel: ""`) · 삭제 문구 · 없는 사업장 = 찾을 수 없음(로딩 중에는 아님).

- [x] T797 [US3] 라우트 in src/router/index.tsx — `pathPatterns.adminLocationDetail` → 상세 페이지(Admin 3종)
- [x] T798 [US3] 상세 페이지 골격 in src/pages/admin/locations/LocationDetailPage.tsx — 뒤로(`?group` 보존) · 이름 · 부제 그룹 경로 · 🔄 좌우 구조(재결정 2026-10-23 — 탭 · KPI형 요약 제거, 액션은 기본정보 카드 아래) · 🔴 로딩 / 찾을 수 없음(숫자 아님 · 400) 구분
- [x] T799 [US3] 기본정보 카드 in src/features/sites/components/SiteInfoCard.tsx(🔄 `SiteSummary` 대체) — 소속 그룹 · 주소 · 연락처 · 코스·지점 · 하위 사업장(있을 때) · 목록 노드 없으면 그룹 `—`
- [x] T800 [US3] 담당 관리자 카드 in src/features/sites/components/SiteManagersCard.tsx(🔄 탭 → 카드) + 훅 src/features/groups/hooks/useGroupAdminList.ts(`groupKeys.admins`) — 🔴 사업장 단위는 서버에 없어(B-58) **소속 지사 그룹 할당**으로 채운다(사용자 승인 2026-10-23) · `GetGroupAdminList`(소속 그룹) `isInclude` 행 · 이름 · 권한 · [관리자 지정] **disabled** + 툴팁 · 빈 상태
- [x] T801 [US3] 🔴 정보 수정 in src/features/sites/form/SiteForm.tsx(수정 모드) + LocationDetailPage.tsx — 초기값(상세 + 목록 노드의 그룹) · **연락처 지우면 `tel: ""`** · 하위 사업장이면 그룹 disabled + 도움말 · 하위 있으면 "하위 N개도 함께 이동" · 지사 아닌 현재 그룹을 선택지에 유지 · 400 "사업장이 존재하지 않습니다." → 목록으로
- [x] T802 [US3] 🔴 삭제 확인 in src/features/sites/components/SiteDeleteDialog.tsx — `AppAlertDialog` · 하위·코스·지점·근무자 수 문구(0 생략 · "영향이 있습니다") · 성공 → 토스트 + 목록(`?group` 보존)
- [x] T803 [US3] [P] 테스트 in src/pages/admin/locations/__tests__/LocationDetailPage.test.tsx — 기본정보 · 담당 관리자 · 수정 바디 3종(`tel: ""` · 하위 그룹 disabled · 비지사 유지) · 삭제 문구 · 없는 사업장 · 로딩 중 빈 상태 안 뜸

## Phase 6: US4 — 헬스체크 · 비상연락망 카드(상세 우측)

> **독립 테스트 기준**: MSW 로 값 없는 사업장 토글 ON → 모달 · 저장 바디(시각 `HH:mm:00` · 예외 `detailSeq` 유지/0) · OFF 는 `healthCheckYn` 만 · (D) 문구 토스트.

- [x] T804 [US4] 헬스체크 카드 in src/features/sites/components/HealthCheckCard.tsx — 🔄 토글 · [수정] 은 설명 줄 오른쪽(`AppDetailCard` 머리에 액션 없음 — 사용자 승인 2026-10-23) · 토글(`ui/switch`) · [수정](미사용 disabled) · 5칸(사용 시간 · 예외 여러 줄/없음 · 주기 · 타임아웃(단위 없음, OQ-044-B) · 반복) · 미사용 흐림
- [x] T805 [US4] 🔴 토글 동작 in HealthCheckCard.tsx — 값 비었으면 OFF→ON = 모달(취소 시 OFF 유지) · 값 있으면 `{ siteSeq, healthCheckYn: true }` · ON→OFF `{ healthCheckYn: false }` · 처리 중 비활성 · 비옵티미스틱
- [x] T806 [US4] 폼 스키마 in src/features/sites/form/healthCheckSchema.ts — 시각 필수 · 시작≠종료 · 주기·타임아웃 ≥1 정수 · 반복 ≥0 정수 · 예외 행 시작≠종료
- [x] T807 [US4] 설정 폼 in src/features/sites/form/HealthCheckForm.tsx(필드·검증만, 모달 500px 은 카드의 `AppDialog` — `SiteForm` 규약) · `<input type="time">` · 예외 행 추가/삭제(`useFieldArray`) · 저장 바디(`healthCheckYn: true` + 5개 + 예외 전체) · 실패 시 모달 유지
- [x] T808 [US4] 비상연락망 자리 in src/features/sites/components/EmergencyContactCard.tsx — 🔄 **간단한 자리 카드**(제목 · 설명 · 안내 "비상연락망은 아직 지원되지 않습니다") — 요일 7행 · 담당자 풀은 API(B-57)가 생기면 그 구조로(사용자 승인 2026-10-23, 결과 보고 조정)
- [x] T809 [US4] 조립 in LocationDetailPage.tsx — 우측 담당 관리자 카드 아래에 헬스체크 카드(Phase 5 자리 교체) + 비상연락망 카드
- [x] T810 [US4] [P] 테스트 in src/features/sites/components/__tests__/HealthCheckCard.test.tsx · (폼 검증 포함 — 별도 파일 없음) — 토글 3경로 · 검증 · 예외 바디(기존 유지 · 새 0 · 전부 삭제 `[]`) · (D) 문구 토스트

## Phase 7: 검증 · 문서

- [ ] T811 `npm run verify` + `npm run test` 병렬 green
- [ ] T812 브라우저 확인 — mock(1280 이상·미만) + 🔴 dev:real(본사 계정 · `테스트그룹` 아래 임시 지사 → 추가 → 수정(연락처 지우기) → 헬스체크 켜기 + 예외 2개 → 예외 1개 삭제 → 끄기 → 삭제 → 끝에 임시 지사 삭제 · 트리 원상 확인)
- [ ] T813 [P] 문서 — `CLAUDE.md` B4(에러 4종) · `screens.md` §2-2(진행도 · 삭제 비밀번호 없음) · `flow.md` §2 · `data-model.md`(사업장 부분 서버 기준) · `components.md`(신설 공용이 있으면) · `roadmap.md` §7-1 · §9-0
- [ ] T814 DoD 점검 + `## 다음 spec으로 이월`

---

## Dependencies & Execution Order

- **Phase 1 → 나머지 전부.** T778 → T779 · T780 · T781 · T782(병렬) → T783 → T784. T785 는 T778 뒤 언제든(T786 · 각 Phase 테스트 선행).
- **Phase 2(US5)** 는 Phase 1 과 독립 — 언제든. 단 **T810 의 (D) 토스트 테스트는 T787 뒤**.
- Phase 3(US1) → Phase 4(US2): 추가 버튼이 목록 페이지에 있다(T795 는 T791 뒤).
- Phase 5(US3): T797 → T798 → T799 · T800(병렬) → T801(T794 의 폼 재사용) → T802.
- Phase 6(US4): T798 뒤. T804 → T805 · T806 → T807 → T809. T808 은 독립.
- `[P]` 테스트는 각 Phase 구현 뒤. Phase 7 은 전부 뒤.
