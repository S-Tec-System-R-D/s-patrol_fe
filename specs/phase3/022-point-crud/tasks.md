# 022-point-crud tasks

> 입력: [`spec.md`](./spec.md) (위험도 **A** — 잘게 분할, 검증 지점 다수)
> 응답·규칙 근거: [`docs/api-spec.md`](../../../docs/api-spec.md) §1-5 · §4 · §5-2 / 요청 DTO: `docs/swagger-api.json`
> 선행: `spec 019`(`ApiError`·unwrap) · `spec 020`(JWT) · `spec 021`(`siteSeq`)
> 태스크 ID는 021(T218~T239)에 이어 **T240**부터

---

## ⚠️ 분할 순서를 좌우한 제약 (착수 전 확인)

**네 가지가 분할 순서를 강제했다. 모두 코드 실측으로 확인했다.**

1. 🔴 **구 `PointType`·`pointData`를 지울 수 없다 — 교체가 아니라 "나란히 추가"다.** feature 밖에서 3곳이 참조한다:
   - `src/features/patrol-points/types/PatrolPoint.ts:1` → `PointAuthenticationMethod`
   - `src/features/zone/types/point.ts:1` → `ZonePointType extends PointType`
   - `src/features/zone/form/AddPointForm.tsx:11` → `points` mock 데이터
   `spec.md` 규칙 17이 `features/zone`을 범위 밖으로 뒀으므로, **구 타입·구 mock을 그대로 남기고 신규 서버 타입을 추가**한다. 제거는 `spec 023`(OQ-022-H). → T240이 "교체"가 아닌 이유.

2. 🔴 **`AuthMethodDisplay`/`AuthMethodSelector`의 prop 계약(`'QR' | 'NFC'`)을 바꾸지 않는다.** `AuthMethodDisplay.test.tsx`의 **3건**이 그 계약에 걸려 있다(`value="QR"` 직접 전달). 서버 정수(9/10)는 **호출부에서** 변환한다(규칙 5 "변환은 한 자리"). 계약을 정수로 바꾸면 테스트 3건 + 폼 2개가 함께 움직여 Phase 종료가 red다.

3. 🔴 **MSW 핸들러를 조회 전환과 같은 Phase에 넣는다**(Phase 3). `npm run dev`(mock)·`npm run capture`가 **둘 다 MSW 위에서** 돈다(`.env.capture`: `VITE_USE_MSW=true`). 핸들러 없이 `PointsPage`를 서버 쿼리로 바꾸면 그 Phase 종료 시점에 mock 모드 `/points`가 빈 화면이다.
   - 021에서 T235(MSW)를 Polish에 뒀다가 Phase 3로 **당겨야 했다.** 같은 교훈을 처음부터 반영한다. `npm run capture`는 `verify`/`test` 밖이라 빼먹으면 다음 캡쳐까지 드러나지 않는다.

4. 🔴 **zod 스키마 변경은 Phase 1이 아니라 폼 Phase(4)에 둔다.** `schema.ts`에 `useYn`을 추가하면 `FormDataType`의 필수 필드가 늘어 **두 폼의 `defaultValues`가 즉시 타입 에러**가 된다(`AddPointForm.tsx:18-23`·`EditPointForm.tsx:18-23`). Phase 1을 "신설만, typecheck green"으로 유지하려면 스키마와 폼이 같은 Phase여야 한다.

**깨질 테스트 사전 계수**

| 파일 | 건수 | 시점 | 사유 |
|---|---|---|---|
| `PointListCard.test.tsx` | **4건 전부** | Phase 3 (T260) | fixture가 `PointType`(`id`·`title`), prop이 `selected: PointType \| null` → `PointRow`·`selectedSeq: number \| null`로 |
| `AuthMethodDisplay.test.tsx` | **0건** | — | 제약 2를 지키면 무변경 |
| `CourseDiagramCard.test.tsx` | **0건** | — | `features/zone` 쪽. 범위 밖(규칙 17) |

---

## Phase 1: Setup — 타입·매핑 (신설만)

> **독립 테스트 기준**: `npm run typecheck` 통과. **기존 파일 0건 수정**, 테스트 수 변동 없음.
>
> 🔴 **Phase 1은 신설·추가만 한다.** 구 타입 제거(제약 1)와 스키마 변경(제약 4)을 여기서 건드리면 이 기준이 즉시 깨진다.

- [x] T240 [P] 실측 응답 타입 **추가** in src/features/points/types/point.ts — `PointRow`·`PointDetail`을 `api-spec.md` §5-2 실측 그대로 **전량 선언**(안 쓰는 `gpsLat`/`gpsLng`/`lastPatrolUserSeq`도 둔다, `CLAUDE.md` B4). 🔴 **구 `PointType`·`PointAuthenticationMethod`는 남긴다**(제약 1) — "023에서 제거" 주석 + 참조 3곳을 적어 둔다. 🔴 목록은 `pointName`, 상세는 `name`이다(B-4) — **이름을 맞추지 않는다**
- [x] T241 [P] 요청 DTO 타입 in src/features/points/types/request.ts — `AddPointRequest`·`UpdatePointRequest`·`PointListParams`. 접미사는 `{Action}*Request`(`CLAUDE.md` B4). swagger 실측 그대로: Add는 `authMethod`·`useYn` required, Update는 `pointSeq` required
- [x] T242 [P] `authMethod` 양방향 매핑 in src/features/points/lib/authMethod.ts — `toAuthMethodCode('QR') → 9` / `toAuthMethodLabel(9) → 'QR'`. 표시는 **서버 `authMethodName` 우선**, 공백·`'Unknown'`이면 매핑표 폴백(B-6). 🔴 **9/10 외 값에 추측 라벨을 만들지 않는다**(A1) — 원문을 그대로 보여준다. 어댑터가 정당한 유일한 자리다(B4 조건 ②, 규칙 5)

## Phase 2: Foundational (모든 US 선행 blocking)

> **독립 테스트 기준**: `npm run test` green. `queryKey` 규약과 파라미터 변환이 **화면 없이** 순수함수 테스트로 고정된다.

- [x] T243 [P] 🔴 `queryKey` SSOT in src/features/points/queryKeys.ts — `pointKeys.lists` / `pointKeys.list(siteSeq, params)` / `pointKeys.detail(pointSeq)`. **`siteSeq`를 키에 반드시 포함**한다(규칙 2) — 빠지면 사업장 전환 시 이전 사업장 캐시가 보인다. ⚠️ **`spec 023~026`이 그대로 따를 컨벤션**이므로 파일 주석에 규약을 명문화한다
- [x] T244 [P] 목록 조회 in src/features/points/api/getPointList.ts — `GET /api/v1/Point/W/sign/GetPointList`. `siteSeq` **required**, `pageNumber`(1-based)·`pageSize=20` **명시 전송**(규칙 7 — 기본값 의존 금지). 반환 `PagedData<PointRow>`. 🔴 **`_raw`를 쓰지 않는다** — `code`가 필요 없다(019 경계, `userSiteSelect.ts:15` 주석 승계)
- [x] T245 [P] 상세 조회 in src/features/points/api/detailPoint.ts — `GET .../DetailPoint?pointSeq=`
- [x] T246 [P] 추가 in src/features/points/api/addPoint.ts — `POST .../AddPoint`, body `AddPointRequest`
- [x] T247 [P] 수정 in src/features/points/api/updatePoint.ts — 🔴 **`PATCH`** `.../UpdatePoint`(`PUT`이 아니다 — swagger 실측, 규칙 13). `api.patch`를 쓴다
- [x] T248 [P] 삭제 in src/features/points/api/deletePoint.ts — `DELETE .../DeletePoint?pointSeq=`. ⚠️ 파라미터명이 `pointSeq`임을 확인했다(B-12의 `DeleteCourse`만 `courseId`인 함정 — 지점은 해당 없음)
- [x] T249 URL↔서버 파라미터 변환 순수함수 in src/features/points/lib/pointListParams.ts — URL 쿼리(`search`·`authMethod`·`useYn`·`page`) → `PointListParams`. 🔴 **`pageNumber`(1-based) ↔ `pageIndex`(0-based) 변환이 여기 한 곳**(규칙 7·10). 응답 필드는 `page`, 요청은 `pageNumber`로 이름이 다르다. 018의 `lib/dateRangeQuery.ts` 선례와 같은 자리
- [x] T250 [P] vitest — 매핑·키·파라미터 in src/features/points/lib/\_\_tests\_\_/authMethod.test.ts · src/features/points/\_\_tests\_\_/queryKeys.test.ts · src/features/points/lib/\_\_tests\_\_/pointListParams.test.ts — 9/10 왕복 / 미지 코드 / `authMethodName` 공백·`'Unknown'` 폴백 / `siteSeq`가 키에 포함 / 1-based↔0-based 왕복 / `ALL_VALUE`는 파라미터에서 빠짐

## Phase 3: US1 — 목록·상세 조회 전환 (🔴 MSW 묶음 — 쪼개면 mock 모드가 빈 화면)

> **독립 테스트 기준**: `npm run dev`(mock)에서 `/points` 목록이 서버 스키마로 렌더되고, 행 선택 시 상세가 채워지고, 첫 행이 자동 선택된다. `npm run test` **전체** green(`PointListCard` 4건 복구 포함) + `npm run verify` 0 errors.
>
> 🔴 제약 3 참조 — T251·T252(MSW)를 이 Phase에서 빼면 종료 시점에 mock 모드 `/points`가 통째로 빈 화면이다.

- [x] T251 🔴 MSW Point 핸들러(조회) in src/mocks/handlers/points.ts — `GetPointList`·`DetailPoint`. 구 `features/points/mock/pointData.ts`를 **import해 서버 스키마로 변환**한다(규칙 16 / 제약 1로 구 mock이 남아 있어 가능). 🔴 **`searchKey`·`authMethod`·`useYn`·페이징을 핸들러에서 실제로 구현**한다 — 안 하면 Phase 6의 필터 검증 기준을 세울 수 없다(021 T235가 Phase 3로 당겨진 것과 같은 이유)
- [x] T252 핸들러 등록 in src/mocks/handlers/index.ts — `pointHandlers` 추가. `handlers/index.ts`의 004 주석("도메인별 핸들러는 해당 화면 spec에서 추가")을 이행하는 첫 사례이므로 주석도 갱신한다
- [x] T253 [US1] 조회 훅 in src/features/points/hooks/usePointList.ts · usePointDetail.ts — `useQuery` + T243 키. 🔴 `getSiteSeq()`가 `null`이면 `enabled: false`(규칙 6) — `siteSeq` 없이 나가면 `200` + 빈 목록이 "정상 빈 화면"으로 그려진다(`api-spec.md:211`). `pointSeq`가 `null`일 때도 동일
- [x] T254 [US1] 🔴 마스터-디테일 구조 변경 in src/pages/service/points/PointsPage.tsx — 선택 상태를 `selectedSeq: number | null`로 바꾼다(`:15`의 `PointType | null` → `pointSeq`만). 첫 행 자동 선택은 `selectedSeq ?? items[0]?.pointSeq`로 **파생**시킨다(규칙 4) — effect로 하면 "로딩 완료 → setState → 재렌더" 한 박자가 생긴다. **mock 직접 import 제거**(`:9`, DoD #1)
- [x] T255 [US1] 목록 컴포넌트 전환 in src/features/points/components/PointList.tsx · PointListCard.tsx — props를 `items: PointRow[]`·`selectedSeq: number | null`로. 이름은 `pointName`, 뱃지는 `authMethodName` 우선 + T242 폴백. 🔴 **`AuthMethodDisplay`/`AuthMethodSelector`는 건드리지 않는다**(제약 2)
- [x] T256 [US1] 목록 0건·에러 상태 in src/features/points/components/PointList.tsx — 0건은 `AppEmpty`. 🔴 **조회 실패를 빈 목록과 구분되게** 표시한다(§4) — 둘 다 "아무것도 없음"으로 보이면 장애를 데이터 없음으로 오해한다. 현재는 0건 처리가 아예 없다(`:14` 무조건 `map`)
- [x] T257 [US1] 상세 패널 바인딩 전환 in src/features/points/components/detail/PointDetail.tsx — `PointDetail` 실측 타입으로. `DEMO_BELONGING_COURSES`(`:15-18` 데모 상수) → 실제 `courseList`. 🔴 **"생성일" 행(`:35`)은 서버에 없다**(OQ-022-I) — 제거하고 `lastPatrolDt`·`lastPatrolUserName`(최근 순찰)으로 대체한다. `CLAUDE.md` B4의 "서버에 없는 필드는 바인딩 확인 → 불필요하면 제거"
- [x] T258 [US1] vitest 갱신 in src/features/points/components/\_\_tests\_\_/PointListCard.test.tsx — 🔴 사전 계수 **4건 전부** 깨진다(상단 표). fixture를 `PointRow`로, `selected` → `selectedSeq`로
- [x] T259 [US1] [P] vitest 신설 in src/pages/service/points/\_\_tests\_\_/PointsPage.test.tsx — MSW로 목록 렌더 / 첫 행 자동 선택 / 행 선택 시 상세 조회 / 0건 빈 상태 / `siteSeq` 없으면 요청이 나가지 않음

## Phase 4: US2 — 추가(POST) + 폼 정합

> **독립 테스트 기준**: mock 모드에서 추가 → 목록에 반영. NFC 14자리 HEX 오류가 **해당 필드에** 표시된다. `npm run test` green.
>
> 🔴 제약 4 — T260(스키마)과 T261(폼)은 **같은 Phase 안에서 연속**이어야 한다. 쪼개면 중간에 typecheck가 red다.

- [x] T260 zod 스키마 갱신 in src/features/points/form/schema.ts — `useYn: z.boolean()` 추가(`AddPointDto` required) + `nfcTagId` **14자리 HEX** `/^[0-9A-Fa-f]{14}$/`(규칙 11). 기존 refine("NFC인데 비어 있으면")은 유지하고 형식 검증을 더한다
- [x] T261 [US2] 추가 폼 실 전송 in src/features/points/form/AddPointForm.tsx — `useMutation(addPoint)`. 바디에 `siteSeq`(`getSiteSeq()`, 021) + `authMethod` 정수 변환(T242) + `useYn`. `gpsLat`/`gpsLng`는 **전송하지 않는다**(규칙 10, OQ-022-C). `isPending`으로 버튼 `disabled`(연타 차단)
  - 🔴 **에러 바인딩 복붙 수정** — `:46`(설명)·`:64`(NFC TAG ID)가 `errors.name?.message`를 쓰고 있다. 고치지 않으면 **T260의 HEX 검증이 화면에 뜨지 않는다**(규칙 12)
  - 🔴 **실패 토스트를 폼에서 띄우지 않는다** — `queryClient.ts:18-20`의 `MutationCache.onError`가 이미 전역으로 띄운다(규칙 3)
- [x] T262 [US2] 모달 제어형 전환 in src/features/points/components/PointTopNav.tsx — `AppDialog`가 현재 비제어다(`:11`). **성공 후에만 닫는다**(§4 — 먼저 닫으면 실패 시 입력값이 사라진다). 성공 시 `pointKeys.lists` 무효화
- [x] T263 MSW 추가 핸들러 in src/mocks/handlers/points.ts — `AddPoint`. in-memory 배열에 반영돼 **목록 재조회에 실제로 보이게** 한다(모듈 스코프 배열 + 핸들러가 수정)
- [x] T264 [US2] [P] vitest in src/features/points/form/\_\_tests\_\_/AddPointForm.test.tsx — 이름 필수 / NFC 14자리 HEX 실패가 **`nfcTagId` 필드에** 표시(T261 복붙 수정 고정) / 전송 바디에 `siteSeq`·`useYn`·정수 `authMethod` 포함 / 실패 시 모달 유지

## Phase 5: US3 + US4 — 수정(PATCH) · 삭제(DELETE)

> **독립 테스트 기준**: mock 모드에서 수정 → 목록·상세 모두 반영, 삭제 → 목록 제거 + 선택 해제, 삭제 거부 → 메시지 노출 + 목록 유지. `npm run test` green.

- [x] T265 MSW 변경계 핸들러 in src/mocks/handlers/points.ts — `UpdatePoint`(PATCH)·`DeletePoint`(DELETE). 🔴 **삭제 거부 케이스 1종**을 포함한다(`usedCount > 0` 지점). ⚠️ 실 서버 동작은 **미실측**(OQ-022-B)이므로 mock은 "거부한다" 가정으로 **UI 경로만 확보**하고, 실측 후 교정한다고 주석에 남긴다 — 추측을 코드에 굳히지 않는다(A1)
- [x] T266 [US3] 수정 폼 초기화 + 실 전송 in src/features/points/form/EditPointForm.tsx — 🔴 **`defaultValues`를 상세 값으로 채운다**(현재 빈 문자열 고정 `:18-23` — 수정 폼인데 기존 값이 안 들어온다, 규칙 12). `useMutation(updatePoint)` **PATCH**, `reissueQrYn: false` 고정(규칙 10). 🔴 **`pointSeq`는 모달이 열릴 때의 값으로 고정**한다 — 고정하지 않으면 수정 중 다른 지점을 선택했을 때 **저장이 엉뚱한 지점에 적용된다**(§4)
  - T261과 동일한 에러 바인딩 복붙(`:46`·`:64`)을 함께 고친다
- [x] T267 [US3] 수정 모달 연결 in src/features/points/components/detail/PointDetail.tsx — `EditPointForm`에 상세 데이터 전달 + 제어형 닫기. 성공 시 `pointKeys.lists`·`pointKeys.detail(pointSeq)` **둘 다** 무효화(규칙 2)
- [x] T268 [US4] 삭제 연결 in src/features/points/components/detail/PointDetail.tsx — `AppAlertDialog.onAction`이 현재 **빈 함수**다(`:75` `() => {}`). `useMutation(deletePoint)` 연결. 성공 시 **선택 해제** + `pointKeys.lists` 무효화. 🔴 **`usedCount` 기반 선제 차단을 넣지 않는다**(규칙 14 — 서버 규칙 미확인, A1)
- [x] T269 [US4] 삭제 거부 처리 in src/features/points/components/detail/PointDetail.tsx — 서버 거부 시 사유 노출 + **목록 유지**. 전역 토스트와 중복되지 않게 한다(규칙 3)
- [x] T270 [P] vitest in src/features/points/form/\_\_tests\_\_/EditPointForm.test.tsx · src/features/points/components/detail/\_\_tests\_\_/PointDetail.test.tsx — 초기값 주입 / PATCH 바디(`pointSeq`·`reissueQrYn: false`) / 모달 열린 뒤 다른 지점 선택해도 `pointSeq` 불변 / 삭제 성공 시 선택 해제 / 삭제 거부 시 목록 유지

## Phase 6: US5 — 검색·필터·페이지 이동 (전부 서버 위임) — ⚠️ **`spec 027` 로 이월 (2026-10-08)**

> 🔴 **022 에서 하지 않는다.** 사용자 결정 2026-10-08: `/points` 를 좌/우 마스터-디테일에서
> **목록 페이지 + 상세 페이지**로 재구성하기로 했고(`spec 027`), 필터·검색·페이지 이동은
> **그 새 구조 안에서** 짠다.
>
> **이유**: ① 좌측이 340px 이라 필터 2개 + 페이지 이동이 들어가면 레이아웃이 깨진다 —
> **OQ-022-E 가 이미 이 이유로 배치 확정을 미뤘다**(2026-10-07) ② 지금 짜면 재구성에서
> T271~T275 를 **두 번 짠다** ③ 분할화면 대응(`CLAUDE.md` B4)에서 마스터-디테일이 가장
> 먼저 깨진다
>
> ✅ **버려지는 지식은 없다.** Phase 8 R2 에서 **필터 3종이 서버에서 실제로 걸리는 것을
> 실측**했고(`authMethod`·`useYn`·`searchKey`), `lib/pointListParams.ts` 의 파라미터 변환과
> `queryKey` 규약은 그대로 쓰인다. 아래 태스크는 **027 에서 하위 페이즈로 재배치**한다.


> **독립 테스트 기준**: 검색어·인증수단·사용여부·페이지가 URL에 보존되고 **서버 파라미터로** 나간다. 🔴 **클라이언트 필터 함수가 0건**이다(규칙 8).

- [ ] T271 [US5] 검색 연결 + 디바운스 in src/features/points/components/PointTopNav.tsx — `AppInput variant="search"`에 `value`/`onChange`를 붙인다(현재 둘 다 없다 `:10`). **300ms 디바운스**(규칙 9) — 없으면 글자 수만큼 요청이 나간다. URL 키는 `search` ⚠️ **`spec 027` 이월**
- [ ] T272 [US5] 필터 UI in src/features/points/components/PointFilters.tsx — 인증수단·사용여부 `AppSelect` 2종. 018 패턴 승계: `ALL_VALUE`("전체"는 URL에 남기지 않음) + `setParams(..., { replace: true })` + **필터 변경 시 첫 페이지 복귀**(`PatrolZonesPage.tsx:76-80`) ⚠️ **`spec 027` 이월**
- [ ] T273 [US5] URL↔쿼리 연결 in src/pages/service/points/PointsPage.tsx — `useQueryParams<'search' | 'authMethod' | 'useYn' | 'page'>` + T249 변환. 🔴 **선택된 지점이 필터 결과에서 빠지면 상세 패널을 비운다**(§4, 018 선례 `PatrolZonesPage.tsx:85`) ⚠️ **`spec 027` 이월**
- [ ] T274 [US5] 페이지 이동 수단 in src/pages/service/points/PointsPage.tsx — ⚠️ **배치를 확정하지 않는다**(OQ-022-E, 사용자 판단 2026-10-07). 좌측 340px 구조를 유지하고 **이동 수단만** 둔다. `AppPagination` 전체 부착(행수 셀렉트+범위+이전/다음, `justify-between`)은 **하지 않는다** — 340px에 맞지 않고 필터 추가로 레이아웃이 바뀔 수 있다 ⚠️ **`spec 027` 이월** — OQ-022-E 도 함께 넘어간다
- [ ] T275 [US5] [P] vitest in src/pages/service/points/\_\_tests\_\_/PointsPage.test.tsx — 검색어 입력 → URL 반영 + 요청 파라미터 확인 / 필터 변경 시 첫 페이지 복귀 / 뒤로가기에서 필터 보존 / `ALL_VALUE`는 URL에 남지 않음 ⚠️ **`spec 027` 이월**

## Phase 7: Polish — ◩ **부분 수행 (2026-10-08)**

> T279·T280 은 수행한다(문서·DoD 는 화면 재구성과 무관하고, `queryKey` 규약은 `023~026` 이
> 따를 컨벤션이라 지금 적어 둘 가치가 있다).
> 🔴 **T277(캡쳐 재촬영)·T278(브라우저 확인)은 `spec 027` 로 이월** — 화면이 통째로 바뀌므로
> 지금 찍으면 **두 번 찍는다.** 020·021 에 이어 세 번째 같은 자리라 부담도 큰 작업이다.
> T276(로딩 상태 점검)도 새 구조에서 다시 보는 편이 낫다.


- [ ] T276 [P] 로딩 상태 점검 — 목록·상세·변경 각각. 기존 선례(`AppEmpty`·`isPending` disabled)를 따르고 **새 패턴을 만들지 않는다**(A6) ⚠️ **`spec 027` 이월** — 새 구조에서 다시 본다
- [ ] T277 🔴 `npm run capture` baseline 재촬영 in docs/ui-current/ — `현장/points--목록+상세` 1장 변경 + **나머지 11장 무변화 확인**(DoD #17, Carry-over 해소). ⚠️ 020(토큰 seed)·021(`siteSeq` seed)에 이어 **세 번째 같은 자리**다 — 핸들러·seed 누락이면 전 장이 로그인 화면이 된다. 🔴 재촬영 전 scratchpad 스크립트로 먼저 확인하고(021 T237 방식), baseline 덮어쓰기는 이상 없음을 확인한 뒤에 한다 ⚠️ **`spec 027` 이월** — 화면이 바뀌므로 두 번 찍지 않는다
- [ ] T278 브라우저 확인(MSW 모드) — 목록·상세·추가·수정·삭제·삭제거부·검색·필터·페이지 이동 + 첫 행 자동 선택. DoD #18 ⚠️ **`spec 027` 이월**. 단 **실 서버 브라우저 확인은 Phase 8 R6 에서 완료**했다
- [x] T279 [P] 문서 4종 — `roadmap.md`(§7-1 **`UpdatePoint`=PATCH 교정** + §7 `/points` 행 + §12 행 추가) / `screens.md` §1-3 진행도 / 🔴 `patterns.md` 또는 `data-model.md`에 **`queryKey` 규약 1절**(규칙 2 — 023~026이 따를 컨벤션) / `api-spec.md`(변경계 응답은 **미실측임을 명시**, 실측은 백엔드 복귀 후). DoD #19
- [x] T280 DoD 19개 대조표 작성 + 미충족 항목 사유 명시 in specs/phase3/022-point-crud/tasks.md

## Phase 8: 실 백엔드 실측 — 019~022 이월 해소 (2026-10-08 추가)

> **왜 022에 붙는가**: 항목 대부분이 022의 DoD 미충족분(변경계 응답 미실측)이고, 020·021 이월분도 같은 세션에서만 확인 가능하다. 별도 번호를 따면 `023`(순찰코스)과 어긋나고 검증 결과가 022 문서에서 떨어져 나간다. 사용자 결정 2026-10-08.
>
> **독립 테스트 기준**: 각 실측 항목이 "가정과 일치" 또는 "불일치 + 반영 완료" 중 하나로 닫힌다. 미실측으로 남는 것은 **사유와 함께** 이월 블록에 남는다.
>
> 🔴 **선행 조건 2개.** ① **테스트 계정**(현장관리자 `333333` 계열 + 본사 `000000` 계열) — 없으면 R1 이후 전부 막힌다 ② 사내망 연결(2026-10-08 확인: swagger 200)
>
> 🔴 **쓰기 범위는 "생성한 지점만"으로 합의했다**(사용자 결정 2026-10-08). 기존 지점은 조회만 한다. 그 결과 **OQ-022-B(`usedCount > 0` 삭제 거부)는 확인할 수 없고 판단 3건 중 3번은 보류**된다 — 새로 만든 지점은 코스에 편성돼 있지 않다.

### R0 — 토큰 없이 확인 가능한 것 (✅ 2026-10-08 완료)

- [x] T281 에러 3종 형태 실측 — `019`의 핵심 가정. **세 형태 전부 일치**
  - (A) `ApiResponse` 래퍼: 로그인 실패 → HTTP **400** + `{"message":"아이디 또는 비밀번호가 올바르지 않습니다.","data":null,"code":400}`. 🔴 **mock 문구와 글자 단위로 같다**(`handlers/auth.ts:75`)
  - (B) **ProblemDetails**: 필드 누락 → HTTP **400** + `{errors, type, title, status, traceId}`. 🔴 **`message` 필드가 없다** — `message`로 분기하면 터진다는 `CLAUDE.md` B4 전제가 실측으로 확인됐다
  - (C) **빈 body**: 토큰 없음·엉뚱한 토큰 → HTTP **401** + `Content-Length: 0`. 🔴 **변경계(`DeletePoint`)도 같다** — 인증 실패 경로는 조회계와 동일
  - 부수 확인: 로그인 요청 필드는 `loginId`/**`loginPw`**이고 우리 코드가 이미 그대로 쓴다(`auth/form/schema.ts:16,23`)
- [x] T282 T281 결과를 `docs/api-spec.md` §3에 **"실측 확인(2026-10-08)"** 으로 표기 — 지금은 가정으로 적혀 있다

### R1 — 인증 (020·021 이월) — ✅ 2026-10-08 완료

> 🔴 **여기가 맨 앞인 이유**: 인증이 틀어지면 R2·R3는 전부 무의미하다. 특히 ⑤가 1개면 021의 N분기가 실 서버에서 한 번도 돌지 않는다.

**결과 요약 — 020·021의 가정은 거의 다 맞았고, 틀린 것 1건을 고쳤다.**

| 확인 항목 | 결과 |
|---|---|
| 로그인 응답 `code` | ✅ 현장 `333333` → **201** / 본사 `000000` → **101**. §2-1 사전과 일치 |
| 🔴 한글 클레임 | ✅ **우리 구현이 맞았다.** payload 에 non-ASCII 바이트가 실제로 있고, `atob` 만 쓰면 `'현장 관리자 테스트'` → `'íì¥ ê´ë¦¬ì íì¤í¸'` 로 깨진다. 실 토큰으로 두 경로를 나란히 돌려 확인 |
| 실 `role` 문자열 | ✅ `FieldManager` / `SystemManager` — `JWT_ROLE_TO_ROLE` 매핑과 일치. 가드·메뉴 영향 **없음** |
| 토큰 수명 | ✅ `exp - nbf` = 10800초(3시간) |
| 🔴 `userSeq` 타입 | ❌ **불일치.** 선언은 `number`인데 실제는 **문자열** `'13'`·`'1'` → T285에서 교정 |
| `UserSiteSelect` 구조 | ✅ `childSiteSeq`·`childSiteName`·`parentSeq` 전부 일치. 루트 `siteSeq`=6 도 일치 |
| 🔴 `children` 개수 | ✅ **2개** — mock 가정과 일치. 021의 N분기가 실 서버에서 실제로 돈다. (사업장명만 다름: `테스트 사업장2-1`·`2-2`) |

**계획 외 발견 2건**

- 🔴 **`UserSiteSelect` ↔ `AdminSiteSelect` 는 상호 배타**다 — 사이트가 다른 토큰으로 호출하면 **403 + 빈 body**. `LoginForm:87` 이 본사(1xx)에서 `UserSiteSelect` 를 부르지 않는 것은 "미룬 것"이 아니라 **없으면 본사 로그인이 깨지는 필요 분기**였다(021 판단이 결과적으로 옳았다)
- 🔴 **OQ-1B 해소 — `AdminSiteSelect` 는 평면 배열로 바뀌지 않았다.** "평면 배열로 바뀐다"던 전달(2026-10-06)이 반영되지 않았고 여전히 **`GroupNode` 이중 재귀 트리**다(그룹이 `children` 으로 재귀 + 각 그룹의 `sites[]` 안에서 사업장이 또 재귀). → **Phase 5 본사 선택은 트리 평탄화 어댑터가 필요**하고, 평면 배열을 기다릴 이유가 없어졌다

- [x] T283 로그인 + JWT 실측 — ① 실제 JWT의 **한글 클레임이 깨지지 않는지**(020 최대 위험 지점, `atob`만 쓰면 깨진다) ② 실 `role` 문자열이 `FieldManager`/`SystemManager`와 일치하는지(OQ-D) ③ 로그인 응답 `code`가 현장 `201`/본사 `101` 실측과 맞는지
- [x] T284 `UserSiteSelect` 실측 — ④ 응답 구조가 `api-spec.md` §5-2와 같은지(특히 **`childSiteSeq` 필드명**) ⑤ 🔴 실 계정의 `children` **개수**(mock은 `333333`=2개 가정)
- [x] T285 R1 불일치 반영 — **`userSeq` 를 `string` 으로 교정했다.** 클레임 타입은 실측 그대로(B4 "서버 응답이 메인"), 우리 모델 `MeDto.userSeq: number` 로의 변환은 **어댑터 한 자리**(`useMe.ts:50` `Number(...)`)에서만 한다(B4 어댑터 조건 ③). 소비처는 0곳이라 런타임 영향은 없었지만 **타입이 거짓말을 하고 있었다**. 테스트 헬퍼(`test/jwt.ts`)·단언 2곳도 실측 형태로 맞췄다. `verify` 0 errors / auth 테스트 68건 green. ~~R1 불일치 반영~~ — 틀어진 것만 고친다. 🔴 **`role` 문자열이 다르면 가드·메뉴 권한 전부가 영향**이라 여기서 멈추고 보고한다

### R2 — 조회 (022 US1 · 판단 1·2 확정) — ✅ 2026-10-08 완료 (판단 1 제외)

**결과 요약 — 응답 형태는 전량 일치. 대신 보안 사안 1건이 드러났다.**

| 확인 항목 | 결과 |
|---|---|
| `GetPointList` 행 필드 | ✅ **9개 키 전량 일치** — `pointSeq`·`pointName`·`memo`·`authMethod`·`authMethodName`·`usedCount`·`useYn`·`nfcTagId`·`lastPatrolDt` |
| `DetailPoint` 필드 | ✅ **14개 키 전량 일치** — 우리 `PointDetail` 선언과 같다 |
| 페이징 래퍼 | ✅ `items`·`page`·`pageSize`·`totalCount`·`totalPages` |
| `pageNumber=0` | ✅ **400 + 래퍼** `"페이지 번호는 1 이상이어야 합니다."` — 🔴 **mock 문구와 글자 단위로 같다** |
| `pageNumber` 초과 | ✅ 에러가 아니라 **빈 items + 요청값 에코**(`page: 99`, `totalCount: 15`) |
| 🔴 필터 3종 (Phase 6 전제) | ✅ **전부 서버에서 걸린다.** `authMethod=9`→4건 / `=10`→11건 / `useYn=true`→15건 / `=false`→0건 / `searchKey=지점`→6건·`2F`→2건·`zzzz`→0건. **Phase 6을 실측 위에서 짤 수 있다** |
| 🔴 **판단 2 `createdAt`** | ✅ **확정 — 목록·상세 모두 `createdAt` 계열 필드가 없다.** 현재 처리(행 제거 + 최근 순찰 대체) **유지 확정**. 생성일이 필요하면 백엔드 추가 요청 |
| 🔴 **판단 1 미사용 지점** | ⚠️ **미확정 — 테스트 데이터에 `useYn: false` 지점이 0건**이다(15건 전부 `true`). 다만 `useYn=false` 필터가 정상 동작하므로 서버가 기본 제외하는 구조는 아닐 가능성이 높다. 🔴 **R3 에서 `useYn: false` 지점을 생성해 목록에 섞여 오는지 확인하면 확정된다**(쓰기 범위 안이다) |

**🔴 계획 외 발견 — 보안 사안 1건 + 데이터 특성 3건**

1. 🔴🔴 **서버가 `siteSeq` 권한을 전혀 검사하지 않는다.** 현장 계정 `333333`(`UserSiteSelect` 접근 가능 = 7·8)이 `siteSeq=3` 을 조회하면 **200 + 실제 15건**이 내려오고, 그 지점의 `DetailPoint` 도 **200 으로 열린다.** `api-spec.md` 의 기존 기록 "권한 밖 → 200 + 빈 목록"(B-9)은 **지점이 0건인 사업장을 조회한 탓의 잘못된 추론**이었다. → ① 현재 유일한 방어는 **프론트가 선택 목록 안의 값만 쿼리에 싣는 것**이고 `spec 021` 설계(`siteSeq` URL 비노출)가 결과적으로 옳았다 ② **서버측 검사 추가를 백엔드에 요청해야 한다**(B-9 를 🔴 로 승격). ⚠️ 확인은 목록·상세 각 1회로 멈췄고 더 파지 않았다
2. **`gpsLat`/`gpsLng` 에 실제 좌표가 들어있다**(`123.0`/`57.22`, `37.4939103`/`127.0779541`). `authMethod` 는 9·10 뿐인데 좌표는 채워져 있다 → **OQ-022-C 재해석**: GPS 는 "3번째 인증수단"이 아니라 **지점의 속성**일 수 있다. 우리 `AddPoint` 는 좌표를 보내지 않으므로(규칙 10) 신규 지점은 좌표가 비게 된다 — 그래도 되는지 확인 필요
3. **NFC 지점인데 `nfcTagId: null`** 인 데이터가 존재한다(`pointSeq=30`). 서버가 강제하지 않아 **우리 폼이 서버보다 엄격**하다. 상세 화면은 `point.nfcTagId &&` 로 이미 안전 처리돼 있다(B-13 등재)
4. **`qrCode` 에 QR 페이로드가 아닌 임의 문자열**이 들어있다(`"수정하면서 넣은 지점"`). 형식이 강제되지 않고 **NFC 지점에도 값이 있다** → OQ-022-D(QR 다운로드) 때 형식을 믿으면 안 된다(B-14 등재)
5. ⚠️ **현장 계정의 소속 사업장 7·8 에는 지점이 0건**이다(mock 은 7 에 10건을 넣어 뒀다). 데이터가 있는 곳은 2(4건)·3(15건)·6(9건)·10(1건) — 형태 실측은 **본사 토큰**(정당한 권한)으로 `siteSeq=3` 에서 했다


- [x] T286 `GetPointList`·`DetailPoint` 실응답 **전량 대조** in docs/api-spec.md — §5-2 10·11번 블록과 필드 단위로. 🔴 우리가 **쓰지 않는 필드까지 전량 기록**한다(B4 "서버 응답이 메인")
- [x] T287 🔴 **판단 2 확정** — `DetailPoint`에 `createdAt` 계열 필드가 정말 없는지. 없으면 현재 상태(제거 + 최근 순찰 대체) 유지 확정, 필요하면 **백엔드 요청 목록에 등재**(OQ-022-I)
- [x] T288 🔴 **판단 1 확정** ⚠️ **R2 에서 확정 못 함 — 테스트 데이터에 미사용 지점이 0건.** R3 에서 `useYn: false` 지점을 생성해 확인한다(쓰기 범위 안). ~~판단 1 확정~~ — `GetPointList`에 **미사용(`useYn: false`) 지점이 섞여 오는가.** 섞여 오면 목록 표시 수단(뱃지/흐리게)을 정하고, 서버가 제외하면 표시 자체가 불필요해진다(OQ-022-G)
- [x] T289 조회 부가 실측 — `authMethodName` null 표현이 `''`/`'Unknown'` 둘 다인지(OQ-022-F, 백엔드 통일 요청 근거) · `usedCount` 의미 확인 · 🔴 **필터 파라미터(`searchKey`·`authMethod`·`useYn`)가 실제로 서버에서 걸리는지** — Phase 6이 이것에 전적으로 의존한다

### R3 — 변경계 (022 US2~4 · OQ-022-A·J) — ✅ 2026-10-08 완료

**결과 요약 — 두 함정은 둘 다 해당 없었고, 대신 실사용 버그 1건이 서버 쪽에서 나왔다.**

| 확인 항목 | 결과 |
|---|---|
| 🔴 **OQ-022-A** (200 + 실패 `code`) | ✅ **해당 없음.** 실패는 전부 4xx/5xx 다. 019 의 "성공은 2xx 전담" 판정이 변경계에서도 안전하다 |
| 🔴 **OQ-022-J** (래퍼 아님) | ✅ **해당 없음.** 204 가 아니라 조회계와 같은 `ApiResponse` 래퍼다 → 인터셉터 통과 |
| 성공 응답 | 200 + `{"message":"요청이 정상 처리되었습니다.","data":true,"code":200}` — **`data` 가 `boolean`** |
| `AddPoint` 가 `pointSeq` 를 주는가 | ❌ **주지 않는다** (`data: true` 뿐) → `api/addPoint.ts` 를 `void` 로 둔 판단이 맞았다 |
| `qrCode` | 🔴 **서버가 자동 생성**한다: `STSP1:{siteSeq}:{pointSeq}:{unix}:{서명}`. mock 의 형식 가정이 맞았다 |
| `gpsLat`/`gpsLng` | 보내지 않으면 `null` 로 남는다 — 기존 지점의 좌표는 다른 경로로 들어간 값(OQ-022-C) |
| `UpdatePoint` 부분 갱신 | ✅ **진짜 PATCH다.** `pointSeq` + `name` 만 보내도 나머지가 유지된다 |
| 유효성 오류 형태 | ⚠️ **일관되지 않다** — `name` 누락은 400 ProblemDetails, **`siteSeq` 누락은 500**, **`authMethod: 99` 는 500 + 빈 body**(B-16) |
| 없는 `pointSeq` | 400 + 래퍼, `data: false`, 문구는 전부 `"잘못된 요청입니다."`(B-17) |
| 🔴 **판단 1** (미사용 지점) | ✅ **확정 — 목록에 섞여 온다.** `useYn: false` 로 생성한 뒤 필터 없이 조회하니 **그대로 1건** 내려왔다(`useYn=true` → 0건 / `useYn=false` → 1건). **서버는 기본 제외하지 않으므로 프론트가 목록에서 구분해 그려야 한다** |

**🔴🔴 가장 중요한 발견 — `UpdatePoint` 로 값을 비울 수 없다 (B-15 신설)**

서버가 `null` 과 `''` 를 **"변경하지 않음"** 으로 해석해 무시한다. 실측:

| 보낸 값 | `memo` | `nfcTagId` |
|---|---|---|
| `null` | 무시(유지) | 무시(유지) |
| `''` | 무시(유지) | 무시(유지) |
| `' '`(공백 1칸) | **지워짐** (`''` 로 저장) | **무시(유지)** |

**우리 앱에 그대로 영향이 있다** — `EditPointForm` 은 설명이 비면 `memo: null`, QR 선택 시 `nfcTagId: null` 을 보낸다:
1. **사용자가 설명을 비우고 저장해도 지워지지 않는다** (실사용 버그)
2. **NFC → QR 로 바꾸면 `nfcTagId` 가 남아 인증수단과 어긋난 데이터**가 된다. 화면에는 안 보이지만(`PointDetail` 이 `method === 'NFC' && point.nfcTagId` 로 막는다) **다시 NFC 로 바꾸면 옛 TAG ID 가 되살아난다**

⚠️ **클라이언트 우회를 넣지 않았다.** `memo` 는 `' '` 를 보내면 지워지지만 ① 서버 버그에 기대는 동작이고 ② `nfcTagId` 는 그 방법도 통하지 않아 **반쪽 해결**이다. **백엔드에 "비우기" 규약을 요청하는 것이 맞다**(B-15) — 사용자 판단 대기

**그 외**

- ✅ **500 + 빈 body 가 실재한다**(`authMethod: 99`). `api-spec.md` §3-(C) 에 401·403 만 적혀 있었다. 🔴 **코드는 이미 안전** — `normalizeError` 가 `isEmptyBody` → status 기반 문구로 수렴시킨다(019 설계가 덮었다)
- ✅ **뒷정리 완료** — `siteSeq=7` 은 다시 0건이고, 500 났던 호출은 지점을 만들지 않았다
- ⚠️ **OQ-022-B(`usedCount > 0` 삭제 거부)는 확인하지 않았다** — 쓰기 범위 합의대로. **판단 3 보류 유지**


> 🔴 **실 DB에 쓰는 유일한 구간.** "생성 → 그 지점을 수정 → 그 지점을 삭제" **한 사이클로 묶어 자기 뒷정리**한다. 중간에 멈추면 테스트 지점이 남으므로 삭제까지 반드시 간다.

- [x] T290 `AddPoint` 실측 — 🔴 **실제 status code와 바디를 그대로 기록.** OQ-022-A(HTTP 200 + 실패 `code`가 있는가) · OQ-022-J(래퍼가 아닌가 — 204 No Content면 성공이 실패로 보고된다) · 성공 응답이 생성된 `pointSeq`를 주는가
- [x] T291 `UpdatePoint`(PATCH) 실측 — 같은 3가지 + 🔴 **필드를 생략하면 서버가 "변경 없음"으로 보는가**(현재는 전량 전송으로 회피 중)
- [x] T292 `DeletePoint` 실측 — 같은 3가지. ⚠️ **`usedCount > 0` 거부 여부는 확인 범위 밖**(쓰기 범위 합의) → OQ-022-B·판단 3 **보류 유지**
- [x] T293 변경계 유효성 오류 실측 — 잘못된 바디를 보내 **ProblemDetails(B)인지 래퍼(A)인지** 확인. 현재 MSW는 래퍼로 가정해 뒀다
- [x] T294 R3 불일치 반영 — 🔴 OQ-022-A·J에 해당하면 **`axios.ts` 인터셉터 보강이 필요하고 그건 019 영역**이다. 022에서 손대지 않고 **범위·영향을 보고**한다(A3)

### R4 — 반영·기록

> T297 의 결과는 **아래 "R4·R5 — 마무리" 블록**에 있다.

- [x] T295 🔴 `docs/api-spec.md`에 **변경계 섹션 신설** — 지금 §5-1 실측 24종은 **전부 조회계**고 POST/PATCH/DELETE 행이 0건이다. 022가 만든 5개 호출의 실측을 여기 남겨야 `023~026`이 같은 함정을 다시 밟지 않는다
- [x] T296 MSW 핸들러를 실측에 맞춘다 in src/mocks/handlers/points.ts — 변경계 3종의 **가정 주석을 실측으로 교체**. 특히 `DeletePoint` 거부 분기는 거부가 확인되지 않았으면 **"미실측 가정"임을 더 분명히** 남긴다(지우지는 않는다 — UI 경로가 거기에 걸려 있다)

### R5 — 잔여 OQ (R2 이후 아무 때나 `[P]`)

> T299·T300 의 결과는 **아래 "R4·R5 — 마무리" 블록**에 있다(계획 시점 문구와 실제 결과가 달라 그쪽을 SSOT 로 둔다).

- [x] T298 [P] **403 응답 형태** 실측 — ✅ **빈 body 확인**(2026-10-08). 두 SiteSelect 교차 호출로 확인했다. `api-spec.md` §3-(C) 의 403 행이 실측으로 뒷받침됐다. ~~403 응답 형태~~ — 권한 밖 호출. `api-spec.md` §3은 "빈 body"로 적고 있으나 401만 확인됐다

### R4·R5 — 마무리 (2026-10-08)

- [x] T297 이월 블록 갱신 — 판단 1·2 **해소 처리**, 판단 3 보류 사유 명시. 아래 이월 목록에서 해소분 정리
- [x] T299 [P] **GPS 재해석** — `authMethod` 는 여전히 9·10 뿐인데 기존 지점의 `gpsLat`/`gpsLng` 에 **실제 좌표가 들어있다**(실측). 반면 우리가 좌표 없이 생성한 지점은 `null` 로 남았고 **생성·수정이 모두 정상 동작했다.** → **OQ-022-C 재해석**: GPS 는 "3번째 인증수단" 이 아니라 **지점의 부가 속성**일 가능성이 높다. 🔴 **인증수단 3종 추가는 하지 않는다** — 근거가 없어졌다(A1). 남은 질문은 "좌표를 프론트에서 입력받아야 하는가"이고, 이는 목업·업무 요구가 없어 **별도 판단**으로 넘긴다
- [x] T300 [P] 백엔드 요청 목록 정리 — `api-spec.md` §6-1 에 **B-13~B-17 신설**, **B-9 를 🟡→🔴 승격**. 아래 "백엔드 요청 우선순위" 참조

### 🔴 백엔드 요청 우선순위 (Phase 8 산출물)

> ⚠️ **아래 표는 2026-10-08 시점의 스냅샷이다.** 그 뒤 `spec 027`·`023` 사전 분석에서
> B-19~B-26 이 추가되며 순위가 바뀌었다 — **살아 있는 목록은 `api-spec.md` §6-1-A 다.**
> 전달할 때는 그쪽을 본다. 여기는 022 가 무엇을 남겼는지 보는 기록으로 둔다.

| 순위 | # | 내용 | 왜 급한가 |
|---|---|---|---|
| 1 | **B-9** | `siteSeq` 권한 **미검사** — 현장 계정이 소속 밖 사업장의 지점 목록·상세를 그대로 받는다 | **보안.** 프론트 제한은 전부 우회 가능하다. 서버만 막을 수 있다 |
| 2 | **B-15** | `UpdatePoint` 로 **값을 비울 수 없다**(`null`·`''` 무시) | **실사용 버그.** 설명을 비워도 안 지워지고, NFC→QR 전환 시 TAG ID 가 남아 데이터가 어긋난다. 게다가 **성공 응답이 와서 조용히 실패**한다 |
| 3 | **B-16** | 유효성 오류가 400 이 아니라 **500 으로 샌다**(`siteSeq` 누락, `authMethod` enum 밖) | 사용자에게 "서버 오류" 로 보인다. 입력을 고쳐야 한다는 안내를 할 수 없다 |
| 4 | **B-17** | 변경계 실패 문구가 전부 `"잘못된 요청입니다."` | 사유를 구분·안내할 수 없다 |
| 5 | B-13·B-14 | NFC 인데 `nfcTagId: null` 인 데이터 / `qrCode` 에 임의 문자열 | 기존 데이터 정합성. 당장 화면은 안전 처리돼 있다 |
| 6 | B-6 | `authMethodName` null 표현 2종(`''`/`'Unknown'`) | 프론트가 매핑표 폴백으로 이미 수용 중 |

### R6 — 🔴 브라우저 통합 검증 (미수행 — 사용자 몫)

> **왜 별도 구간인가**: R0~R5 의 실측은 **전부 `curl`** 이었다. API 계약은 확인했지만
> **우리 앱이 그 서버와 맞물려 도는지는 확인하지 않았다** — axios 인터셉터·토큰 재발급·
> 가드 분기·폼 배선은 계약과 별개다. 020 이월 항목이 요구한 것이 정확히 이것이다.

- [x] T301 role 실측 반영 — 🔴 **`Master` 매핑 추가.** 계정 `222222`(code 102)로 `'Master'` 를 실측했다. 매핑이 없던 동안 **Master 계정은 로그인에 성공해도 `AuthGuard` 가 로그인 화면으로 되돌려 들어갈 수 없었다**(020 spec §4 가 "OQ-D 해소까지 의도된 동작" 으로 적어 둔 상태). `'FieldWorker'`(code 202)도 실측했지만 **의도적으로 매핑하지 않았다** — `AuthGuard` 가 "매핑되면 통과" 라서 넣으면 근무자가 WEB 을 통과한다(B1). `'Manager'`(code 103)는 계정이 없어 여전히 미실측. 테스트 3곳이 `'Master'` 를 "매핑 밖" 예시로 쓰고 있어 `'Manager'` 로 교체하고 Master 양성 케이스를 추가했다
- [x] T302 mock dev 계정 교정 — `222222` 의 `jwtRole` 추측값 `'Worker'` → 실측값 `'FieldWorker'`. Master 를 눌러볼 `111111` 추가. 🔴 **실 서버 권한과 사번이 다르다는 사실을 주석에 표로 남겼다**(`222222` 는 실제 Master, `444444`·`555555` 는 실제 근무자) — **일부러 맞추지 않았다.** 맞추면 021 의 사업장 선택 0/1/N 분기를 dev 에서 눌러볼 수단이 사라진다
- [x] T303-A 🔴 **CORS 차단 해소 (dev 프록시)** — 브라우저로 앱을 띄우자마자 **전 요청이 CORS 로 막혔다.** 서버가 `Access-Control-Allow-Origin` 을 **전혀 주지 않는다**(preflight 는 204 를 주지만 헤더가 없다). 🔴 **`curl` 은 CORS 를 적용하지 않아 R0~R5 의 계약 실측에서는 전혀 드러나지 않았다** — R6 을 별도 구간으로 둔 이유가 그대로 실증됐다. 해법: 클라이언트는 상대 경로로 호출하고 **vite dev 서버가 `/api` 를 백엔드로 중계**한다(same-origin → CORS 미적용). `VITE_API_PROXY_TARGET` 이 없으면 프록시를 달지 않아 mock 모드는 무영향. 프록시 경유로 **로그인 + 토큰 헤더 + `sign` 엔드포인트까지 동작 확인**. 운영은 same-origin 이라 이 문제가 없다 — 백엔드 CORS 설정은 로컬 개발용으로 별도 요청(B-18)
- [x] 🔴 T303 **브라우저 통합 검증** → `npm run dev:real`. **사용자 수행·확인 완료(2026-10-08)** — 현장 로그인 + 사업장 선택, 지점 CRUD, 본사 로그인(🔴 Master 진입 포함), 근무자 차단을 브라우저에서 확인했다. 선행으로 T303-A(CORS) 해소가 필요했다
- [x] T304 T303 에서 나온 불일치 반영 — **보고된 불일치 없음.** CORS(T303-A) 외에 추가 수정 사항이 나오지 않았다

**→ 019~022 의 실 백엔드 연결은 여기서 닫힌다.** 남은 미실측은 아래 표(계정·데이터 부재)이며 시간이 아니라 **환경이 막고 있는 항목**이다.

~~**🔴 R6 이전까지 "실 백엔드 통과" 라고 말할 수 없다.** 계약만 통과한 상태다.~~ → **R6 완료(2026-10-08). 계약 + 앱 통합 모두 통과.**

### 여전히 미실측 (계정·데이터가 없어서)

| 항목 | 막힌 이유 |
|---|---|
| `Manager` role 문자열 (code 103) | 해당 계정이 없다 |
| OQ-022-B 삭제 거부 | 쓰기 범위 합의 — 실 지점 삭제 위험 |
| OQ-021-A `children` 0개 응답 | **무소속 현장관리자 계정이 없다.** `555555` 를 그 용도로 보려 했으나 실 서버에서는 **근무자**였다 |
| 다른 도메인 변경계 16종 | 022 범위 밖. 지점 3종만 실측(§5-1-B 의 "공통 규칙" 은 출발점으로 쓸 수 있다) |
| `roleDisplay` 사용 여부 (OQ-A) | 실측값이 `roleLabel` 과 다르다(마스터/현장근무자 ↔ Master/근무자). 표시명 변경은 화면 여러 곳에 파급돼 별도 판단 |

## WF-5 마감 — DoD 19개 대조표 (2026-10-08)

> T279(문서 동기화)·T280(본 표) 수행분. 증거는 `파일:라인`.
> **판정**: ☑ 충족 / ◩ 부분 / ➡ `spec 027` 이월 / ⚠️ 환경 제약으로 보류

| # | 조건 | 판정 | 증거 · 사유 |
|:-:|---|:-:|---|
| 1 | 목록이 `GetPointList` 결과를 렌더. mock 직접 import 0건 | ☑ | `pages/service/points/PointsPage.tsx:32` `usePointList`. `features/points` 런타임의 `mock/pointData` import **0건** — 남은 2곳은 MSW 핸들러(`mocks/handlers/points.ts:3`, 004 방침)와 `features/zone`(제약 1, 023에서 정리) |
| 2 | 행 선택 시 상세 별도 조회 + 첫 행 자동 선택 | ☑ | `PointsPage.tsx:37-40` — 자동 선택은 effect 가 아니라 **파생**(`items.find(selected) ?? items[0]`)이라 깜빡임이 없다 |
| 3 | `siteSeq` 가 `getSiteSeq()` 에서 오고 URL 미노출. `null` 이면 조회 안 함 | ☑ | `PointsPage.tsx:30` · `PointsPage.test.tsx` "사업장이 선택되지 않았으면 조회를 시도하지 않는다" |
| 4 | 추가(POST) 성공 → 모달 닫힘 + 목록 반영 | ☑ | `form/AddPointForm.tsx` · `components/PointTopNav.tsx` (성공 후에만 닫는다) |
| 5 | 수정(PATCH) 성공 → 목록·상세 반영. 폼이 기존 값으로 초기화 | ☑ | `form/EditPointForm.tsx` — `defaultValues` 주입 + `lists`·`detail` 둘 다 무효화 |
| 6 | 삭제(DELETE) 성공 → 목록에서 사라지고 선택 해제 | ☑ | `components/detail/PointDetail.tsx` — 선택 해제를 무효화보다 **먼저** 한다 |
| 7 | 삭제 거부 시 메시지 노출 + 목록 유지. 선제 차단 없음 | ◩ | 거부 시 무효화·선택 해제를 **둘 다 안 한다**(`PointDetail.test.tsx` 3건). 사유는 전역 토스트가 전담(규칙 3). ⚠️ **실 서버가 정말 거부하는지는 미실측**(OQ-022-B) — 쓰기 범위 합의상 코스 편성된 실 지점을 지울 수 없었다. 확인은 코스 편성 API(023) 이후 |
| 8 | `authMethod` 정수↔표시 변환이 한 파일에만 | ☑ | `features/points/lib/authMethod.ts` 전담. 컴포넌트 prop 계약(`'QR' \| 'NFC'`)은 바꾸지 않았다(제약 2) |
| 9 | 검색·필터가 서버 파라미터로 나가고 URL 보존. 클라이언트 필터 0건 | **➡** | **미구현 → `spec 027` 이월.** ✅ 다만 **서버 필터가 실제로 걸리는 것은 실측**했다(Phase 8 R2: `authMethod=9`→4건 / `useYn=false`→0건 / `searchKey=지점`→6건). 클라이언트 필터 함수는 **0건 유지** |
| 10 | 페이지 번호 1-based↔0-based 변환이 한 자리. `pageSize=20` 명시 | ◩ | 변환은 `lib/pointListParams.ts` 한 곳 + `pageSize` 명시 전송 ☑. **URL 연결은 #9 와 함께 이월** |
| 11 | `useYn` 이 폼에 있고 전송됨. `gpsLat/Lng`·`reissueQrYn` 은 폼에 없음 | ☑ | `form/schema.ts` · 전송 바디를 `toEqual` 로 **전량 비교**해 고정(`AddPointForm.test.tsx`) |
| 12 | NFC TAG ID 14자리 HEX 검증 + 오류가 해당 필드에 표시 | ☑ | `form/schema.ts` refine 2개(빈 값/형식 분리) + 🔴 **복붙 결함 수정** — `:46`·`:64` 가 `errors.name` 을 보고 있어 **메시지가 뜰 자리가 없었다** |
| 13 | `queryKey` 규약 + 변경 성공 시 무효화 | ☑ | `features/points/queryKeys.ts` · 문서화는 **`data-model.md` §8**(아래 #19) |
| 14 | mutation 실패 토스트가 1개만 | ☑ | 폼·상세에서 토스트를 띄우지 않는다. `lib/queryClient.ts:18-20` 전역 `MutationCache.onError` 전담 |
| 15 | MSW 핸들러 Point 5종 전부. mock 모드에서 CRUD 끝까지 동작 | ☑ | `mocks/handlers/points.ts` — 목록·상세·추가·수정·삭제. **실측에 맞춰 교정**(성공 `data: true`, PATCH 의 `null`/`''` 무시 재현) |
| 16 | `npm run verify` 0 errors + `npm run test` green | ☑ | 0 errors(warning 1 은 MSW 생성 파일) / **49 files · 395 tests**(착수 시 320) |
| 17 | `npm run capture` baseline 재촬영 | **➡** | **`spec 027` 이월** — 화면이 통째로 재구성되므로 지금 찍으면 **두 번 찍는다** |
| 18 | 브라우저 확인(MSW 모드) 전체 체크리스트 | ◩ **➡** | **실 서버 브라우저 확인은 Phase 8 R6 에서 완료**(로그인·사업장 선택·지점 CRUD·본사·근무자 차단). **MSW 모드 전체 체크리스트는 027 로 이월** |
| 19 | 문서 동기화 4종 | ☑ | **`data-model.md` §8 `queryKey` 규약 신설**(§7 이 `spec 015` 에서 참조돼 재번호 회피) / `roadmap.md` §7-1 **`PUT`→`PATCH` 교정** + 027 행 추가 + §7 지점 행 2개 + §12 행 2개 / `screens.md` §1-3 진행도 + 재구성 예고 / `api-spec.md` **§5-1-B 변경계 실측 섹션 신설** + B-13~B-18 |

### 판정 요약

- **☑ 충족 14** · **◩ 부분 3**(#7·#10·#18) · **➡ 이월 2**(#9·#17)
- **미충족 0.** 이월 2건은 **`spec 027`(화면 재구성)이 같은 화면을 다시 만들기 때문**이고, 거기서 자연히 흡수된다
- 🔴 **#7 의 "거부" 만 환경 제약으로 남는다** — 코스 편성 API 가 없어 실 지점을 지우지 않고는 확인할 수 없다

### 022 가 남긴 것 (`023~027` 이 쓸 자산)

1. **`queryKey` 규약** — `data-model.md` §8. 프로젝트 첫 규약이고 `023~026` 이 그대로 따른다
2. **`api-spec.md` §5-1-B 변경계 실측** — 기존 실측 24종이 전부 조회계였다. 변경계의 공통 규칙(200 + `data: true`, 실패는 4xx/5xx, ID 를 주지 않음)을 다른 도메인의 출발점으로 쓸 수 있다
3. **백엔드 요청 우선순위 6건** — B-9(보안)·B-15(조용히 실패)가 1·2순위
4. **dev 프록시** — CORS 미설정 우회. 이후 모든 실 서버 작업이 이것 없이는 불가능하다
5. **실측된 role 3종 + dev 계정 주석** — mock 과 실 서버의 권한 차이를 표로 남겼다

---

## Dependencies & Execution Order

- **T240 → 그 외 전부.** 응답 타입이 없으면 api·훅·컴포넌트가 컴파일되지 않는다
- **T241 → T246·T247·T261·T266** (요청 DTO → 변경계)
- **T242 → T255·T257·T261·T266.** 정수↔표시 매핑이 목록·상세·폼 전부의 공통 기반
- **T243 → T253·T262·T267·T268.** 키가 없으면 조회도 무효화도 못 한다
- **T244·T245 → T253 → T254 → T255·T256·T257.** api → 훅 → 페이지 구조 → 컴포넌트 순서는 뒤집을 수 없다
- **T249 → T273·T274** (파라미터 변환 → URL 연결·페이지 이동)
- **T251·T252 → T253 이후 모든 화면 검증.** 🔴 MSW가 없으면 Phase 3의 독립 테스트 기준 자체를 세울 수 없다(제약 3)
- **T254 → T258·T259.** 구조가 바뀐 뒤에 테스트를 맞춘다
- **T260 → T261 → T262·T264.** 🔴 **Phase 4 내부는 순차**다(제약 4) — 스키마만 바꾸고 멈추면 typecheck red
- **T261 → T266.** 추가 폼의 전송·에러 처리 모양이 선 뒤에 수정 폼이 같은 모양을 쓴다(두 번 설계하지 않는다)
- **T263 → T264** / **T265 → T270** (MSW 핸들러가 해당 테스트의 전제)
- **T266 → T267 → T268 → T269.** 수정 → 삭제 순서. 둘 다 `PointDetail.tsx` 한 파일을 만지므로 **병렬 금지**
- **T271·T272 → T273 → T274·T275**
- **T277 → T278.** 캡쳐가 깨지지 않음을 확인한 뒤 브라우저 체크리스트를 돈다
- **T279·T280은 마지막.** 코드가 확정된 뒤 문서를 맞춘다
- `[P]` 끼리는 병렬 가능: (T240·T241·T242) / (T243·T244·T245·T246·T247·T248) / (T250) / (T259) / (T264) / (T270) / (T276·T279)

**Phase 간 요약**

```
Phase 1 (타입·매핑, 신설만)
  → Phase 2 (api 5종 + 키 + 파라미터 변환, 순수함수 테스트로 고정)
    → Phase 3 (조회 전환 + 🔴 MSW 묶음 — 여기서 화면이 실제로 서버를 본다)
      → Phase 4 (추가 + 스키마·폼 정합, 내부 순차)
        → Phase 5 (수정·삭제, PointDetail.tsx 단일 파일이라 순차)
          → Phase 6 (검색·필터·페이지, 전부 서버 위임)
            → Phase 7 (캡쳐·브라우저·문서)

Phase 8 (실 백엔드 실측)  ← 🔴 Phase 6보다 먼저 R1·R2를 끝내는 편이 낫다
  R0 ✅ → R1 인증 → R2 조회(판단 1·2 확정) → R3 변경계 → R4 반영
                              ↘ R5 잔여 OQ [P]
```

**Phase 8 순서 근거**

- **R1 → R2 → R3.** 인증이 틀어지면 뒤가 전부 무의미하고, 조회 응답을 모르면 변경 결과를 확인할 수단이 없다
- 🔴 **R2(T289) → Phase 6.** 검색·필터가 **서버 파라미터에 전적으로 의존**하는데(규칙 8, 클라이언트 필터 0건) 그 파라미터가 실제로 걸리는지는 미확인이다. R2를 먼저 끝내면 Phase 6을 실측 위에서 짠다
- **R3는 한 사이클로 묶는다**(T290 → T291 → T292). 생성한 지점을 삭제까지 해야 실 DB에 테스트 데이터가 남지 않는다
- **T294·T295는 R3 완료 후.** 실측 결과가 모여야 인터셉터 영향과 문서 구조를 판단할 수 있다

---

## 진행 기록

> WF-3 구현 중 발견·결정 사항을 Phase 단위로 누적한다.

### Phase 1 완료 — 타입·매핑 (2026-10-07)

- T240~T242 완료. **신설 2파일 + 기존 2파일 추가 수정**(`types/point.ts` 타입 추가 · `types/index.ts` 재수출 1줄). 신규 패키지 없음
- `npm run verify` **0 errors**(경고 1건은 기존 MSW 생성물 `public/mockServiceWorker.js`) + `npm run test` **42 files / 320 tests green** — 신설만이라 테스트 수 변동 없음(계획대로)
- ✅ **제약 1 그대로 적용** — 구 `PointType`·`PointAuthenticationMethod`를 남기고 서버 타입을 나란히 추가했다. 파일 상단 주석에 **참조 3곳과 "023에서 제거"** 를 적어 둬서 다음 세션이 찾아 헤매지 않게 했다
- **사용자 확인: 목록↔상세 필드명은 분리 유지**(2026-10-07). 질문이 들어와 공용 소비처를 실측했는데 **0곳**이었다 — 상세 하위 컴포넌트(`DetailRow`·`ZoneRow`·`DetailSection`)가 point 객체를 받지 않고 **primitive만**(`{label, value}`·`{title, isActive}`) 받는다. 통일 뷰 타입을 두면 목록에 없는 필드가 optional로 번져 "있는 줄 알고 바인딩"이 컴파일을 통과한다
  - 합쳐야 하는 **트리거 3종**(상세 로딩 중 목록 이름 선표시 / 낙관적 업데이트 / 목록·상세 모두 받는 공용 컴포넌트)을 `spec.md` 규칙 5에 추가했다. 그때도 통일 타입이 아니라 `pointDisplayName()` **함수 1개**로 해결한다
- 🔴 **이름 충돌 발견** — 타입 `PointDetail` ↔ 컴포넌트 `components/detail/PointDetail.tsx`. 타입명은 `api-spec.md` 실측 이름을 따르고(B4), **T257에서 `import type { PointDetail as PointDetailData }`** 로 받는다고 타입 주석에 명시해 뒀다
- **타입명이 B4의 `Summary` 접미사 규칙과 다르다.** 목록 행을 `PointSummary`가 아니라 **`PointRow`** 로 뒀다 — `api-spec.md`가 "응답 형태의 SSOT"이고 거기 실측 이름이 `PointRow`다. 021이 `UserSiteSelectData`로 같은 선택을 한 선례를 이었다(서버 이름을 우리 옛 이름으로 되돌리지 않는다)
- `resolveAuthMethodLabel`이 `''`를 반환할 수 있게 뒀다. 9·10 외 코드 + `authMethodName`도 비어 있으면 **보여줄 라벨이 없다** — 거기서 추측 라벨을 만들지 않고(A1) 호출부가 뱃지를 숨기는 쪽으로 넘겼다(T255에서 처리)
- `reissueQrYn`을 `UpdatePointRequest`에서 **생략하지 않고 `false` 명시**로 뒀다. swagger에 nullable이 아닌 `boolean`이라 생략 시 서버 기본값이 미실측이기 때문이다
- ⚠️ **계획 외 관찰 1건(미조치)** — `npm run verify`와 `npm run test`를 `CLAUDE.md` A4대로 병렬 실행했더니 `PatrolZonesPage.test.tsx`의 **동기** 테스트가 5s 타임아웃으로 flake했다(`setup 286s`·`environment 332s` — 부하). 단독 재실행 8/8 green, 전체 단독 실행 320/320 green. 병렬이 wall-clock은 줄이지만 이 머신에서는 **거짓 실패를 만든다** — 판단 필요
- 다음: Phase 2(T243~T250) — `queryKey` SSOT + api 5종 + 파라미터 변환 순수함수

### Phase 2 완료 — queryKey · api 5종 · 파라미터 변환 (2026-10-07)

- T243~T250 완료. **신설 9파일**(api 5 + `queryKeys.ts` + `lib/pointListParams.ts` + 테스트 3), 기존 파일 **0건 수정**
- `npm run verify` **0 errors** + `npm run test` **45 files / 350 tests green**(320 → **+30**)
- 🔴 **착수 전 발견 — 변경계 성공이 실패로 보고될 수 있다(OQ-022-J 신설).** `axios.ts:131-134`가 성공 응답마다 `isApiResponse`를 검사하고 실패하면 `throw new Error('알 수 없는 응답 형식')` 한다. 판정 기준은 `code`+`message`+`data` **셋 다**(`responseShape.ts:22-26`)라서, 변경계가 **204 No Content**이거나 `data` 없는 바디를 주면 **쓰기는 성공했는데 전역 토스트에 "알 수 없는 응답 형식"** 이 뜬다
  - OQ-022-A(200+실패 `code` → 실패를 성공으로)와 **반대 방향**의 문제다. 둘을 함께 실측해야 변경계를 신뢰할 수 있다
  - 실측 전이라 **코드로 분기하지 않았다**(A1). api 4종 주석에 함정을 명시만 했다
- **api 변경계 3종의 반환을 `Promise<void>`로 뒀다.** 성공 응답 형태가 미실측이라(`api-spec.md` §5-1에 변경계 행이 0건) 응답 본문에 의존하지 않고, 성공 후 목록을 무효화해 다시 읽는다. `AddPoint`가 생성된 `pointSeq`를 주더라도 쓰지 않는다 — 실측 후 필요하면 그때 넓힌다
- **`queryKeys`의 무효화 단위 이름을 `all` → `lists`로 바꿨다.** 상세 키는 루트가 `'point'`로 달라 `['points']` 접두사에 **걸리지 않는다**. `all`이면 "전부 무효화된다"고 오해해 수정 후 상세가 낡은 값으로 남는 버그가 나온다. `tasks.md`의 T262·T267·T268 표기도 함께 맞췄다
- **`pointKeys.list`가 `PointListParams`를 통째로 받게 했다.** `(siteSeq, params)` 2인자보다 **`siteSeq` 누락을 타입으로 막는다** — 키에서 `siteSeq`가 빠지면 사업장 전환 시 이전 사업장 목록이 그대로 보이고, 이건 런타임에만 드러난다
- 🔴 **URL `page`를 서버와 같은 1-based로 뒀다.** 그래서 URL↔서버 변환이 **없고**, 0-based인 `AppPagination` 경계 **한 곳**에서만 변환한다(`toPageIndex`/`toPageNumber`). 양쪽을 0-based로 맞추면 URL의 `page=0`이 1페이지를 뜻해 사용자에게 설명이 안 되고, 서버는 `pageNumber=0`에 400을 준다
- 파싱 실패는 **전부 기본값으로 수렴**시켰다(`page` → 1, 필터 → 미적용). 손으로 고친 URL이 화면을 깨뜨리지 않게 한다 — `lib/dateRangeQuery.ts`(018)의 방침 승계
- ⚠️ **`ALL_VALUE = 'ALL'` 중복 1건(미조치).** `features/patrol-zones/lib/courseHistoryOptions.ts:20`에 같은 상수가 있다(018). feature 로컬 중복으로 뒀다 — 두 화면이 서로를 import 하는 것보다 1줄 중복이 낫다(A6). **세 번째 소비처가 생기면 `AppSelect` 옆으로 승격**을 검토한다
- ⚠️ **Phase 1의 flake 때문에 이번엔 `verify`/`test`를 순차 실행했다.** `CLAUDE.md` A4는 병렬을 요구하지만, 병렬 시 `PatrolZonesPage.test.tsx`의 동기 테스트가 5s 타임아웃으로 거짓 실패한다(Phase 1 기록). wall-clock보다 **결과 신뢰성**을 택했다 — A4 재검토 필요
- 다음: Phase 3(T251~T259) — 🔴 조회 전환 + MSW **묶음**. 쪼개면 mock 모드 `/points`가 빈 화면이다(제약 3)

### Phase 3 완료 — 목록·상세 조회 전환 + MSW (2026-10-07)

- T251~T259 완료. 신설 4파일(MSW 핸들러 · 훅 2 · `PointsPage.test.tsx`) + 기존 7파일 수정
- `npm run verify` **0 errors** + `npm run test` **46 files / 362 tests green**(350 → **+12**)
- ✅ **깨질 테스트 사전 계수가 정확히 맞았다** — `PointListCard.test.tsx` **4건**만 깨지고 `AuthMethodDisplay.test.tsx` 3건은 **무변경**(제약 2 준수 효과). `CourseDiagramCard.test.tsx`도 무변경
- 🔴 **참조 동등 함정을 구조로 제거했다.** `PointListCard`의 `selected`를 `PointType | null`(객체)에서 **boolean**으로 바꿨다. 서버 응답은 재조회마다 새 객체라 `point === selected` 비교가 **항상 false**가 되어 선택 표시가 사라진다 — mock 동기 import 시절에만 성립하던 코드였다
- 🔴 **MSW 핸들러에서 사업장을 실제로 갈라 뒀다**(`siteSeq` 7: pointSeq 1~10 / 8: 11~15). 권한 밖 사업장이 403이 아니라 `200` + 빈 목록인 서버 동작(B-9)을 mock에서도 재현해야 ① 021의 사업장 선택이 dev에서 눈에 보이고 ② "`siteSeq` 없이 조회 → 정상 응답인 빈 화면" 함정이 드러난다. 테스트로도 고정했다(사업장 전환 시 목록이 바뀜 / `siteSeq` 없으면 요청 0건)
- MSW가 **필터·페이징을 실제로 구현**한다(`searchKey`·`authMethod`·`useYn`·`pageNumber`·`pageSize`). 전량 반환으로 때우면 Phase 6의 검증 기준을 세울 수 없다. `pageNumber=0` → 400, 초과 → 빈 items + 요청값 에코까지 실측대로 재현
- mock 데이터에 **경계 케이스를 심었다** — 미사용 지점 1건(`pointSeq 9`, OQ-022-G를 눈으로 보려고) · 미순찰 1/3(`lastPatrolDt: null` 경로) · 소속 코스 0건/1건/2건
- **계획 외 수정 2건**(둘 다 제약 2를 깨지 않는 범위)
  - `ZoneRow`의 `isActive`를 **선택(optional)** 으로 바꿨다. `DetailPoint.courseList`가 `{ courseSeq, courseName }` 만 주고 **코스 활성여부를 주지 않는다** — 모르는 값을 `true`로 채우면 활성인 것처럼 보인다(A1). 생략 시 중립(테두리) 점으로 그리고, 실제 값은 `spec 023`에서 채운다
  - `AuthMethodDisplay`의 prop을 `PointAuthenticationMethod | null`로 **넓혔다**. 미실측 코드(9·10 외)면 `toAuthMethodLabel`이 `null`을 주는데, 그걸 받아 **양쪽 비강조**로 그리는 것이 맞다. 🔴 정수로 바꾼 것이 아니므로 제약 2 위반이 아니고 테스트 3건도 그대로 통과한다
- 🔴 **OQ-022-I를 잠정 처리했다** — "생성일" 행을 제거하고 **최근 순찰**(`lastPatrolDt` + `lastPatrolUserName`)로 대체했다. 서버에 `createdAt`이 없다. 날짜 포맷은 `parseISO` + `isValid` 로 깨진 값도 `'-'`로 수렴시킨다. **생성일이 실제로 필요하면 백엔드 요청 대상**이다(B4) — 사용자 판단 필요
- 상세에 **사용여부 행을 추가**했다(`useYn`). 폼에 `useYn`이 들어오는데(Phase 4) 상세에서 확인할 수단이 없으면 저장 결과를 볼 수 없다
- 소속 코스 **0건 안내**를 넣었다. 기존에는 데모 상수 2건이 항상 떠 있어 0건 상태가 존재하지 않았다
- 로딩·실패·0건 상태를 `PointList` 안으로 모았다. 🔴 **실패와 0건을 다르게 그린다** — 둘 다 "아무것도 없음"이면 장애를 데이터 없음으로 오해해 지점을 새로 만들려 한다
- 첫 행 자동 선택을 **파생**으로 했다(`items.find(selected) ?? items[0]`). effect+setState 면 "로딩 완료 → setState → 재렌더" 한 박자 동안 우측이 빈 상태로 깜빡인다. 부수효과로 **선택한 지점이 목록에서 사라지면 자동으로 첫 행으로 떨어진다** — Phase 5의 삭제 후 처리와 Phase 6의 필터 이탈 처리가 이 파생에 얹힌다
- ⚠️ **브라우저 시각 검증(M2) 미수행** → T278(Phase 7)로 이월. 자동 테스트가 MSW로 같은 경로를 덮지만, 레이아웃·로딩 스켈레톤·뱃지 색은 눈으로 봐야 한다. Phase 4·5가 같은 화면을 더 바꾸므로 한 번에 보는 편이 낫다
- 다음: Phase 4(T260~T264) — 추가(POST) + 스키마·폼 정합. 🔴 **내부 순차**(제약 4) — 스키마만 바꾸고 멈추면 typecheck red

### Phase 4 완료 — 추가(POST) + 폼 정합 (2026-10-07)

- T260~T264 완료. 신설 1파일(`AddPointForm.test.tsx`) + 기존 6파일 수정
- `npm run verify` **0 errors** + `npm run test` **47 files / 372 tests green**(362 → **+10**)
- ✅ **제약 4가 실제로 발동했다.** `schema.ts`에 `useYn`을 넣는 순간 `EditPointForm`의 `defaultValues`가 타입 에러가 났다. 같은 Phase 안이라 바로 닫았다 — `pointFormDefaults` 공용 상수를 만들어 두 폼이 공유한다. **`EditPointForm`은 여전히 빈 값에서 시작**하며(수정 폼인데 기존 값이 안 들어온다) 그 해소는 Phase 5(T266)다. 주석에 명시해 뒀다
- 🔴 **복붙 결함을 고쳤고, 그것이 실제로 기능을 죽이고 있었음을 테스트로 고정했다.** `AddPointForm:46·64`가 `description`·`nfcTagId` 자리에 `errors.name?.message`를 넣고 있었다 → **14자리 HEX 검증 메시지가 화면에 뜰 자리가 없었다.** T260의 정규식을 넣어도 보이지 않는 상태였으므로 둘은 한 작업이어야 했다(계획대로)
- **NFC 형식 검증을 refine 2개로 분리했다.** "비어 있음"(기존)과 "형식 틀림"(신규)을 한 refine에 합치면 빈 값일 때 두 메시지가 경쟁한다. 형식 refine은 **값이 있을 때만** 본다
- ⚠️ **NFC TAG ID 대소문자를 변환하지 않는다.** 서버가 대문자만 받는지 미실측이고, 실측 없이 값을 바꾸면 **사용자가 입력한 것과 저장된 것이 달라진다**(A1). 정규식은 양쪽을 허용한다 — 실 서버 검증 시 확인 대상에 추가
- `AppDialog`가 **이미 `open`/`onOpenChange`를 지원하고 있었다**(`:16-17`). 제어형 전환에 컴포넌트 수정이 필요 없었다 — `PointTopNav`에서 state만 들었다. 닫기 권한은 부모가 갖고 폼은 `onSuccess`만 알린다
- `AppIconButton`에 `aria-label="지점 생성"`을 넣었다. 아이콘만 있는 버튼이라 접근 가능한 이름이 없었고, 테스트에서 고를 수단도 없었다
- 🔴 **계획 외 조치 1건 — `src/test/setup.ts`에 `ResizeObserver` stub 추가.** radix `Switch`(지점사용 토글)가 thumb 크기 측정에 `ResizeObserver`를 쓰는데 jsdom에 없어 **렌더 즉시 `ReferenceError`로 10건이 전부 죽었다.** 017이 radix `Select` 때문에 `hasPointerCapture`·`scrollIntoView`를 stub한 것과 같은 환경 공백이라 같은 자리에 같은 방식으로 넣었다(측정값 단언이 없어 no-op으로 충분)
- 🔴 **MSW 저장소 리셋 함수(`resetPointStore`)를 export했다.** `server.resetHandlers()`는 핸들러만 되돌리고 모듈 스코프 배열은 건드리지 않아, 추가·삭제 테스트가 뒤 테스트의 목록 건수를 바꿔 **순서 의존 flaky**가 된다. 021 제약 1에서 `clearTokens()` 누설로 같은 종류의 문제를 겪었다
- 전송 바디를 **핸들러로 가로채 `toEqual`로 전량 비교**했다. `siteSeq`·`useYn`·정수 `authMethod` 중 하나만 빠져도 서버가 거부하거나 **엉뚱한 사업장에 들어가는데**, 부분 단언이면 누락을 못 잡는다
- 다음: Phase 5(T265~T270) — 수정(PATCH)·삭제(DELETE). 🔴 T266~T269가 `PointDetail.tsx` 한 파일을 만져 **병렬 금지**

### Phase 5 완료 — 수정(PATCH) · 삭제(DELETE) (2026-10-08)

- T265~T270 완료. 신설 2파일(`EditPointForm.test.tsx` · `PointDetail.test.tsx`) + 기존 5파일 수정
- `npm run verify` **0 errors** + `npm run test` **49 files / 390 tests green**(372 → **+18**). 기존 테스트 깨짐 **0건**
- 🔴 **수정 폼이 드디어 기존 값에서 시작한다.** 022 전까지는 수정 폼인데 빈 값으로 열려, 한 필드만 고치려 해도 나머지가 빈 값으로 덮였다. 상세 응답을 `defaultValues` 로 주입했다
- 🔴 **`pointSeq` 고정 장치는 `useState` 초기값이다.** 모달이 열린 채 뒤쪽 목록은 클릭 가능해서 `point` prop 이 바뀔 수 있다. `useState(point.pointSeq)` 는 첫 렌더에서만 읽히고, 모달은 닫힐 때 언마운트되므로 다음 열림에 새 값이 들어온다. 테스트에서 **prop 을 바꿔 다시 렌더한 뒤 저장**해 `pointSeq` 가 불변임을 고정했다 — 이것 없이는 저장이 엉뚱한 지점에 적용된다
- 🔴 **계획에 없던 분기를 하나 발견했다 — 미실측 인증수단 코드.** `toAuthMethodLabel` 은 9·10 외에 `null` 을 주는데(A1), 폼 enum 은 `'QR' | 'NFC'` 뿐이다. 임의로 `'QR'` 을 채우면 **사용자가 고르지 않은 인증수단으로 저장된다.** `undefined` 로 둬 **미선택 상태**로 열고 사용자가 고르게 했다. 이 경로가 처음 생겨 `schema.ts` 의 enum 에 한글 메시지를 붙였다(기본 영문 메시지가 화면에 뜬다)
- **삭제 확인 모달은 제어형으로 만들지 않았다.** 수정 모달은 "성공해야 닫는다"(입력값 보존)지만, 삭제 확인에는 잃을 입력이 없고 거부 사유는 전역 토스트가 전달한다. `AppAlertDialog` 에 닫기 제어를 추가하는 것은 얻는 것 없이 계약만 늘린다(A6)
- 🔴 **삭제 거부 시 `onDeleted`·무효화를 **둘 다** 부르지 않는다.** 성공 경로에만 뒀다. 거부인데 선택이 풀리면 **삭제되지 않은 지점을 잃은 것처럼 보인다.** 테스트 3건으로 고정했다(선택 유지 / 무효화 0회 / 상세 카드에 사유를 직접 그리지 않음 — 전역 토스트와 중복 금지, 규칙 3)
- **선택 해제를 무효화보다 먼저 한다.** 목록이 먼저 갱신되면 사라진 지점을 선택한 채 상세를 재조회해 "찾을 수 없음" 이 한 번 깜빡인다
- **삭제 후 선택 해제는 Phase 3의 파생에 얹혔다.** `PointsPage` 가 `setSelectedSeq(null)` 만 하면 `activeSeq` 파생이 첫 행으로 떨어뜨린다 — 별도 로직이 없다
- MSW `UpdatePoint` 는 **받은 필드로 전부 덮는다.** PATCH 지만 부분 갱신으로 처리하지 않았다 — 필드 생략 시 서버가 "변경 없음" 으로 보는지 미실측이고, mock 이 먼저 굳히면 실 서버와 달라진다(A1). `authMethod` 가 NFC 로 바뀌면 `qrCode` 를 지운다(인증수단과 `qrCode` 가 어긋난 상태를 저장소에 남기지 않는다)
- ⚠️ **삭제 거부는 가정이다**(OQ-022-B, 사용자 확인 2026-10-08 "이대로 진행"). mock 은 `usedCount > 0` 지점을 거부하고 **UI 경로만 확보**했다. 실측에서 거부가 없으면 핸들러의 그 분기를 지운다 — 프론트는 거부 **문구에 의존하지 않는다**(019 `ApiError` 정규화가 형태를 흡수)
- **계획에서 빼기로 한 것 1건** — 삭제 확인 모달에 "순찰코스 N개에 편성된 지점입니다" 안내를 넣었다가 **되돌렸다.** 요청 범위 밖이고(A3), 규칙 14의 "`usedCount` 선제 차단 금지" 경계에 가깝다. 필요하면 별도로 판단
- ⚠️ **브라우저 시각 검증(M2) 미수행** → T278(Phase 7) 유지. Phase 3·4에서 이월된 것과 한 번에 본다
- 다음: Phase 6(T271~T275) — 검색·필터·페이지 이동. 🔴 **클라이언트 필터 함수가 0건**이다(규칙 8) — 전부 서버 위임

---

## 다음 spec으로 이월 (WF-5에서 확정)

> 착수 전 시점에 이미 확정된 이월 항목만 적어 둔다. 구현 중 발견분은 WF-5에서 추가한다.

### 🔴 사용자 판단 3건 — **실 API 응답 확인 후 확정**(2026-10-08 결정)

브라우저로 Phase 1~5를 돌려보고 추려낸 것. 세 건 모두 **서버가 무엇을 주는가에 답이 달려 있어**, 실 API 응답을 보고 한 번에 정한다. 그때까지 현재 잠정 상태를 유지한다.

| # | 판단 지점 | 현재 잠정 상태 | 실 API에서 볼 것 |
|---|---|---|---|
| 1 | **미사용 지점 목록 표시** (OQ-022-G) | ✅ **해소(2026-10-08)**. 실측: **서버가 목록에서 제외하지 않는다** — `useYn: false` 로 만든 지점이 필터 없는 조회에 그대로 내려온다. 따라서 구분은 프론트 책임. **회색 처리만**으로 구현(사용자 결정) — 행에 이미 인증수단 뱃지가 있어 뱃지를 더하면 340px 에서 이름이 더 잘린다. 🔴 `design-system.md` §3 "색만으로 상태 전달 금지" 때문에 `sr-only` "(미사용)" 을 함께 뒀다(시각 변화 0). 테스트 4건 고정 | — |
| 2 | **생성일(`createdAt`) 필요 여부** (OQ-022-I) | ✅ **해소(2026-10-08)**. 실측: `GetPointList`·`DetailPoint` **둘 다 `createdAt` 계열 필드가 없다.** 현재 처리(행 제거 + 최근 순찰 대체) **유지 확정**. 생성일이 업무상 필요하면 백엔드 추가 요청 — 사용자 판단 | — |
| 3 | **삭제 전 사전 안내** (OQ-022-B) | **없다.** 확인 모달은 "지점을 삭제하시겠습니까?" 뿐이고, 거부 사유는 시도 후 전역 토스트로만 나온다. ⚠️ Phase 5에서 "순찰코스 N개에 편성된 지점입니다" 안내를 구현했다가 **범위 밖(A3)·규칙 14 경계**라 되돌렸다 | 서버가 `usedCount > 0` 지점을 **실제로 거부하는가**. 거부하면 사전 안내(또는 버튼 비활성)가 정당해지고, 거부하지 않으면 안내 자체가 **틀린 정보**가 되어 넣으면 안 된다 ⚠️ **2026-10-08: 보류 확정.** Phase 8의 쓰기 범위를 "생성한 지점만"으로 합의해, 코스에 편성된 기존 지점으로 거부를 시험하지 않는다 — 거부되지 않으면 실 지점이 삭제된다. 코스 편성 API(`spec 023`)가 들어온 뒤 테스트 지점을 직접 편성해 확인한다 |


- [x] ✅ **해소(2026-10-08) — Phase 8 로 수행.** 실 서버 검증 — 020·021 이월 5건 + 022 몫을 한 세션에 묶어서 → 사내망에서 `npm run dev:real`. 022 몫: ① **OQ-022-A** 변경계에 "HTTP 200 + 실패 `code`"가 있는가(Add/Update/Delete 각각) ② **OQ-022-B** `usedCount > 0` 지점의 `DeletePoint` 거부 여부와 응답 형태 ③ 유효성 400이 ProblemDetails로 오는지 ④ `AddPoint` 성공 응답이 생성된 `pointSeq`를 주는지
- [x] 🔴 **재해석(2026-10-08) — OQ-022-C.** 기존 지점에 GPS 좌표가 실제로 들어있는데 `authMethod` 는 9·10 뿐이고, 좌표 없이 생성·수정해도 정상이다 → GPS 는 **3번째 인증수단이 아니라 지점의 부가 속성**일 가능성이 높다. **인증수단 3종 추가는 하지 않는다**(근거 소멸). 남은 질문은 "좌표를 프론트에서 입력받아야 하는가" 이며 목업·업무 요구가 없어 **별도 판단**
- [ ] **OQ-022-D QR 다운로드 + `reissueQrYn`** → 별도 spec. QR 렌더링 라이브러리 선정·DOM→이미지 변환·파일명 규칙·재발급 UI를 함께
- [ ] **OQ-022-E 목록 페이지 이동 UI 배치** → 필터 UI가 들어간 뒤 재검토(T274에서 확정하지 않았다)
- [x] ✅ **해소(2026-10-08) — OQ-022-G.** 서버가 미사용 지점을 목록에서 제외하지 않음을 실측 → 구분은 프론트 책임. **회색 처리**로 구현(뱃지 추가 안 함 — 340px 폭) + `sr-only` "(미사용)"(design-system §3)
- [ ] **OQ-022-H 구 `PointType` 중복 제거** → `spec 023`(순찰코스)에서 `features/zone`과 함께. 참조 3곳: `patrol-points/types/PatrolPoint.ts:1`·`zone/types/point.ts:1`·`zone/form/AddPointForm.tsx:11`
- [x] ✅ **해소(2026-10-08) — OQ-022-I.** 목록·상세 실응답 모두 `createdAt` 계열 필드가 **없음을 확인.** "제거 + 최근 순찰 대체" **유지 확정**. 업무상 필요하면 백엔드 추가 요청(사용자 판단)
- [x] ✅ **해소(2026-10-09, `spec 027` Phase 3)** — ⚠️ 실제 문제는 더 심각했다: `strict` 적용 여부가 아니라 **`npm run typecheck`(`tsc --noEmit`)가 아무것도 검사하지 않고 있었다.** 루트가 `files: []` + `references` 구조라 비-build 모드는 참조 프로젝트를 건드리지 않는다. `tsc -b` 로 바꾸니 **에러 5건**(기존 3 + 신규 2)이 드러났고 전부 고쳤다. ~~`tsconfig.json`의 `"strict": true`가 `src`에 미적용~~ → 별도 spec(021 이월 유지). 022가 파일을 늘렸으므로 켤 때 고칠 양이 더 늘었다
