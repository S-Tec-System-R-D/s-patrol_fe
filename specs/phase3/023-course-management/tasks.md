# 023-course-management tasks

> 입력: [`spec.md`](./spec.md) (위험도 **A** — 5축 풀 작성, **A구조**: API 전환 + 화면 재구성 동시)
> 선행: `spec 027`(목록/상세 분리 패턴 · `AppFilterPopover` · `useQueryParams` · 라우트 빌더 — 전부 승계)
> 태스크 ID는 027(T305~T340)에 이어 **T341**부터

---

## ⚠️ 분할 순서를 좌우한 제약 (착수 전 확인 — 전부 코드 실측)

**다섯 가지가 순서를 강제했다.**

1. 🔴 **현재 `/zones` 는 전부 mock 위다 — 어댑터로 이을 수 없고 교체한다.**
   `ZoneTreeData`(`features/zone/mocks/zoneData.ts`) 하나에 `ZoneSideBar` · `ZoneTree` · `ZoneNode` · `PointNode` · `ZoneTopNav` · `PointCard` · `ActiveMenu` · 폼 4종이 매달려 있다. 그리고 `ZoneType`(`id: string` · `createdAt: Date` · `isRotation` · `isActive` · `points[].timeLimit`)은 서버의 `CourseRow`/`CourseDetail`(`courseSeq: number` · `switchYn` · `useYn` · `courseMin` · `orderNo` · `coursePointSeq`)과 **이름·타입·개수가 전부 다르다.** `CLAUDE.md` B4 어댑터 조건 3개(목록↔상세 차이 · 정수 enum · 포맷 차이) 중 **해당하는 것이 없다** → 어댑터를 만들지 않고 **서버 타입으로 갈아탄다.**

2. 🔴 **Phase 2를 쪼갤 수 없다 — 목록·라우트·상세 골격이 한 묶음이다.**
   목록을 테이블로 바꾸면 행 클릭이 **갈 곳**을 필요로 하고, 상세 라우트가 생기면 좌측 트리(`ZoneSideBar`)가 **중복**이 된다. 셋 중 하나만 하면 Phase 종료 시점에 화면이 깨진다(027 제약 1과 같은 논리).

3. 🔴 **`CourseDiagramCard` 는 살리고 prop 타입만 바꾼다.**
   테스트 **5건**이 걸려 있다. `ZonePointType[]` → `CourseDetail['points']`로 바뀌면서 참조 필드가 `timeLimit`→`courseMin`, `isActive`→`useYn`으로 변한다. **파일을 지우지 않는다** — 지우면 다이어그램 계약 5건이 통째로 사라진다. `CourseTabs.test.tsx` **3건은 0건 영향**(027 T306에서 `end` 를 이미 제거해 뒀다).

4. ✅ **레거시 제거가 DoD #15(구 `PointType` 중복)를 절반 해결한다 — 예상 밖의 수확.**
   참조 3곳 중 **2곳이 삭제 대상 안에 있다**: `zone/types/point.ts:1` · `zone/form/AddPointForm.tsx:11`. 남는 것은 `patrol-points/types/PatrolPoint.ts:1` **하나**뿐이고, 이건 `/patrol/points` 가 쓰는 별개 화면이라 Phase 5에서 독립적으로 처리한다.

5. 🔴 **`dnd-kit` 이 설치돼 있지 않다.**
   `roadmap.md` §7 · `patterns.md` §5 · spec 규칙 7이 `dnd-kit` 을 지정하지만 `package.json` 에 **없다**(`recharts` 만 있다). Phase 4에 **신규 의존성 3패키지**(`@dnd-kit/core` · `@dnd-kit/sortable` · `@dnd-kit/utilities`) 도입 태스크가 필요하다 — 이것 때문에 Phase 4가 앞 Phase와 묶이면 안 된다.

6. 🔴 **편성 지점의 `useYn` 을 바꿀 수단이 없다** (Phase 1 에서 발견 — B-29 신설).
   `GetCourseDetail` 의 `points[].useYn` 은 내려오는데 **`UpdateCoursePointDto` 에 `useYn` 이 없다**(swagger 확인). 즉 지점별 활성은 **읽기 전용**이다 → T367 의 "지점별 활성" 을 **표시만** 으로 좁혔다. 토글을 만들면 저장해도 안 바뀌는, 027 이 걷어낸 "죽은 컨트롤" 과 같은 것이 된다.

7. ⚠️ **지점↔코스 mock 이 두 군데서 따로 산다.**
   `handlers/points.ts` 의 `COURSES_OF` 가 "지점 1·2 → 코스 1 / 지점 3 → 코스 1·2" 로 **고정**이고, 코스 저장소는 별개다. Phase 1 은 **시드를 서로 맞춰** 넘겼지만(코스 1·2 만 편성을 갖고 나머지는 0개), **T367 에서 편성을 편집하면 어긋난다** — 지점 목록의 `usedCount` 와 코스의 `pointCount` 가 다른 말을 한다. 🔴 **T367 에서 한 출처로 합친다**(지점 핸들러가 코스 저장소를 읽게).

### 🔴 Phase 4는 백엔드 답변을 **기다리지 않는다** (계획 수정)

WF-1-0 이전 계획은 Phase 4를 "백엔드 답변 후"로 뒀다. **실측 후 설계가 결함 3개를 전부 흡수했으므로 그 대기가 사라졌다**:

| 결함 | 현재 설계 | 대기 필요? |
|---|---|:-:|
| B-27 `AddCourse.points` 무시 | **애초에 보내지 않는다**(규칙 9) | ✗ |
| B-25 `UpdateCourse.points` 전체 교체 | **전량 전송을 규약으로 고정**(규칙 3) | ✗ |
| B-28 `courseSeq` 누락 → 401 | **타입에서 required**(규칙 4) | ✗ |

⚠️ **단 하나의 조건부**: B-24(`UpdateCourse` → PATCH)가 수용되면 `points` 의미가 함께 바뀌므로 **규칙 3을 재검토**한다(OQ-023-E). 그때 손댈 곳은 `api/updateCourse.ts` 한 자리다 — 지금 기다릴 이유가 되지 못한다.

### 명명 결정 — 라우트는 URL 이름, 도메인 모듈은 서버 이름

| 층 | 이름 | 사유 |
|---|---|---|
| 라우트·페이지 | `/zones` · `ZonesPage.tsx` · `ZoneDetailPage.tsx` | URL을 바꾸면 북마크와 `screens.md` §4 매핑이 깨진다. 리네이밍은 별건(B4 "리네이밍 대기") |
| 도메인 모듈 | **`features/courses/`** (`Course*` 타입) | 서버 응답이 메인이다(B4). `features/points` 와 1:1 대칭 |
| 레거시 | `features/zone/` **제거** | 셋째 이름을 남기지 않는다. `CourseTabs` 만 `features/courses/components/` 로 이설 |

**깨질 테스트 사전 계수**

| 파일 | 건수 | 시점 | 사유 |
|---|:-:|:-:|---|
| `CourseDiagramCard.test.tsx` | **5건 전부** | Phase 3 (T357) | prop 타입 전환 — 버리지 않고 **서버 필드로 재작성** |
| `CourseTabs.test.tsx` | **0건** | — | 🔴 027 T306에서 이미 손봤다. 건드리지 않는다 |
| 기타 `features/zone/**` | **0건** | — | 테스트가 **없다**(`ZoneSideBar`·`ZoneTree`·`PointCard`·폼 4종 전부 무테스트 — mock 셸이었다) |

**재사용 — 손대지 않는 것**

`components/app/*` 전부(`AppFilterPopover` · `AppTable` · `AppPagination` · `AppDialog` · `AppAlertDialog`) · `hooks/useQueryParams` · `hooks/useDebouncedCallback` · `lib/auth/site` · `features/points/**`(T370·T372 2곳 제외)

---

## Phase 0: WF-1-0 — 변경계 실측 선행 ✅ (2026-10-10 완료)

- [x] T341 🔴 변경계 3종 실측 in docs/api-spec.md §5-1-B — `AddCourse`·`UpdateCourse`·`DeleteCourse`. 생성→조작→삭제 **한 사이클**, 우리가 만든 것만 건드렸다(지점 2개 + 코스 1개 생성 후 전량 삭제). 결과 5건이 **설계를 바꿨다**(spec §0-1) + B-25·B-27·B-28 기록

## Phase 1: 타입 · api 6종 · queryKey · MSW (화면 변화 없음)

> **독립 테스트 기준**: 화면은 그대로인데 `features/courses/` 가 실 API를 호출할 준비가 끝났다. `queryKeys.test` · `courseListParams.test` green, MSW 핸들러 6종이 **실측 형태**로 응답한다. `npm run verify` 0 errors.

- [x] T342 타입 선언 in src/features/courses/types/{course,request,index}.ts — 🔴 **실측 그대로 전량**(B4): `CourseRow`(`history` 중첩 6필드 포함) · `CourseDetail` · `CourseDetailPoint`(`coursePointSeq` 포함) · `ClassificationPoint`. 요청: `AddCourseRequest`(🔴 **`points` 없음** — 규칙 9) · `UpdateCourseRequest`(🔴 `courseSeq` **required** — 규칙 4, 누락 시 401) · `DeleteCourseRequest`(🔴 `courseId`)
- [x] T343 api 6종 in src/features/courses/api/ — `getCourseList` · `detailCourse` · `getClassificationPoint` · `addCourse` · `updateCourse` · `deleteCourse`. 🔴 `getClassificationPoint` 는 **`PagedData` 가 아니라 배열 직접**(§5-2 14번) — 다른 5종과 언래핑이 다르다. 🔴 `deleteCourse` 에 **`courseId` 인 이유를 주석으로 못 박는다**(규칙 5 — 나머지가 전부 `~Seq` 라 틀리기 쉽다)
- [x] T344 queryKey + [P] vitest in src/features/courses/queryKeys.ts · src/features/courses/\_\_tests\_\_/queryKeys.test.ts — 루트 `'courses'`/`'course'`, **스코프(`siteSeq`) 포함**, 파라미터 객체 마지막(`data-model.md` §8). `features/points/queryKeys.ts` 와 같은 모양
- [x] T345 조회 훅 3종 in src/features/courses/hooks/{useCourseList,useCourseDetail,useClassificationPoints}.ts — 🔴 **`siteSeq` 없으면 조회하지 않는다**(`enabled`, spec 021 선례). ⚠️ 변경계는 훅으로 빼지 않는다 — 지점이 폼 안에서 `useMutation` 을 쓴다(선례 유지, A6)
- [x] T346 URL 파라미터 변환 + [P] vitest in src/features/courses/lib/courseListParams.ts · \_\_tests\_\_/ — `search`·`useYn`·`switchYn`·`status`·`page`. 🔴 **1-based ↔ 0-based 변환은 이 한 자리에서만**(027 규칙 8 승계)
- [x] T347 MSW 핸들러 6종 in src/mocks/handlers/courses.ts + src/mocks/handlers/index.ts — `resetCourseStore` 포함(022 선례). 🔴 **실측 동작을 그대로 흉내낸다**: `AddCourse` 는 `points` 를 **무시**하고 `pointCount: 0` 으로 만든다 / `UpdateCourse.points` 는 **전체 교체** / `courseSeq` 누락은 **401** / `DeleteCourse` 는 `courseId` 만 받는다. ⚠️ 서버 결함을 mock 에서 "고쳐 주면" 실제 전환에서 터진다
- [x] T348 코스 mock 데이터 in src/features/courses/mock/courseData.ts — 🔴 **지점 0개 코스 · 미사용 코스 · `history: null` 코스를 각각 하나씩** 넣는다. 전부 정상이면 빈 상태·톤다운·"순찰 기록 없음" 경로를 화면에서 볼 수 없다(027 T332 교훈)

### Phase 1 결과 (2026-10-11)

**`npm run verify` 0 errors** / **`npm run test` 496건 green**(451 → **+45**). 깨진 테스트 **0건**.

| 파일 | 건수 | 고정한 것 |
|---|:-:|---|
| `courses/__tests__/queryKeys.test.ts` | 8 | `siteSeq` 포함 · 상세는 `lists` 접두사에 안 걸림 · 편성 후보 키 분리 |
| `courses/lib/__tests__/courseListParams.test.ts` | 13 | URL 키 `status` → 서버 `courseStatus` · 🔴 상태 코드를 사전으로 검증하지 않음 · `pageNumber=0` → 1 수렴 |
| 🔴 `courses/api/__tests__/courseApi.test.ts` | **24** | **실측 결함 5건을 계약으로 고정** — 아래 |

🔴 **api 테스트는 태스크 목록에 없던 것을 추가했다.** Phase 1 종료 기준이 "핸들러가 **실측 형태로** 응답한다" 인데, 화면이 없는 단계에서 그것을 확인할 길이 달리 없었다. 고정한 실측 결함:

| 실측 | 테스트가 막는 것 |
|---|---|
| B-27 `AddCourse.points` 무시 | 타입을 **우회해** 보내 `pointCount: 0` 을 확인한다 — mock 이 친절해지면 깨진다. 깨지면 "생성 모달에서 지점을 묻지 않는다" 는 UI 결정의 근거가 사라진다 |
| B-25 `points` 전체 교체 | 빈 배열·일부 전송이 **나머지를 지우는 것**을 고정 — "변경분만 보내기" 를 도입하면 깨진다 |
| B-28 `courseSeq` 누락 → 401 | 타입 required 를 푸는 변경을 막는다 |
| B-12 `DeleteCourse` 는 `courseId` | 파라미터명이 `courseSeq` 로 바뀌면 깨진다 |
| OQ-9 상세에 `siteSeq` 없음 | `siteSeq` 를 응답에서 읽는 코드를 막는다(`getSiteSeq()` 로 보충해야 한다) |

⚠️ **mock 이 거른다는 사실이 실측을 대신하지 않는다** — 서버 필터 4종의 실제 동작은 여전히 T355 몫이다.

## Phase 2: US1 — 목록 전환 + 라우트 재구성 (🔴 한 묶음 — 제약 2)

> **독립 테스트 기준**: `/zones` 가 전체 폭 테이블이고 좌측 트리가 없다. 행을 누르면 `/zones/:courseSeq` 로 가고 **새로고침해도 유지된다.** 검색·필터·페이지가 **서버 파라미터로** 나가고 URL에 남는다. `npm run test` green.

- [x] T349 라우트 추가 in src/router/paths.ts · src/router/index.tsx — `courseDetail(courseSeq: number)` + `pathPatterns.courseDetail = '/zones/:courseSeq'`. 🔴 **`pointDetail`(`paths.ts:15,55`)과 같은 모양**으로. 새 관례를 만들지 않는다. ➕ **상세 최소 골격(`ZoneDetailPage.tsx`)까지 포함했다** — 라우트만 추가하면 행 클릭이 **갈 곳이 없어** Phase 2 종료 시점에 화면이 깨진다(027 T307 과 같은 처리). 다이어그램·섹션은 Phase 3, 버튼은 Phase 4
- [x] T350 [US1] 테이블 컬럼 팩토리 in src/features/courses/components/CourseColumn.tsx — **7컬럼**(코스명·상태·지점 수·총 소요시간·교대·최근 순찰·사용여부). 🔴 **상태 컬럼은 Phase 4 확인 후 제거됐다 → 6컬럼**(사용자 결정 2026-10-12, 아래 `Phase 4 사용자 확인 반영` 참조). 🔴 **`useMemo` 로 감싸 쓴다**(027 교훈 — 렌더마다 호출하면 `flexRender` 가 새 컴포넌트 타입으로 보아 행 전체가 리마운트된다). 🔴 미사용은 **행 전체 톤다운**(`rowClassName`, 027 승계). ⚠️ `courseStatusName` 을 그대로 쓴다 — 코드 사전이 불완전하다(OQ-3)
- [x] T351 [US1] `CourseTabs` 이설 in src/features/courses/components/CourseTabs.tsx — 테스트 3건과 함께 그대로 옮긴다. 🔴 **내용을 고치지 않는다**(제약 3)
- [x] T352 [US1] 🔴 목록 페이지 전면 재작성 + **레거시 제거** in src/pages/service/zones/ZonesPage.tsx — `AppTable` + `hidePagination` + 외부 `AppPagination`(`pageSizeOptions=[20,50,100]` — 🔴 **서버 기본값 20이 옵션에 있어야 셀렉트가 비지 않는다**, 027 교훈). 🔴 **제거**: `ZoneSideBar` · `zone-tree/{ZoneTree,ZoneNode,PointNode}` · `ZoneTopNav` · `PointCard` · `point-card/ActiveMenu` · `form/{AddZoneForm,EditZoneForm,AddPointForm,EditPointForm}` · `mocks/zoneData.ts` · `types/{zone,point,index}.ts` (제약 1·4)
- [x] T353 [US1] 필터 · 검색 · URL 연결 in src/features/courses/components/{CourseFilters,CourseTopNav}.tsx · ZonesPage.tsx — `AppFilterPopover` 3종(사용여부·교대·상태) + 검색(**300ms 디바운스**). 🔴 **"전체" 는 URL에 남기지 않고**, 필터 변경 시 **첫 페이지 복귀**, `replace` 를 쓰지 않는다(🔴 027 실측: `replace` 면 필터 걸고 뒤로가기 시 **이전 화면으로 튄다**). 🔴 **클라이언트 필터 함수 0건**
- [x] T354 [US1] [P] vitest in src/features/courses/components/\_\_tests\_\_/CourseColumn.test.tsx · src/pages/service/zones/\_\_tests\_\_/ZonesPage.test.tsx — 🔴 **서버로 나간 쿼리를 가로채** 확인한다(화면만 보면 누가 걸렀는지 알 수 없다, 027 교훈) / 행 클릭 → 라우트 이동 / 좌측 트리 없음 / **로딩 ≠ 0건 ≠ 실패 셋 구분**(DoD #14)
- [x] T355 🔴 서버 필터 4종 실측 확인 (real 모드) — `searchKey`·`useYn`·`switchYn`·`courseStatus` 가 **실제로 걸리는지**. ⚠️ 규칙 8이 "서버가 제공한다" 고 전제하지만 **지점에서만 확인했다**(Phase 8 R2). 걸리지 않으면 **클라이언트 필터가 아니라 백엔드 요청**으로 간다

### Phase 2 결과 (2026-10-11)

**`npm run verify` 0 errors** / **`npm run test` 534건 green**(496 → **+38**). 깨진 테스트 **0건**.

| 파일 | 건수 | 내용 |
|---|:-:|---|
| `courses/components/__tests__/CourseColumn.test.tsx` | 13 | 7컬럼 · `history: null` → "기록 없음" · 깨진 날짜 · 지점 0개에 경고 없음 · 상태 이름 공백이면 뱃지 숨김 |
| `pages/service/zones/__tests__/ZonesPage.test.tsx` | 19 | 사업장 스코프 · 행 클릭 이동 · **로딩 ≠ 0건 ≠ 실패** · 서버 쿼리 가로채기 · URL 보존 |
| `pages/service/zones/__tests__/ZoneDetailPage.test.tsx` | 6 | URL 직접 진입 · 없는 `courseSeq` 가 `/404` 아님 · 숫자 아닌 세그먼트 |

🔴 **`/zones` 는 011 이후 테스트가 0건이었다**(mock 셸). 이번이 이 화면의 **첫 테스트**다.

**제거한 레거시 14개 파일** — `ZoneSideBar` · `zone-tree/{ZoneTree,ZoneNode,PointNode}` · `ZoneTopNav` · `PointCard` · `point-card/ActiveMenu` · `form/{AddZoneForm,EditZoneForm,AddPointForm,EditPointForm,schema}` · `mocks/zoneData.ts` · `types/zone.ts`.
⚠️ **`features/zone/` 이 완전히 사라지지는 않았다** — `CourseDiagramCard` + 그 테스트 5건 + `types/point.ts` 가 남는다. 다이어그램을 서버 타입으로 바꾸는 **T357(Phase 3)에서 함께 정리**되고, `types/index.ts` 에 그 사실을 적어 뒀다.

✅ **DoD #15 가 2/3 해소됐다** — 구 `PointType` 참조 3곳 중 `zone/form/AddPointForm.tsx` 가 삭제됐다. 남은 둘은 T357·T370.

### 🔴 T355 실측 결과 — 필터는 전부 서버가 거른다

⚠️ **실 서버 사업장 7·8 에 코스가 0건**이라 측정할 데이터가 없었다 → 테스트 코스 2개를 만들어 재고 **끝에 전부 삭제**했다(기존 데이터 무접촉).

| 호출 | 결과 |
|---|---|
| `useYn` · `switchYn` | ✅ 각각 걸린다 |
| `useYn=true&switchYn=false` | ✅ **AND** 로 좁혀진다 — OR 가 아니다 |
| `searchKey=미사용` | ✅ **부분 일치** |
| `courseStatus=1`·`2` | **0건**(에러 아님) — OQ-3 그대로. 그래서 **상태 필터를 UI 에 넣지 않았다**(→ 2026-10-12 **상태 컬럼까지 제거**, OQ-3 종결) |
| `pageNumber` 범위 초과 | 200 + 빈 items + 요청값 에코 / `pageSize=0` 은 **400** |
| 지점 0개 코스 상세 | `points: []`. 🔴 `siteSeq`·`courseStatusCode`·`pointCount` **없음**(OQ-9 재확인) |

→ **클라이언트 필터 0건의 근거가 코스에서도 확보**됐다. 🔴 측정 뒤 코드 주석의 "미실측" 3곳을 **실측 결과로 교체**했다 — 남겨 두면 다음 사람이 확인된 사실을 다시 재는다.

## Phase 3: US2 — 상세 **조회** (읽기 전용 — 변경계 없음)

> **독립 테스트 기준**: `/zones/:courseSeq` 에 브레드크럼·코스명·상태 뱃지·경로 다이어그램·지점 순서 카드가 있다. 지점 0개 코스는 **빈 상태**("준비 중" 아님)를 보여준다. 없는 `courseSeq` 는 안내 + 목록 복귀. 버튼은 아직 **없거나 비활성**이다.

- [x] T356 [US2] 상세 페이지 골격 ✅ **Phase 2 에서 선행 완료**(행 클릭이 갈 곳이 필요했다) in src/pages/service/zones/ZoneDetailPage.tsx — `useParams` → `useCourseDetail`. 브레드크럼(`코스/지점 › 코스 상세`) + `AppPageHeader`(`icon`/`titleSuffix` 로 상태 뱃지) — 🔴 **`PointDetailPage` 와 같은 조립**(027 승계). 🔴 없는 `courseSeq`(400) → **안내 + 목록 복귀, `/404` 로 보내지 않는다**(DoD #13)
- [x] T357 🔴 다이어그램 이설 + 타입 전환 in src/features/courses/components/detail/CourseDiagramCard.tsx — `ZonePointType[]` → `CourseDetail['points']`. 참조 필드 교체: `timeLimit`→`courseMin` · `isActive`→`useYn` · `name`→`pointName`. 🔴 **테스트 5건을 버리지 않고 서버 필드로 재작성**한다(제약 3)
- [x] T358 [US2] 지점 순서 카드 — **읽기 전용** in src/features/courses/components/detail/CoursePointList.tsx — `orderNo` 순 + 구간시간 + 지점별 사용여부. 🔴 지점 0개면 **빈 상태 + "지점 추가" 유도** — ⚠️ **"준비 중" 이 아니다**(기능은 있고 데이터가 없다, 027 placeholder 규약). 편집 수단은 Phase 4
- [x] T359 [US2] 기본정보 섹션 in src/features/courses/components/detail/CourseInfo.tsx — 코스명·설명(`memo`)·총 소요시간·교대 허용·사용여부·지점 수. ⚠️ **`siteSeq` 는 응답에 없다**(OQ-9) → `getSiteSeq()` 로 보충하고 **그 사실을 주석에 남긴다**(Phase 4의 `UpdateCourse` 가 요구한다)
- [x] T360 [US2] [P] vitest in src/pages/service/zones/\_\_tests\_\_/ZoneDetailPage.test.tsx · src/features/courses/components/detail/\_\_tests\_\_/ — URL 직접 진입으로 상세가 뜬다 / 지점 0개 빈 상태 / 🔴 **없는 `courseSeq` 가 `/404` 로 가지 않는다** / 다이어그램 순서

### Phase 3 결과 (2026-10-11)

**`npm run verify` 0 errors** / **`npm run test` 561건 green**(534 → **+27**). 깨진 테스트 **0건**.

| 파일 | 건수 | 내용 |
|---|:-:|---|
| `detail/__tests__/CourseDiagramCard.test.tsx` | 9 (5→9) | 🔴 **011 판 5건을 서버 필드로 재작성** + 모르는 인증수단 코드 숨김 + **설명을 그리지 않는 것** |
| `detail/__tests__/CoursePointList.test.tsx` | 11 | `orderNo` 정렬 · 빈 상태 ≠ "준비 중" · **편집·토글·메모가 없는 것** |
| `detail/__tests__/CourseInfo.test.tsx` | 9 | 사업장명이 **021 저장값**에서 오는 것(OQ-9) · 설명 빈 값이 정상인 것 · 코스명 행 없음 |
| `ZoneDetailPage.test.tsx` | 9 (6→9) | 섹션 3개 **조립** · 지점 0개 코스 · 설명 중복 없음 |

✅ **`features/zone/` 이 완전히 사라졌다**(파일 0개). 구 `PointType` 참조는 **1곳**(`patrol-points`)만 남아 T370 몫이다.

### 🔴 Phase 3 에서 또 하나 — B-30 (구간 메모는 쓰기 전용)

다이어그램을 전환하다 **설명 줄의 출처가 없다**는 것을 발견했다. 실측으로 확인했다(코스 생성 → 지점 2개 편성(`memo` 포함) → 상세 조회 → 삭제):

| | |
|---|---|
| `UpdateCourse` 에 `points[].memo` 전송 | **200** — 받아들인다 |
| `GetCourseDetail` 의 `points[]` | 🔴 **`memo` 필드가 없다** — 저장한 값을 다시 읽을 수 없다 |
| 겹치는 위험 | **전량 전송 규약**(B-25)과 만나 매 저장마다 `memo: null` 이 나간다 → 다른 경로로 들어간 메모가 **조용히 지워진다** |

**대응**: 다이어그램의 **설명 줄을 없앴다**(추측으로 빈 자리를 두지 않는다 — A1). 대신 **"설명을 그리지 않는다" 를 테스트로 고정**했다 — 빼면 나중에 누가 빈 자리를 채우려 쓰기 전용 필드를 읽고 늘 `undefined` 를 그린다. T367 에 "구간 메모 UI 를 만들지 않는다" 를 명시했다.

### 중복 표시를 두 군데서 걷어냈다

구현 중 **같은 값이 한 화면에 두 번** 나오는 자리가 둘 생겼고, 둘 다 뺐다 — 사용자는 둘이 다른 값인지 확인하려 눈을 왕복한다.

| 중복 | 처리 |
|---|---|
| 설명 — 제목 아래 `subtitle` + 기본정보 행 | **기본정보에만** 남김 |
| 코스명 — 페이지 제목 + 기본정보 행 | **제목에만** 남김(수정 모달에는 당연히 들어간다) |

🔴 두 번째는 **테스트가 먼저 잡았다** — `findByText('A동 순찰코스')` 가 다중 일치로 터져 6건이 실패했다. 화면만 봤으면 "두 번 나오네" 하고 넘어갈 수도 있었다.

⚠️ **T373(공용 셸 승격)의 증거 1건 추가**: 라벨 고정폭 상세 행이 이제 **두 feature 에 있다**(`points/DetailRow` + `courses/CourseInfo.InfoRow`). 공용 `AppDetailRow` 는 **`justify-between` 판**이라 전체 폭 페이지에서 쓸 수 없다(027 이 지점에서 버린 바로 그 모양) — 승격 시 그 둘을 합치는 문제를 함께 풀어야 한다.

## Phase 4: 🔴 US3·US4·US5 — CRUD + 지점 편성 (위험도 A 본체)

> **독립 테스트 기준**: 생성·수정·삭제·편성·토글이 전부 동작한다. 🔴 `AddCourse` 에 **`points` 가 나가지 않고**, `UpdateCourse` 에 **`points` 가 전량 나간다.** 토글 2종이 **확인 모달**을 거치고 **문구가 다르다.**
>
> ✅ **백엔드 답변 대기 없음** — 상단 표 참조. B-24 수용 시에만 규칙 3 재검토(OQ-023-E).

- [x] T361 [US3] 코스 생성 모달 in src/features/courses/form/{AddCourseForm,schema}.ts(x) — 🔴 **명칭·설명만**(규칙 9). `points` 를 보내지 않는다 — 보내도 무시되고 **성공 응답이 와서 조용히 반쪽**이 된다(B-27). 🔴 생성 후 **상세로 보내지 않는다**: `AddCourse` 가 `courseSeq` 를 주지 않고, 이름으로 찾으면 **동명 코스에서 엉뚱한 곳으로** 간다(§4) → **목록 재조회**. ⚠️ 생성 전용 목업이 없다(OQ-023-A) → 구현 후 사용자 확인
- [x] T362 [US2] 기본정보 수정 모달 in src/features/courses/form/EditCourseForm.tsx — 명칭·설명. 🔴 **`points` 를 전량 함께 보낸다**(규칙 3 — 전체 교체이므로 생략하면 **지점이 전부 지워진다**). 🔴 **지점의 교훈을 옮기지 않는다**: `memo: null` 은 코스에서 **반영된다**(`UpdatePoint` 는 무시, B-15 — 규칙 6)
- [x] T363 [US2] 삭제 in ZoneDetailPage.tsx — `AppAlertDialog`. 🔴 **`courseId`** 로 보낸다(규칙 5). 🔴 **성공 → 목록 복귀 / 실패 → 머문다** — 거부인데 화면이 바뀌면 삭제된 것으로 오해한다(027 교훈). 테스트에서 **실패 시 `navigate` 가 불리지 않는 것**을 명시 고정
- [x] T364 [US5] 🔴 토글 2종 확인 모달 in src/features/courses/components/detail/CourseToggleDialog.tsx — **둘 다 모달, 문구 다르게**(사용자 결정, 규칙 11). 활성화 OFF: 🔴 **문구가 틀렸다 → 2026-10-12 교정**("코스 목록에서 숨겨져, 더 이상 이 코스로 순찰을 시작할 수 없습니다") / 교대 허용: 담백한 확인. 🔴 **옵티미스틱을 쓰지 않는다** — 모달로 의도를 확인했으므로 응답을 기다린다(둘은 양립 불가). ✅ **OQ-023-F 해소(2026-10-12)**: 배정이 아니라 **근무자가 직접 고른다** — 처음 문구는 실제로 틀린 경고였다
- [x] T365 `dnd-kit` 도입 in package.json — `@dnd-kit/core` · `@dnd-kit/sortable` · `@dnd-kit/utilities`. 🔴 **설치돼 있지 않다**(제약 5). `roadmap.md` §7 · `patterns.md` §5가 지정한 것이고 **새 라이브러리를 고르지 않는다**(규칙 7)
- [x] T366 [US4] 지점 추가 UI in src/features/courses/components/detail/AddCoursePointDialog.tsx — ⚠️ **OQ-023-C 결정 지점**: `GetClassificationPoint` 는 **페이징이 없어 전량 내려온다** → 후보가 많으면 검색이 필요하다. **모달 + 검색 입력**으로 간다(상세 안 인라인은 다이어그램·순서 카드와 폭을 다툰다). 🔴 **이미 편성된 지점은 후보에서 제외**
- [x] T367 [US4] 🔴 편성 — 드래그 정렬 · 구간시간 · 제거 in src/features/courses/components/detail/CoursePointEditor.tsx — `dnd-kit` `SortableContext`. 🔴 **저장은 `UpdateCourse` 에 `points` 전량 전송**(규칙 3) — "변경분만 보내기" 를 만들지 않는다. 기존 행은 **`coursePointSeq`** 로 식별한다. 🔴 **`orderNo` 를 다시 1..N 으로 매긴다**(드래그 후 번호가 비면 서버 순서가 무너진다). 🔴 **지점별 활성(`useYn`)은 표시만 한다** — 요청 DTO 에 필드가 없어 **바꿀 수단이 없다**(B-29, 제약 6). 🔴 **구간 메모(`memo`)를 UI 에 만들지 않는다** — 쓰기 전용이라 저장해도 다시 읽을 수 없고, 전량 전송과 겹쳐 **다른 경로로 들어간 메모를 지운다**(B-30). 전송 시 기존 값을 알 수 없으므로 `memo: null` 이 나가는 것을 **알고도 보내는 것**임을 코드 주석에 남긴다. 🔴 **mock 단일 출처 작업 포함**: `handlers/points.ts` 의 `COURSES_OF` 를 코스 저장소에서 파생시킨다(제약 7)
- [x] T368 [US4] 실패 복구 — 🔴 **드래그 중 저장 실패 시 순서를 원복**한다(§4 — 화면만 바뀌면 다음 조회에서 되돌아가 혼란스럽다). 전량 전송이라 실패는 **부분 반영 없이 전무**다 → 화면 상태를 유지하고 재시도하게 한다. 🔴 **지점 0개가 되어도 자동 조치를 하지 않는다**(규칙 12 — 비활성화·저장 차단·경고 배너 **어느 것도**)
- [x] T369 [US3·US4·US5] [P] vitest — 🔴 **`AddCourse` 요청 바디에 `points` 키가 없는 것** / 🔴 **`UpdateCourse` 에 지점 전량이 나가는 것**(하나만 바꿔도) / `courseSeq` 가 반드시 포함되는 것 / `DeleteCourse` 가 `courseId` 로 나가는 것 / 토글 모달 **문구 2종이 다른 것** / 모달 취소 시 **아무 요청도 안 나가는 것** / 드래그 후 `orderNo` 재부여 / 저장 실패 시 순서 원복

### Phase 4 결과 (2026-10-12)

**`npm run verify` 0 errors** / **`npm run test` 648건 green**(561 → **+87**). 깨진 테스트 **2건 → 교체**(아래).

| 파일 | 건수 | 고정한 것 |
|---|:-:|---|
| 🔴 `lib/__tests__/updateCourseBody.test.ts` | **10** | **`points` 를 넘기지 않으면 전량이 실리는 것** · `courseSeq` 항상 포함 · `memo: null`(비움) ≠ `undefined`(유지) · `totalMin` 항상 `null` |
| 🔴 `lib/__tests__/coursePointOrder.test.ts` | **12** | **드래그 후 `orderNo` 1..N 재부여** · 제거 후 번호에 구멍 없음 · 새 행은 `coursePointSeq: null` · 같은 지점 두 번도 `key` 가 겹치지 않음 |
| `form/__tests__/AddCourseForm.test.tsx` | 12 | 🔴 **바디에 `points` 키가 없는 것**(B-27) · `totalMin: null` · 실패 시 입력값 유지 |
| `form/__tests__/EditCourseForm.test.tsx` | 8 | 🔴 **코스명만 바꿔도 지점 2개가 전량 나가는 것**(B-25) · 설명 비움이 `null` 로 나가는 것 |
| `detail/__tests__/CourseToggleDialog.test.tsx` | 7 | 🔴 **문구 4종이 서로 다른 것** · 교대 쪽은 효과를 말하지 않는 것(A1) · 취소 시 무동작 |
| `detail/__tests__/CoursePointEditor.test.tsx` | 16 | 추가·제거·구간시간 · 🔴 **저장 실패 시 초안 유지 + 안내** · 취소가 원복 · 지점 0개에 경고·차단 없음 |
| `detail/__tests__/AddCoursePointDialog.test.tsx` | 9 | 🔴 **편성된 지점 제외** · 0건 3종 구분(지점 없음 / 전부 편성 / 검색 0건) · 다건 선택 |
| `detail/__tests__/CourseInfo.test.tsx` | 11 (9→11) | 🔴 **스위치가 값을 바꾸지 않고 확인을 요청하는 것**(옵티미스틱 금지) |
| `detail/__tests__/CoursePointList.test.tsx` | 13 (11→13) | `onEdit` 없으면 읽기 전용 그대로 · 행에 조작 수단 없음 |
| `ZoneDetailPage.test.tsx` | 18 (9→18) | 🔴 **삭제가 `courseId` 로 나가는 것**(B-12) · **실패 시 머무는 것** · 토글이 모달을 거치는 것 · **토글 저장에도 지점 3개 전량이 나가는 것** |

🔴 **깨진 테스트 2건은 전부 "Phase 4 에서 깨지도록 쓴" 것이다** — `ZonesPage` 의 "생성 버튼을
아직 두지 않는다" 와 `ZoneDetailPage` 의 "변경계 버튼을 아직 두지 않는다". 둘 다 **없음을
확인하던 단정을 있음·동작 확인으로 교체**했다. 이렇게 깨지는 테스트는 사고가 아니라
**Phase 경계가 지켜졌다는 신호**다.

### 🔴 실측 먼저 — B-31 (`totalMin` 은 검증되지 않는다)

편성 편집을 만들기 전에 **"구간시간을 고치면 총 소요시간은 누가 계산하는가"** 를 모르면
코드를 쓸 수 없었다(A1). 코스 1개를 만들어 `UpdateCourse` 를 다섯 번 바꿔 보내고 매번 상세로
읽은 뒤 삭제했다(`api-spec.md` §5-1-B).

| 보낸 것 | 결과 | 쓴 곳 |
|---|---|---|
| `totalMin: 99` / 합 25 | 🔴 **99 가 저장된다** — 검사하지 않는다 | B-31 등재 |
| `totalMin: null` | ✅ **서버가 합으로 채운다** | **항상 `null` 을 보낸다** |
| `orderNo` 둘 다 `1` | 🔴 **그대로 저장된다** | 1..N **재부여는 우리 책임** (T367) |
| 같은 `pointSeq` 두 번 | 🔴 **통과한다** | 중복 제외는 **화면 규칙**이라고 명시 (T366) |
| `coursePointSeq` 실어 보냄 | ✅ 행이 유지된다(실으면 유지, `null` 이면 새 행) | 기존 행 식별 근거 |

→ **"총 소요시간" 입력란을 어디에도 만들지 않았다.** 파생 값인데 입력란을 두면 지점 합과
다른 값을 쓸 수 있고(서버가 막지 않는다) **화면의 숫자가 거짓이 된다.**

### 계획과 다르게 간 것 — 편성은 **편집 모드**다

T367 은 "드래그 정렬" 만 적었고 §4 는 "실패 시 순서 원복" 을 요구했다. 상시 드래그 + 즉시
저장으로 만들면 **둘이 충돌한다** — 그래서 **명시적 편집 모드**(저장/취소)로 갔다.

| 이유 | |
|---|---|
| 전량 전송 | 드래그마다 PUT 이면 지점 5개 재배치에 **전량 교체가 네 번** |
| 구간시간 | **타이핑**이라 자동 저장과 맞지 않는다(글자마다 PUT) |
| §4 원복 | **취소가 원복이다.** 실패 시에는 초안을 유지하고 **"저장되지 않았다" 를 화면에 남긴다** — 전량 전송이라 **부분 반영이 없으므로** 서버는 저장 직전 그대로다. 말없이 서버 값으로 되돌리면 방금 한 작업이 **설명 없이 사라진다** |

그래서 `CoursePointList`(읽기 전용, `onEdit` 버튼 하나)와 `CoursePointEditor`(편집 모드)가
**둘 다 남았다** — 같은 목록을 두 번 그리는 중복으로 보이지만, 조회 화면과 편집 화면의
관심사가 다르고 Phase 3 의 테스트 11건이 그대로 살아 있다.

⚠️ **드래그 자체는 jsdom 에서 시험하지 못한다** — `dnd-kit` 이 `getBoundingClientRect` 로
레이아웃을 재는데 jsdom 에서는 전부 0 이라 센서가 움직이지 않는다. 그래서 순서 계산을
**순수 함수로 꺼내**(`lib/coursePointOrder.ts`) 12건으로 고정했고, 실제 드래그는 **T377
브라우저 확인** 몫으로 남겼다. 🔴 **컴포넌트 안에 두었으면 테스트할 길이 없는 로직이었다.**

### ✅ 제약 7 해소 — mock 이 한 출처가 됐다

`handlers/points.ts` 의 고정 배분 함수(`COURSES_OF`)를 지우고 `handlers/courses.ts` 가
`coursesOfPoint(pointSeq)` 를 **코스 저장소에서 파생**해 내보낸다. `MockPoint` 의
`courseList` 필드도 **지웠다** — 두 출처를 남기면 편성을 바꾼 뒤 지점 목록의 `usedCount` 가
옛 값으로 남아 **한 화면에서 둘이 다른 말을 한다.**

### 남긴 것

- `patterns.md` §10(인라인 토글 = 옵티미스틱)과 **어긋난다** — 확인 모달과 양립 불가다.
  갱신은 T374.

## Phase 4 사용자 확인 반영 (2026-10-12)

> 사용자가 Phase 1~4 전 항목을 브라우저로 직접 확인했다(체크리스트 38항목). 그 결과
> **결함 1건 · 틀린 문구 1건 · 설계 변경 3건**이 나왔고 아래가 그 처리다.

### 🔴 결함 — mock 이 새 편성 행에 **같은 `coursePointSeq`** 를 줬다

| | |
|---|---|
| 증상 | 지점 0개 코스에 **지점 2개를 추가해 저장**한 뒤 **하나를 제거하면 둘이 함께 사라진다** |
| 원인 | `handlers/courses.ts` 의 `coursePointSeq: … ?? nextCoursePointSeq()`. 이 함수는 `store` 의 최대값+1 을 세는데, 호출 지점이 **`store[index]` 대입 전의 `.map()` 안**이라 루프 내내 같은 값을 돌려줬다 → 새 행 전부가 같은 번호를 받았다 |
| 왜 화면이 깨지는가 | 드래그 id 가 `cp-{coursePointSeq}`(`coursePointOrder.ts`)다. id 가 겹치면 제거·이동이 **같은 key 를 가진 행 전부**에 적용된다 |
| 범위 | 🔴 **mock 전용이다.** 실 서버는 새 행마다 다른 번호를 준다(Phase 4 실측에 이미 기록돼 있었다) — mock 이 실 서버보다 **틀렸던** 경우다 |
| 처리 | 번호를 `.map()` **밖에서** 하나씩 발급(`let allocated = nextCoursePointSeq()` → `allocated++`) |

🔴 **테스트 648개가 전부 통과하면서 이걸 놓쳤다.** 원인은 기존 테스트(`courseApi.test.ts`
"새 편성 행은 `coursePointSeq` 없이 보낸다")가 **새 행을 1개만** 넣었기 때문이다 — 1개일 때는
중복이 생기지 않는다. **"한 번에 2개"** 를 넣는 회귀 테스트를 같은 파일에 추가했고, mock
수정을 되돌려 **실제로 실패하는 것을 확인한 뒤** 고정했다.

> 교훈: **"새로 생기는 것" 은 1개가 아니라 2개로 시험한다.** 1개짜리 테스트는 식별자
> 발급의 유일성을 검사하지 못한다.

### ✅ OQ-023-F 해소 — 비활성화 문구가 **틀렸다**

사용자 업무 확인: **코스는 관리자가 근무자에게 배정하는 것이 아니라, 근무자가 앱에서
본인이 돌 코스를 직접 고른다.**

| | 틀린 문구(Phase 4) | 고친 문구 |
|---|---|---|
| 비활성화 | 근무자 앱에서 이 코스의 순찰이 더 이상 **배정되지 않습니다** | 근무자 앱의 **코스 목록에서 숨겨져, 더 이상 이 코스로 순찰을 시작할 수 없습니다** |
| 활성화 | 이 코스가 순찰 대상으로 다시 포함됩니다 | 근무자 앱의 **코스 목록에 다시 노출됩니다** |

- `CourseInfo` 풋터에 **"근무자가 앱에서 순찰 시작 시 이 코스를 직접 선택합니다."** 를 넣어
  두 토글의 근거를 화면에 남겼다.
- 테스트도 뒤집었다: 비활성화 문구에서 **`/배정/` 이 나오지 않는 것**을 단정한다.
- ✅ **"효과를 단정하는 문장을 한 곳에 모아 둔다" 는 Phase 4 의 판단이 값을 했다.** 업무
  확인 결과가 틀렸을 때 고칠 자리가 `copy()` 한 곳이었다 — 문구를 여러 컴포넌트에
  흘렸다면 일부만 고쳐져 **화면마다 다른 말을 하는** 상태가 됐을 것이다.
- ⚠️ 교대 허용 쪽은 **여전히 효과를 말하지 않는다**(A1) — 그쪽은 확인되지 않았다.

### 설계 변경 3건

| | 변경 | 사유 |
|---|---|---|
| 1 | 목록 **상태 컬럼 제거** (7컬럼 → **6컬럼**) | 실시간 진행 상황은 **별도 페이지**로 만들기로 했다(사용자). 목록에서 상태를 읽을 이유가 사라졌다 → ✅ **OQ-3 · OQ-023-B 종결**(코드 사전을 몰라 막혀 있던 값이 **쓸 자리가 없어져** 풀렸다). 응답 타입에는 실측대로 남긴다 |
| 2 | 교대 `-` → **`허용 안 함` 뱃지** | 한 열에 뱃지와 하이픈이 섞여 **빈 칸처럼 읽혔다.** 구분은 variant(`success`/`muted`)가 준다. Phase 2 의 "켜진 것만 표시" 판단을 뒤집은 것이다 |
| 3 | "코스를 찾을 수 없습니다" 에 **`코스 목록으로` 링크** | 브레드크럼 첫 조각이 목록 링크를 겸하지만, **못 찾은 화면에서는 빠져나갈 길로 읽히지 않았다.** 🔴 기존 테스트가 브레드크럼 링크만 보고 통과시켰다 → 단정을 **안내 블록 안으로** 좁혔다 |

### OQ-027-D 방향 확정

좁은 폭 전략은 **② 카드형 목록**이다(사용자 2026-10-12). ① 컬럼 숨김 우선순위는 **버린다.**
구현은 이 spec 범위가 아니며, 코스·지점 두 목록에 같은 방식으로 적용한다.

### 체크리스트에서 드러난 **내 실수** 2건

- `GetClassificationPoint` 의 "응답이 배열이다 / 페이징이 없다" 를 **mock 모드 확인
  항목으로 적었다.** mock 응답은 우리가 만든 것이라 **순환 논리**다 — 그 근거는 실 서버
  실측(`api-spec.md` §5-2)이고 이미 기록돼 있었다.
- MSW 는 서비스워커로 가로채므로 **DevTools 에 응답 바디가 남지 않는다.** 바디를 봐야 할
  때는 콘솔에서 직접 호출한다(`fetch` 도 MSW 가 가로챈다).

## 코스 상세 UI 재설계 (목업 `코스상세-신규.html`, 2026-10-12)

사용자가 새 상세 목업을 추가했다. 목업과 실측을 대조해 **4단으로 쪼갰고, A단만 이 spec
에서 한다.** 나머지는 선행 조건이 다르다.

### 🔴 대조에서 드러난 것 — 내 앞선 판정 2건이 틀렸다

| 처음 판정 | 실제 | 근거 |
|---|---|---|
| "지점에 좌표 필드가 아예 없다" | ❌ **있다.** `PointDetail.gpsLat/gpsLng` · `GetCourseHistoryCheckDetails` 둘 다 실측돼 있다. 없는 것은 **`GetCourseDetail.points[]`** 뿐이다 | `api-spec.md:577` |
| "코스 기준 이력 조회 API 가 없다" | ❌ **있다.** `GetCourseHistory` 가 **`courseSeq` 파라미터를 받는다**(+ `fromDt`/`toDt`/페이징). `GetPointHistory` 는 `courseSeq`+`pointSeq`+`status` 까지 받는다 | swagger 실측 |

⚠️ **코드베이스를 보고 API 를 판단했다**(프론트에 lat/lng 참조 0건 → "없다"). 그건 **우리가
안 쓴다**는 뜻일 뿐이다. 응답 스펙은 `api-spec.md` 가 SSOT 다(`CLAUDE.md` B4).

그 결과 **지도·순찰 기록·KPI 가 전부 사정권에 들어왔다** — 처음 평가("별도 spec, 백엔드
선행 다수")보다 훨씬 가깝다.

### 4단 분할

| 단 | 내용 | 선행 |
|:-:|---|---|
| **A** ✅ | 2열 골격 전환 · 헤더(요약 뱃지 · 편성 편집 승격) · 기본정보 효과 한 줄 | 없음 — **완료** |
| **B** | 최근 순찰 기록 카드 + KPI 2종(수행 횟수 · 평균 소요) — `GetCourseHistory(courseSeq)` | ✅ **전제 확인됨**(아래) |
| **C** | 미인증 집계 · 지점별 인증률 · 이상 이력 — `GetPointHistory(courseSeq, status)` | ✅ 같음 |
| **D** | 순찰 동선 **지도** | **B-32**(좌표 필드) + **B-33**(좌표 유효성) |
| 보류 | 코스 코드 · 복제 · 등록/수정 메타 | 업무 결정 / API 없음 / B-19 |

🔴 **B·C 는 전부 클라이언트 집계다.** 서버에 집계 엔드포인트가 없어 행을 받아 더한다
(30일이면 코스당 수십 행이라 `pageSize` 를 키운 1~2 요청으로 된다). 화면에 "서버가 계산한
수치" 로 보이게 쓰면 안 된다.

🔴 **B·C 는 `spec 025`(코스이력)의 API 를 먼저 쓰는 것이다.** 경계를 정하지 않으면 같은
집계를 두 번 짓는다 — 착수 전에 025 와의 분담을 정한다.

### ✅ B~D단 전제 실측 (2026-10-12, 읽기만)

`api-spec.md` **"좌표·순찰 이력 데이터 유무"** 블록이 전문이다. 요지:

- **이력은 사업장 6 에 46건** 모여 있고 **7·8 은 0건**이다. 🔴 현장관리자 `333333` 의 소속이
  7·8 이라 `npm run dev:real` 로는 이력 화면을 **볼 수 없다** — **시스템관리자 `000000` 으로
  로그인해 사업장 6** 을 골라야 한다. mock 시드도 이력 있는 코스를 만들어 둬야 한다.
- **좌표는 실제로 채워진다**(사업장 6: 14건 중 13건, 모바일 앱 동기화로 보인다). 사용자
  추측이 맞았다 — D단은 **필드 요청 1건(B-32)** 이 유일한 벽이다.
- 🔴 **실데이터가 목업 가정을 깬다**: `userList: []`(근무자 없는 이력), `status: 완료` 인데
  `checkedCount: 0`(**완료 ≠ 전 지점 인증**), `actualElapsedTime: "02:17:40"`(시 단위).
  B단 설계는 이 세 경우를 **빈 상태·독립 표시·시간 환산**으로 받아야 한다.
- 🔴 **쓰레기 좌표**(`lat: 123`)와 **`null` 좌표**가 섞여 있다 → **B-33** 등재. 지도는
  범위 검사 + "좌표 없는 지점" 처리를 프론트가 떠안는다.
- 테스트 좌표가 **반경 수십 m 에 몰려** 있어 핀이 겹친다 — 줌·클러스터링 판단 필요.

### A단 결과

| 변경 | 내용 |
|---|---|
| 2열 골격 | 다이어그램이 전체 폭 → **좌측 열 안으로**(동선 → 순서), 우측 1/3 = 기본정보. 우측은 C단에서 이상 이력이 쌓일 칸이다 |
| 🔴 **목업과 다른 한 곳** | 목업은 **지점 순서를 우측 1/3** 에 두었으나 **좌측 2/3** 에 두었다 — 편성 편집의 **드래그가 여기서 일어난다.** 1/3 폭에 핸들·구간시간·제거를 한 줄로 놓으면 답답하다. 이유가 상호작용이라 목업을 따르지 않았다(사용자 결정) |
| 헤더 요약 뱃지 | `지점 3개 · 45분`. ⚠️ `pointCount` 가 상세 응답에 없어 **편성 배열의 길이**로 센다 |
| 편성 편집 **승격** | 카드 안 → **헤더**. 변경 수단 셋(편성 편집·수정·삭제)이 한 줄에 모였다. 🔴 `CoursePointList` 의 `onEdit` prop 을 **없앴다** — 같은 모드로 들어가는 길이 두 곳이면 어느 쪽이 정식인지 알 수 없다. 편집 중에는 헤더 버튼을 **감춘다**(편집 모드에 자기 저장·취소가 있다) |
| 기본정보 효과 한 줄 | 코스 활성화에만 `· 앱 코스 목록에 노출`. 🔴 **교대 허용은 비워 뒀다** — 효과가 업무 확인 전이다(A1). `ToggleValue.hint` 는 선택 prop 이다 |
| 메타줄 | **만들지 않았다**(사용자 결정) — 지금 넣을 수 있는 값이 사업장명뿐이고 기본정보에 이미 있다. B-19 가 오면 그때 한 번에 만든다 |

지점 순서 **행 디자인은 손대지 않았다** — 목업의 보조줄(`1F · 로비 서측`)과 인증률은 둘 다
데이터가 없고, 번호 뱃지·이름·인증수단 뱃지·구간시간은 이미 목업과 같다(A3).

테스트 **648 → 654**(+6): 헤더 4건(요약 뱃지·0개 코스·수단 3종·편집 중 숨김), 기본정보
2건(효과 한 줄 유무·직접 선택 안내). `CoursePointList` 의 편집 진입 테스트 3건은
**읽기 전용 단정으로 교체**했다.

## Phase 5: 027 이월 6건 + 공용 셸 승격 판단

> **독립 테스트 기준**: 027이 넘긴 6건이 처리되었거나 **처리하지 않은 사유가 적혀 있다.** 셸 승격은 **결론이 나 있다**(뽑았거나, 뽑지 않기로 하고 사유를 남겼다).

- [ ] T370 🔴 구 `PointType` 중복 제거 마무리 in src/features/patrol-points/types/PatrolPoint.ts — ✅ **2곳은 T352에서 이미 사라졌다**(제약 4). 남은 한 곳만 `features/points/types` 로 수렴. DoD #15
- [ ] T371 `ZoneRow` 코스 활성여부 (027 이월 2) — ⚠️ **막힐 수 있다**: 지점 상세의 `courseList` 는 `{courseSeq, courseName}` **둘뿐**이라 `useYn` 이 없다. 코스 목록 조회와 조합하거나(요청 1건 추가) **백엔드에 필드 요청**한다. 🔴 **중립 점을 그대로 두는 것도 결론이다** — 027이 "의미 없는 점" 이라 했으니 **제거**가 더 정직할 수 있다. 판단 후 사유 기록
- [ ] T372 지점 상세 2건 (027 이월 3·4) in src/features/points/components/detail/{PointDetail,ZoneRow}.tsx — **"코스에 추가" 버튼 활성화**(이제 `UpdateCourse` 가 있다) + **소속 코스 → `/zones/:courseSeq` 링크**. DoD #16
- [ ] T373 🔴 공용 셸 승격 판단 (OQ-023-D) — 후보 3종: 목록 셸 · 상세 셸 · `useListQueryParams`. 코스가 **두 번째 사례**다. ⚠️ **뽑지 않는 결론도 정당하다** — 코스 상세는 다이어그램·드래그가 있어 지점 상세와 모양이 꽤 다르다. 🔴 **어느 쪽이든 사유를 적는다**(DoD #17 — 판단을 내리는 것이 조건이고, 뽑는 것이 조건이 아니다)
- [ ] T374 `patterns.md` §10 갱신 — 코스 활성화·교대 허용이 **인라인 옵티미스틱 → 확인 모달**로 이동(027 이월 6). 🔴 **옵티미스틱과 확인 모달이 양립 불가인 이유**를 적는다 + §5 드래그 · §13 필터 팝오버 참조 갱신

## Phase 6: Polish

- [ ] T375 [P] 로딩 상태 3종 구분 점검 — 목록·상세·변경 각각. 🔴 **`AppTable` 은 행 0개면 "데이터가 없습니다" 를 그린다** — 조회 중에 그것이 뜨면 코스가 없다고 믿고 새로 만든다(027 T324에서 실제로 터진 퇴행). 스켈레톤으로 막고 **테스트로 고정**. DoD #14
- [ ] T376 🔴 `npm run capture` baseline 재촬영 in docs/ui-current/ — `현장/zones--목록+다이어그램` **1장 → 2장**(`zones--목록` · `zones--상세`) + e2e 스크립트에 상세 경로 추가 + **나머지 무변화 확인**. ⚠️ **다섯 번째 같은 자리다** — 🔴 재촬영 전 scratchpad 스크립트로 먼저 확인하고, **바이트 비교로 회귀를 판단하지 않는다**(Chromium 비결정성 ±1%, 027 기록)
- [ ] T377 브라우저 확인(MSW) — 목록·상세·생성·수정·삭제·편성·**드래그**·토글 모달 2종 + **분할화면**. ⚠️ **real 모드는 의미가 제한적이다** — 실 서버 사업장 7·8에 지점이 거의 없어 편성 화면이 빈다(Phase 8 R2 실측). ✅ OQ-027-D **방향 확정(2026-10-12)**: 좁은 폭은 **카드형 목록**이다(컬럼 숨김은 버린다). 목록은 **6컬럼**이 됐다(상태 제거)
- [ ] T378 [P] 문서 동기화 — `screens.md`(§1-3 코스 재구성 + **§4 에 `/zones/:courseSeq`**) / `flow.md` §0(목록→상세 전이) / `patterns.md`(T374) / `roadmap.md` §7-1·§12 / `data-model.md` §8(코스 `queryKey`). DoD #21
- [ ] T379 DoD 21개 대조표 작성 + 미충족 사유 명시 in specs/phase3/023-course-management/tasks.md

---

## Phase 요약

| Phase | 내용 | 백엔드 대기 | 종료 시 화면 깨짐 |
|:-:|---|:-:|:-:|
| **0** | WF-1-0 실측 3종 | — | ✗ (완료) |
| **1** | 타입 · api 6종 · queryKey · MSW | ✗ | ✗ |
| **2** | 목록 전환 + 라우트 재구성 (🔴 한 묶음) | ✗ | ✗ |
| **3** | 상세 **조회** — 다이어그램 읽기 전용 | ✗ | ✗ |
| **4** | 🔴 CRUD + 편성 · 드래그 · 토글 모달 | ✗ (계획 수정) | ✗ |
| **5** | 이월 6건 + 셸 승격 판단 | ◩ T371만 | ✗ |
| **6** | Polish · 캡쳐 · 문서 | — | ✗ |

**[P]** = 병렬 가능 · **🔴** = 틀리면 조용히 깨지는 지점 · **⚠️** = 미확정/제약
