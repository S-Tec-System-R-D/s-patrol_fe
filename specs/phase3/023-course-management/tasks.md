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
| **B** ✅ | 최근 순찰 기록 표 + KPI 4종(30일 수행 · 평균 소요 · 인증률 · 미인증) — `GetCourseHistory(courseSeq)` + `GetPointHistory(courseSeq, status=3)` | ✅ **완료 — 요청 0건** |
| **C** ✅ | 이상 이력 카드 — **사유 없이**(요청 0건, 두 응답에서 모음). ⏸️ **사유·첨부 썸네일은 보류** — 메모가 목록에 없어 행마다 상세 조회(N+1)이고, 내용이 "이상 사유" 가 아니라 **키워드 조합**이다 | ✅ **완료** / 사유는 `spec 025` 이력 상세에서 |
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

### B~D단 범위 확정 (2026-10-12, 사용자 결정 + 백엔드 전달)

**요청하지 않기로 한 것 3건** — 나중에 "왜 안 했지" 가 나오지 않게 사유를 남긴다.

| | 안 하는 것 | 사유 |
|---|---|---|
| 집계 API | 코스별 요약 응답(`Summary`) | **프론트에서 더한다.** 기간을 **30일 고정**으로 두면 코스당 수십 행이라 `pageSize` 를 키운 1요청으로 끝난다. 🔴 **6개월·1년 조회가 생기면 그때 요청한다**(그때는 전량 조회가 무너진다) |
| 지점별 집계 | `byPoint` 배열 / 지점별 인증률 | **지금 쓸 자리가 없다.** 목업의 지점 행 인증률(100/98/83%)은 만들지 않는다 |
| **이력 필터**(B-34) | `GetCourseHistory` 의 `status`·`overtimeYn` | ❌ **올렸다가 철회했다(2026-10-12).** `status` 는 **이미 있었고**(`eventType`), `overtimeYn` 으로 거르는 화면이 **코드·목업·결정 어디에도 없다**(확정된 필터는 기간·코스·결과 3종이고 결과는 `eventType` 이 덮는다). 🔴 **목업의 `지연` 뱃지를 보고 "보이면 걸러 보고 싶을 것" 이라고 추측한 요청**이었다 — A1 위반이고, `eventType` 이 이미 있다는 걸 알았을 때 **나머지 절반도 다시 세어 봤어야** 했다 |

**미인증 지점 이름(비고 칸)** — 요청하지 않고 **화면 설계로 피한다.**

⚠️ 정정: `GetCourseHistoryDetail` 에는 **지점 이름이 없다**(개수만: `totalPointCount`·
`completedPointCount`). 지점별 행은 **`GetCourseHistoryCheckDetails`** 에만 있다.

| 안 | 내용 | 판단 |
|---|---|---|
| **A** ✅ | 상태 뱃지만 표시, **비고 칸을 만들지 않는다.** 행 클릭 → 이력 상세는 `spec 025` 가 라우트를 정할 때 연결 | **채택.** 요청 1건으로 끝난다 |
| B | 완료가 아닌 행만 `CheckDetails` 추가 조회 | ❌ **최악이 전량 N+1 이고 그 최악이 일상이다** — 실측에서 사업장 2·3 의 최근 행이 **둘 다 `미완료`** 였다. 게다가 일부 행에만 비고가 붙어 표가 불균일해진다 |

⚠️ `/patrol/zones` 에 이력 화면이 **이미 있지만 mock 기반**이라(`features/patrol-zones`)
`historySeq` 가 맞지 않는다 — 링크는 025 가 실 API 로 전환한 뒤에 건다.

### ✅ 백엔드 전달로 풀린 것 3건 (2026-10-12)

| | 내용 |
|---|---|
| **OQ-5 해소** | `eventType` 은 **코스 상태 필터**다(`0` 진행중 / `1` 완료 / `2` 미완료). → 🔴 **상태 필터는 이미 있었다** — `B-34` 요청은 **통째로 철회됐다**(아래). 🔴 그리고 **`eventType=0` 이 "지금 순찰 중" 목록**이라, 사용자가 만들기로 한 **실시간 진행 페이지의 데이터 출처**가 확정됐다(코스 목록의 `courseStatusCode` 가 아니다 — 상태 컬럼을 뺀 판단이 맞았다) |
| **OQ-10 해소** | `memos` 구조 확정: `{ memoSeq, memo, attaches: { attachSeq, imagePath, fileName, fileExt }[] \| null }`. 🔴 **첨부 이미지가 달린다** → C단 이상 이력 카드에 **썸네일**이 생긴다(설계 범위 증가). ⚠️ 새 **OQ-13**: `imagePath` 가 절대 URL 인지 상대 경로인지 미확인 — 틀리면 **전부 깨진 썸네일** |
| **B-7 해소** | 두 사전이 다른 것은 **의도된 것**이다. 🔴🔴 **지점 상태에 `순찰제외`(2)가 있다** — 이것이 가장 큰 발견이다(아래) |

### 🔴🔴 `순찰제외` 가 인증률 공식을 흔든다

지점 상태 전체: `0 대기중 · 1 진행중 · 2 순찰제외 · 3 미완료 · 4 완료`.

**순찰에서 빼기로 한 지점**이 `pointCount` 분모에 들어 있으면 **영원히 100% 가 안 되는
코스**가 생기고, 관리자는 매번 "누가 안 돌았나" 를 찾는다.

⚠️ **`pointCount` 가 순찰제외를 빼고 센 값인지 미확인**이고, **확인할 데이터가 없다**
(관측된 `CheckDetails` 3건은 전부 `status: 4`). → **B단 규약**: 인증률은 **서버가 준 두
수의 비**로만 적고, **100% 미달을 경고·빨간색으로 바꾸지 않는다.** 순찰제외 데이터가
생긴 뒤에 다시 본다.

### 백엔드 수정 대기 (2026-10-12 전달 완료, "조금 걸린다")

| | 내용 | 막히는 단 |
|---|---|---|
| **B-32** | `GetCourseDetail.points[]` 에 좌표 추가 | **D단** |
| **B-33** | 지점 좌표 범위 검증(`lat: 123` 이 저장돼 있다) | **D단** |
| B-4·B-5 | `overtimeYn`↔`overTimeYn` · `pauseTime` 타입 불일치 | 없음(프론트가 흡수 중) |
| 데이터 | 사업장 7 에 샘플 순찰 이력 | **real 확인 수단** — 지금은 시스템관리자 `000000` + 사업장 6 으로 본다 |

🔴 **B단은 이 중 아무것도 기다리지 않는다** — `GetCourseHistory(courseSeq)` 1요청 +
`GetPointHistory(courseSeq, status=3)` 1요청으로 전부 그린다.

### ✅ B단 결과 (2026-10-12)

최근 순찰 기록 표 + KPI 4종. **백엔드 요청을 하나도 기다리지 않았다** —
`GetCourseHistory(courseSeq, 30일)` 1요청 + `GetPointHistory(courseSeq, status=3)` 1요청.

| 새 파일 | 역할 |
|---|---|
| `types/history.ts` | 실측 타입 전량 + `POINT_HISTORY_STATUS`·`COURSE_HISTORY_STATUS` 사전 |
| `lib/elapsed.ts` | `'HH:mm:ss'` → 초 → 표시. 🔴 **시 단위**를 센다 |
| `lib/courseHistoryStats.ts` | 프론트 집계(평균·인증률·표본) |
| `lib/historyRange.ts` | 30일 구간. 🔴 `from ≤ to` 보장 |
| `api/getCourseHistory.ts` · `api/getPointHistory.ts` | 조회 2종 |
| `hooks/useCourseHistory.ts` | `useCourseHistory` · `useUncheckedCount` |
| `components/detail/CourseKpiRow.tsx` | KPI 4종(`AppKpiCard` 재사용) |
| `components/detail/CoursePatrolLog.tsx` | 기록 표 6열 |
| `mocks/handlers/history.ts` | `GetCourseHistory` + 실측 예외 시드 |

**화면 배치**: KPI 는 **헤더 바로 아래 전체 폭**(목업과 같다), 기록 표는 **좌측 열 맨
아래**(동선 → 편성 → 기록 = 현재에서 과거로).

#### 🔴 실측 예외를 설계에 박은 것 4건

| 실데이터 | 처리 |
|---|---|
| `userList: []` 인 이력 | 근무자 칸 `—`. 아바타를 **항상 그리지 않는다** |
| `status: 완료` + `checkedCount: 0` | 상태 뱃지와 인증(`0/3`)을 **따로** 적는다. "완료 = 3/3" 으로 묶으면 **없는 보장**을 화면이 약속한다 |
| `actualElapsedTime: "02:17:40"` | `toSeconds` 가 세 토막을 센다 — 분으로 읽으면 **2분**이 된다 |
| 소요시간을 읽을 수 없는 행 | 평균에서 **제외**한다(0 으로 섞으면 평균이 내려간다) |

#### 🔴🔴 인증률에 색을 입히지 않는다

지점 상태의 **`순찰제외`(2)** 때문이다. `pointCount` 가 그것을 빼고 센 값인지 미확인이고
확인할 데이터도 없다 — 순찰에서 빼기로 한 지점이 분모에 있으면 **영원히 100% 가 안 되는
코스**가 생기고, 빨갛게 칠하면 관리자는 매번 **없는 문제**를 찾는다. 반대로 **미인증
건수는 경고색을 쓴다** — 그건 서버가 `status=3` 으로 **직접 센** 값이다.

#### 🔴 빈 값을 0 으로 적지 않는다

이력이 없으면 평균·인증률은 `—` 다. `0분`·`0%` 로 적으면 "순찰했는데 결과가 0" 으로
읽힌다. 미인증 건수도 **조회 전이면 `—`**(0건으로 단정하지 않는다).

#### 🔴 "프론트가 더한 수치" 임을 화면에 적는다

기록 카드 아래 한 줄. 한 페이지(`pageSize: 100`)로 다 못 받으면 **"최근 N건 기준"** 까지
적는다 — 전체 기간 값으로 보이면 거짓이다.

#### 🔴 사고: 같은 엔드포인트에 핸들러를 두 번 선언했다

`GetPointHistory` 핸들러를 `handlers/history.ts` 에 새로 만들었는데, **`handlers/points.ts`
가 이미 소유**하고 있었다(지점 상세의 순찰 로그). MSW 는 **먼저 등록된 것만** 쓰므로 내
핸들러는 조용히 죽고 **미인증 건수가 0** 으로 왔다 — 에러가 아니라 "정상 응답인 빈 값"
이라 더 늦게 보였다.

→ **중복을 지우고 기존 핸들러를 확장**했다(`pointSeq` 를 선택으로 만들고 `courseSeq`·
`status` 필터 추가). 🔴 **실 서버에 엔드포인트가 하나면 mock 도 하나다** — 제약 7(지점
`usedCount` 의 두 출처)과 **같은 종류의 실수**이고, 이번엔 핸들러 층에서 났다.

⚠️ 그 덕에 미인증 건수가 **`coursesOfPoint` 파생**(단일 출처)이 됐다. 그래서 페이지
테스트는 **건수를 하드코딩하지 않고** "`—` 가 아니라 숫자가 온다" 만 고정한다 — 편성
시드를 건드릴 때마다 깨지지 않게.

테스트 **654 → 705**(+51): `elapsed` 13 · `courseHistoryStats` 11 · `historyRange` 5 ·
`CoursePatrolLog` 13 · `CourseKpiRow` 7 · `ZoneDetailPage` +4(배치·기간 필터·미인증·빈 상태).

### ✅ C단 결과 (2026-10-12) — 미인증·이상 이력, **사유 없이**

🔴 **요청이 늘지 않았다.** B단이 받아 둔 두 응답(`GetCourseHistory` 30일 ·
`GetPointHistory status=3`)에서 **모으기만** 한다(`lib/courseAlerts.ts`). 이상 이력 전용
엔드포인트는 없고, 있어야 할 이유도 없었다.

| 새 파일 | 역할 |
|---|---|
| `lib/courseAlerts.ts` | 두 응답 → 이상 이력 목록(순수 함수) |
| `components/detail/CourseAlertList.tsx` | 우측 열 카드(기본정보 **아래**) |

`useUncheckedCount` → **`useUncheckedPoints`** 로 바꿨다: `pageSize: 1` + `select` 로
`totalCount` 만 꺼내던 것을 **행까지** 받게 했다 — 유지하면 같은 조건으로 **두 번** 조회하게
된다.

#### 🔴 사유 문구를 만들지 않은 이유 (메모 구조·데이터가 **확인된 뒤에도**)

실측(2026-10-12)으로 메모가 **실제로 있고**(사업장 6 의 46건 중 14건) 구조도 확정됐지만,
그래도 붙이지 않았다:

1. 🔴 **메모는 목록에 없다.** `hasMemo: boolean` 뿐이고 내용은 `CheckDetails(historySeq)` /
   `PointHistoryDetail(detailSeq)` 에만 있다 → 이상 이력 10행이면 **요청 11회**(N+1).
   구조를 알게 된 것이 **이 비용을 바꾸지 않는다.**
2. 🔴 **메모 내용은 "이상 사유" 가 아니다.** 관측값이 `"[조명 고장] [누수]"` ·
   `"[키워드 관리]"` · `"새지점 인증"` · `"test"` 처럼 **앱에서 고른 키워드 조합 + 자유
   입력**이다. 목업의 `QR 스캔 없이 순찰 종료` 같은 설명문이 **이 필드가 아니다** — 그대로
   사유로 붙이면 **틀린 설명**이 된다(A1).

→ 그래서 **`메모` 뱃지만** 둔다: 기록이 있다는 **사실**은 전하고 내용은 이력 상세
(`spec 025`)에서 보게 한다.

#### 설계 판단 3건

| | 판단 | 이유 |
|---|---|---|
| 겹침 | 한 순찰이 **미완료이면서 초과**면 **두 건**으로 적는다 | 서로 다른 문제다("다 돌지 못했다" vs "오래 걸렸다"). 합치면 하나가 가려진다. 🔴 `key` 에 종류를 넣어 React 가 행을 잘못 재사용하지 않게 했다 |
| 초과 표시 | `2시간 18분 소요` 라고만 적고 **"기준 대비 +n분" 을 적지 않는다** | 기준(`totalMin`)은 **지금 값**이고 이력은 과거다. 편성을 바꾸면 **과거 순찰의 초과량이 따라 바뀌어** 거짓이 된다 |
| 0건 | **"최근 30일 동안 이상이 없습니다"** + 방패 아이콘 | 0건은 **좋은 상태**다. 빈 상태 일러스트·경고 아이콘을 쓰면 비어 있는 실패처럼 보인다 |

⚠️ 조회 중에는 **"이상 없음" 을 쓰지 않는다**(스켈레톤) — 거짓 안심을 준다.

테스트 **705 → 727**(+22): `courseAlerts` 12 · `CourseAlertList` 7 · `ZoneDetailPage` +3.

### 🔄 액션 배치 되돌림 (2026-10-12, 사용자 결정)

A단에서 변경 수단 셋을 **헤더로 모았던 것**을 **카드마다 하나씩**으로 되돌렸다.

| | A단 | 지금 |
|---|---|---|
| 편성 편집 | 페이지 헤더 | **지점 순서 카드 우측 상단** |
| 수정 | 페이지 헤더 | **기본정보 카드 우측 상단** |
| 삭제 | 페이지 헤더 | 페이지 헤더(유지) |

🔴 **A단에서 `onEdit` prop 을 없앴던 근거("같은 모드 입구가 두 곳이면 어느 쪽이 정식인지
알 수 없다")는 지금도 유효하다** — 다만 그 문제는 **헤더와 카드에 둘 다** 있을 때 생긴다.
**헤더에서 빼면서** 카드로 내렸으므로 입구는 여전히 **하나**다. 되돌린 것이 아니라 **소유자를
옮긴** 것이다.

🔄 **글자 버튼 → 아이콘 버튼으로 다시 바꿨다**(브라우저 확인, 사용자 결정): 글자 버튼이
카드 머리에서 **제목·건수와 무게를 다퉈** 카드가 시끄러웠다. 둘 다 **같은 `SquarePen`**
아이콘이다 — 뜻이 "이 카드를 편집한다" 로 같고, **한 카드에 하나뿐**이라 아이콘이 같아도
가리키는 대상이 섞이지 않는다. 🔴 **`aria-label` + `title` 로 이름을 남겼다**
(`지점 편성 편집` / `기본정보 수정`) — 아이콘만 두면 글자가 사라지므로 스크린리더와
마우스 양쪽에 같은 말을 준다. ⚠️ 지점 순서 카드 풋터의 "순서·구간시간은 **편성 편집**에서
바꿉니다" 는 이제 **툴팁에만 있는 이름**을 가리킨다 — 호버하면 같은 말이 나오므로 두되,
문구를 못 찾겠다는 말이 나오면 거기부터 손본다.

판단 근거: 고치려는 값을 **보여 주는 자리**에 버튼이 있는 쪽이 찾기 쉽다(목업의 기본정보
카드도 머리에 `수정` 을 두고 있다). 🔴 **삭제만 헤더에 남는다** — 코스 **전체**에 대한
동작이라 어느 카드에도 속하지 않고, 파괴적 동작을 편집 버튼들과 떼어 놓는 효과도 있다.

구조: `수정` 버튼은 `CourseInfo` 가 들고(`onEdit`), **모달·폼은 페이지**가 든다
(`trigger` 없는 제어형 `AppDialog`). 카드가 mutation 을 들면 `UpdateCourse` 전량 전송
규약(B-25)이 카드 안으로 새어 들어온다 — 토글을 `onRequestToggle` 으로 올려 보내는 것과
같은 이유다.

### 그 밖의 손질 2건

- **기본정보를 1열로** 했다. Phase 3 에서는 더 넓은 자리라 `xl` 2열이 유리했지만, A단에서
  **우측 1/3 칸**으로 들어가면서 2열이면 라벨·값이 둘 다 좁아져 값이 줄바꿈된다.
  A단 골격 전환 때 같이 고쳐야 했던 것이다.
- **"근무자가 앱에서 순찰 시작 시 이 코스를 직접 선택합니다" 를 뺐다.** 코스 활성화
  토글의 `· 앱 코스 목록에 노출` 과 확인 모달 문구가 **같은 사실을 이미 전하고**, 카드마다
  설명 한 줄을 붙이면 읽히지 않는 글이 쌓인다. ⚠️ **OQ-023-F 의 근거는 그대로 유효**하다
  (`CourseToggleDialog` 주석).

⚠️ **테스트 이름이 거짓이 될 뻔했다.** 버튼을 옮겨도 `getByRole` 은 DOM 어디서든 찾으므로
"헤더 한 줄에 모여 있다" 는 테스트가 **그대로 통과했다.** 이름이 반대를 말하는 테스트는
없는 것보다 나쁘다 — 단정을 **카드 범위로 좁혔다**(`cardOf(title)` 헬퍼: 편집 버튼은 자기
카드 **안**, 삭제는 카드 **밖**).

테스트 **727 → 731**(+4).

## Phase 5: 027 이월 6건 + 공용 셸 승격 판단

> **독립 테스트 기준**: 027이 넘긴 6건이 처리되었거나 **처리하지 않은 사유가 적혀 있다.** 셸 승격은 **결론이 나 있다**(뽑았거나, 뽑지 않기로 하고 사유를 남겼다).

- [x] T370 🔴 구 `PointType` 중복 제거 마무리 in src/features/patrol-points/types/PatrolPoint.ts — ✅ **2곳은 T352에서 이미 사라졌다**(제약 4). 남은 한 곳만 `features/points/types` 로 수렴. DoD #15
- [x] T371 `ZoneRow` 코스 활성여부 (027 이월 2) — ⚠️ **막힐 수 있다**: 지점 상세의 `courseList` 는 `{courseSeq, courseName}` **둘뿐**이라 `useYn` 이 없다. 코스 목록 조회와 조합하거나(요청 1건 추가) **백엔드에 필드 요청**한다. 🔴 **중립 점을 그대로 두는 것도 결론이다** — 027이 "의미 없는 점" 이라 했으니 **제거**가 더 정직할 수 있다. 판단 후 사유 기록
- [x] T372 지점 상세 2건 (027 이월 3·4) in src/features/points/components/detail/{PointDetail,ZoneRow}.tsx — **"코스에 추가" 버튼 활성화**(이제 `UpdateCourse` 가 있다) + **소속 코스 → `/zones/:courseSeq` 링크**. DoD #16
- [x] T373 🔴 공용 셸 승격 판단 (OQ-023-D) — 후보 3종: 목록 셸 · 상세 셸 · `useListQueryParams`. 코스가 **두 번째 사례**다. ⚠️ **뽑지 않는 결론도 정당하다** — 코스 상세는 다이어그램·드래그가 있어 지점 상세와 모양이 꽤 다르다. 🔴 **어느 쪽이든 사유를 적는다**(DoD #17 — 판단을 내리는 것이 조건이고, 뽑는 것이 조건이 아니다)
- [x] T374 `patterns.md` §10 갱신 — 코스 활성화·교대 허용이 **인라인 옵티미스틱 → 확인 모달**로 이동(027 이월 6). 🔴 **옵티미스틱과 확인 모달이 양립 불가인 이유**를 적는다 + §5 드래그 · §13 필터 팝오버 참조 갱신

### Phase 5 결과 (2026-10-13)

> 🔴 **두 태스크의 전제가 틀려 있었다.** 계획이 Phase 1~4 **이전**에 쓰였기 때문이다.
> 구현 전에 코드 상태를 먼저 실측하고, 계획과 다른 판단은 사유를 남겼다.

#### T370 — 🔴 **"제거" 는 불가능한 계획이었다. 하지 않고 주석을 고쳤다**

| | 계획 | 실측 (2026-10-13) |
|---|---|---|
| 남은 참조 | 2곳 | **1곳** (`patrol-points/types/PatrolPoint.ts:1`) |
| 그 1곳이 쓰는 것 | `PointType` | **`PointAuthenticationMethod`** (`'QR' \| 'NFC'`) |
| `PointType` 블록 | 023에서 제거 | **지울 수 없다** |

`PointType` 을 지울 수 없는 이유는 주석 안에 **이미 적혀 있었다** — `mock/pointData.ts` 가
MSW 의 dev 데이터 출처이고 그 파일이 이 타입을 쓴다. 지우려면 mock 데이터를 통째로 들어내야
하고, 그건 `dev` 모드를 없애는 일이다. 즉 **"남긴다" 와 "제거한다" 가 한 주석 안에서 모순**
이었다.

남은 참조 1곳도 **끊지 않았다.** 끊는 방법은 `'QR' | 'NFC'` 를 `patrol-points` 에 복제하는
것인데, `/patrol/*` 는 **`spec 024`·`025` 가 서버 API 로 전환하며 mock 타입이 통째로 사라질**
자리다(023이 `features/zone` 을 지운 것과 같은 경로). 지금 복제하면 024에서 **다시 지울 코드**
를 더한다(A3).

→ `src/features/points/types/point.ts` 주석을 사실로 교체했다. **DoD #15 는 미충족 + 사유**다.

#### T371 — 점을 **채우지 않고 제거**했다

`ZoneRow.isActive` 는 선택 prop 이었고 **아무도 넘기지 않았다** — 모든 점이 중립 테두리로만
그려지고 있었다(027이 "의미 없는 점" 이라 한 그대로). 채우려면 지점 상세마다 `GetCourseList`
를 추가로 돌려 `courseSeq` 로 맞춰야 하고, 사업장 코스가 20개를 넘으면 **페이징**까지 돌아야
전량이 모인다. **요청 1건을 더 쓸 값이 아니다.**

→ 점을 제거하고 **T372의 링크로 대체**했다. 코스 상세에 가면 활성여부·편성·최근 순찰이 다
있다 — 점 하나보다 **많이** 알려 준다. 023이 코스 상세를 열어서 이제 갈 곳이 생겼다.
백엔드에 `courseList[].useYn` 을 요청하지 **않았다**(B-32·B-33보다 가치가 낮다).

#### T372 — 링크 2개. "코스에 추가" 는 **별도 작업으로 분리**

- ✅ 소속 코스 행 → `/zones/:courseSeq` **링크**
- ✅ 비활성 `코스에 추가` 버튼 → **`/zones` 링크 `순찰코스에서 편성`**
  - 🔴 안내 문구가 `"순찰코스 화면(준비 중)에서 지원됩니다"` 였는데 **023이 그 화면을 열어
    준비 중이 아니다** — 거짓이 된 문구다. 이름도 하는 일에 맞췄다(여기서 바로 넣어 주지
    않고 **보낸다**).
  - ⚠️ 여기서 **바로** 넣으려면 코스 선택 모달 + 코스 상세 조회 + `UpdateCourse`(전량 전송,
    B-25)로 **요청 3개**가 붙는다. Phase 5(정리 작업)의 성격을 벗어나 **분리**했다.
    `AddCoursePointDialog` 의 거울상이라 재료는 다 있다.

#### T373 — 🔴 **행만 합치고 카드 셸은 뽑지 않는다**

| 중복 | 개수 | 결론 |
|---|:-:|---|
| 라벨+값 **행** | **3곳** | ✅ **합쳤다** |
| 카드 셸(`rounded-lg border bg-card p-4` + 제목) | 7곳 | ✗ 뽑지 않는다 |
| 목록 셸 · `useListQueryParams` | 2곳 | ✗ 보류 |

**행(합침)** — `components/app/AppDetailRow` 에 `variant` 를 넣었다. `between`(기존, 좁은
곳) / `fixed`(라벨 고정폭, 전체 폭 페이지). `features/points/DetailRow` 를 **삭제**하고
`CourseInfo` 안의 `InfoRow` 도 치웠다. 027이 "괜찮으면 통합" 으로 남긴 판단을 여기서 닫는다.
⚠️ `patrol-points/PatrolRecordDialog` 의 `InfoRow` 는 **건드리지 않았다** — 모달 안의
`justify-between` 이라 모양이 맞고, 그 feature 는 025가 들어낸다.

**카드 셸(뽑지 않음)** — 7곳이 많아 보이지만 **머리 구성이 제각각**이다(탭·필터·건수·아이콘
버튼·없음). 공통으로 뽑으면 `children` + prop 6개짜리 컴포넌트가 되고, 그건 3줄 중복보다
나쁘다(A6). 🔴 **뽑지 않는 것도 결론이다** — DoD #17 의 조건은 "판단을 내릴 것" 이지
"뽑을 것" 이 아니다.

**목록 셸 · `useListQueryParams`(보류)** — 사례가 `points`·`courses` **둘뿐**이라 "두 번
반복" 의 하한에 걸친다. 024·025의 세 번째 사례를 보고 정한다.

#### T374 — §10 **두 갈래로 분기** + 🔴 **§5의 거짓 API 제거**

**§10** — "토글 = 옵티미스틱" 하나였던 것을 (A) 즉시 반영 / (B) 확인 모달 **표로 갈랐다**.
코스 활성화·교대 허용은 (B)다. 사유: *모달로 의도를 확인받은 변경을 화면에 먼저 반영했다가
실패로 되돌리면, 사용자는 **자기가 방금 확인한 변경이 조용히 취소된 것**을 토스트로만 알게
된다.* `design-system.md` **D8 도 같이 고쳤다** — §10이 근거로 가리키는 문서가 반대로 적혀
있으면 §10만 고쳐도 모순이 남는다.

**§5 — 🔴 더 위험한 쪽이었다.** 존재하지 않는 API 가 적혀 있었다:

| 문서에 적혀 있던 것 | 실제 |
|---|---|
| `ReorderCoursePointsRequest` 전송 | **그런 엔드포인트가 없다** |
| `orderedPointIds: string[]` 일괄 갱신 | `UpdateCourse` 의 `points` **전량 전송**(B-25) |
| 드래그 → 즉시 서버 반영 | **편집 모드 + 명시적 저장** |
| 키보드 정렬 "필요 시 별도 설계" | **구현돼 있다**(`KeyboardSensor`) |

023 구현 **전**의 설계안이 실측 없이 남아 있던 것이다. 024·025가 이 절을 읽고 같은 설계를
하는 것을 막으려 **정정 사유를 본문에 남겼다**.

#### 검증

`npm run verify` 0 errors(기존 경고 1 — 생성 파일 `mockServiceWorker.js`) ·
`npm run test` **732 passed (75 files)**. 테스트 **731 → 732**(+1: `ZoneRow` 링크 ·
`순찰코스에서 편성` 링크 추가, 비활성 버튼 테스트 1건 제거).


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
| **5** | 이월 6건 + 셸 승격 판단 | ✗ (요청 없이 해결) | ✗ (완료) |
| **6** | Polish · 캡쳐 · 문서 | — | ✗ |

**[P]** = 병렬 가능 · **🔴** = 틀리면 조용히 깨지는 지점 · **⚠️** = 미확정/제약
