# 028-course-point-picker tasks

> 입력: 같은 폴더 [`spec.md`](./spec.md)
> 태스크 ID는 Phase 무관 일련 번호 — 023 이 `T379` 로 끝나 **`T380` 부터** 쓴다.
> `[P]` = 병렬 가능 · `[US1]` = user story 소속
> 위험도 **A** → 잘게 분할(선택·순번·필터를 각각 검증 지점으로 둔다)

> 🔴 **서버 호출이 늘지 않는다.** 이 spec 은 `GetClassificationPoint` 한 개만 쓰고
> (현행 그대로, 모달 열릴 때 1회) **변경계는 호출하지 않는다.** 새 api 파일·queryKey·
> MSW 핸들러가 **필요 없다** — 그래서 템플릿의 Phase 2(Foundational = API 기반)가
> 이 spec 에서는 **모달 상태 구조**로 대체된다.

---

## Phase 1: Setup — 순수 함수 (모든 UI 선행)

> **독립 테스트 기준**: vitest 단위 테스트만으로 필터·건수·순번이 전부 검증된다.
> 🔴 **로직을 컴포넌트에서 빼내는 이유는 023 과 같다** — 모달 안에 두면 렌더 없이는
> 테스트할 수 없고, 순번·선택 유지는 **눈으로 보기 어려운 종류의 버그**다.

- [ ] T380 [P] 후보 필터링 순수 함수 `filterCandidates(all, assignedPointSeqs, method, keyword)` in src/features/courses/lib/pointCandidates.ts
- [ ] T381 [P] 필터 칩 건수 `candidateCounts(assignable)` → `{ all, qr, nfc }` in src/features/courses/lib/pointCandidates.ts
- [ ] T382 [P] 검색어 하이라이트 분할 `splitByKeyword(text, keyword)` → `{ text, hit }[]` in src/features/courses/lib/pointCandidates.ts
- [ ] T383 [P] 선택 토글 `toggleSelection(selected, point)` — **순서 보존**(추가는 끝에, 해제는 제거) in src/features/courses/lib/pointCandidates.ts
- [ ] T384 [P] 순번 계산 `orderNoOf(assignedCount, index)` — 기존 편성 수 + 선택 순서 in src/features/courses/lib/pointCandidates.ts

## Phase 2: 모달 상태 구조 전환 (US1 선행 blocking)

> **독립 테스트 기준**: UI 를 바꾸기 전에, 기존 화면 그대로 **선택 순서가 보존되고**
> `onAdd` 가 그 순서대로 넘기는 것이 테스트로 확인된다.
> 🔴 **현재 선택 상태는 `number[]`(pointSeq) 이고 `onAdd` 는 `all.filter(...)` 로 넘긴다**
> — 즉 **후보 응답 순서**로 나간다. 사용자가 3번→1번 순으로 골라도 1번이 먼저 들어간다.
> 순번 표시(T384)가 거짓말이 되지 않으려면 **이것부터** 고친다.

- [ ] T385 [US1] 선택 상태를 `number[]` → **선택 순서 배열**로 교체 in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T386 [US1] `onAdd` 가 **선택 순서대로** 넘기도록 수정(`all.filter` 제거) in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T387 [US1] 호출부 영향 확인 — 초안 끝 append + `orderNo` 1..N 재부여가 그대로인지 in src/features/courses/components/detail/CoursePointEditor.tsx

## Phase 3: US1 — 모달 UI 재구성

> **독립 테스트 기준**: MSW 후보 응답 상태에서 ① 칩으로 QR/NFC 가 걸리고 ② 검색과
> 조합되고 ③ 고른 것이 하단에 순서대로 쌓이고 ④ 행 우측 순번이 `기존+순서` 로 뜨고
> ⑤ 필터를 바꿔도 선택이 유지된다.

- [ ] T388 [US1] 필터 칩 3종(`전체`/`QR`/`NFC`) + 건수 표시 in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T389 [US1] 검색 + 칩 **조합** 적용(T380 연결), 결과 건수 라벨 in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T390 [US1] 후보 행 재구성 — 체크박스 · 지점명(**하이라이트**) · 인증수단 뱃지 · **우측 순번** in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T391 [US1] 하단 **선택 목록** — 선택 순서대로 칩, 개별 해제 · `모두 해제` in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T392 [US1] 🔴 필터 변경으로 목록에서 사라져도 **선택 유지**(선택 상태를 목록에서 파생시키지 않는다) in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T393 [US1] 0건 분기를 **4종**으로 확장(지점 없음 / 전부 편성됨 / 검색 0건 / **필터 0건** + 초기화 수단) in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T394 [US1] 닫기·취소 시 검색어·**필터 칩**·선택 전부 초기화 in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T395 [US1] 모달 헤더·설명 문구 정리(목업 기준, 코스명 노출 여부 포함) in src/features/courses/components/detail/AddCoursePointDialog.tsx

## Phase 4: US2 — 틀린 근거 정정 (실측 2026-10-13)

> **독립 테스트 기준**: 코드를 읽는 사람이 **후보에 미사용이 섞인다** 고 믿을 수 있는
> 문장이 저장소에 하나도 남지 않는다(`grep` 으로 확인).

- [ ] T396 [P] [US2] "미사용이 섞였는지 알 수 없다" → **서버가 제외한다**(실측일 명시) in src/features/courses/api/getClassificationPoint.ts
- [ ] T397 [P] [US2] 같은 정정 — `ClassificationPoint` 타입 주석 in src/features/courses/types/course.ts
- [ ] T398 [P] [US2] 같은 정정 + 중복 편성 규칙 주석 유지 in src/features/courses/components/detail/AddCoursePointDialog.tsx
- [ ] T399 [P] [US2] 🔴 B-29 근거 교체 — "서버에 수단이 없다" → **코스에서 바꿀 값이 아니다** + `points[].useYn` 은 **항상 `true`**(실측) in src/features/courses/components/detail/CoursePointList.tsx
- [ ] T400 [P] [US2] 같은 정정 — `CoursePointDraft.useYn` 주석 in src/features/courses/lib/coursePointOrder.ts
- [ ] T401 [US2] `api-spec.md` 갱신 — **B-29 철회·대체**(응답 값이 지점 실제 값을 안 따라온다, 우선순위 낮음) + `GetClassificationPoint` 항목에 **미사용 지점 제외** 실측 기록 in docs/api-spec.md

## Phase 5: Polish

- [ ] T402 [P] 순수 함수 단위 테스트 5종(필터·건수·하이라이트·선택 순서·순번) in src/features/courses/lib/\_\_tests\_\_/pointCandidates.test.ts
- [ ] T403 [P] 모달 컴포넌트 테스트 — 칩·조합 검색·선택 유지·순번·0건 4종 in src/features/courses/components/detail/\_\_tests\_\_/AddCoursePointDialog.test.tsx
- [ ] T404 `npm run verify` + `npm run test` **병렬 실행**(CLAUDE.md A4), 734 → 증가 확인
- [ ] T405 브라우저 확인(MSW) — DoD #12 의 4항목 + 담은 뒤 **저장까지** 한 번 통과
- [ ] T406 문서 동기화 — `screens.md` §1-3 "코스 내 지점 편성" 행에 모달 구성 반영 / `roadmap.md` §7-1·§12 에 028 행 추가
- [ ] T407 DoD 12개 대조표 작성 + `## 다음 spec으로 이월` 블록 in specs/phase3/028-course-point-picker/tasks.md

---

## Dependencies & Execution Order

- **T380~T384(Phase 1)** → Phase 2·3 전부 선행. 서로는 `[P]`(같은 파일이지만 함수가 독립 — 한 번에 작성 가능)
- **T385 → T386 → T387** 순차. 🔴 **T385 가 Phase 3 전체의 전제다** — 선택 순서가 보존되지 않으면 T390·T391 의 순번이 **틀린 값을 그린다**
- **T388 → T389 → T390** 순차(칩 → 조합 → 행 렌더가 같은 파생 목록을 쓴다)
- **T391·T392** 는 T385 이후 `[P]`
- **T393·T394·T395** 는 T389 이후 `[P]`
- **Phase 4(T396~T400)** 는 전부 `[P]` — 주석만 고치고 동작에 영향 없다. **Phase 1~3 과도 병렬 가능**. T401 은 T396~T400 뒤(코드와 문서를 같은 문장으로 맞춘다)
- **Phase 5** 는 Phase 3·4 완료 후. T402·T403 `[P]` → T404 → T405 → T406 → T407

## 제약 (구현 중 지킬 것)

1. 🔴 **`AppFilterButton`/`AppFilterPopover` 를 쓰지 않는다** — 그건 목록 화면의 팝오버
   필터다. 여기 칩은 **항상 보이는** 3개이고 소비처가 이 모달뿐이라 **공용으로 뽑지
   않는다**(A6).
2. 🔴 **`미배정` 칩을 만들지 않는다** — 후보 응답에 코스 소속 정보가 없다. 요청하면
   지점마다 상세 조회(N+1). 사유를 코드 주석에 남긴다(DoD #2).
3. 🔴 **"예상 소요" 를 계산하지 않는다** — `courseMin` 은 담은 뒤 입력하는 값이라 선택
   시점에는 0 이다. 그럴듯한 수를 만들지 않는다(A1).
4. 🔴 **서버 호출을 늘리지 않는다** — 새 api·queryKey·MSW 핸들러 **0건**이 목표다.
   늘려야 할 이유가 생기면 그 자리에서 보고하고 멈춘다.
5. **행에 없는 필드를 추측으로 채우지 않는다** — 상세 위치·지점 코드는 서버에 없다.
6. 🔴 **미사용 분기 코드를 지우지 않는다**(OQ-028-B) — 백엔드가 응답 값을 고치면 그대로
   살아난다. 주석으로 **현재 발동하지 않는다**는 사실만 적는다.

## 백엔드 대기

**없음.** 이 spec 은 백엔드 요청 **0건**으로 완결된다.
(B-29 철회·대체 등재는 T401 에서 문서 작업으로만 처리한다 — 답을 기다리지 않는다)

---

## DoD 12개 대조표 (T407, 2026-10-13)

| # | 조건 | 결과 | 근거 / 사유 |
|:-:|---|:-:|---|
| 1 | 필터 칩 3종 + **건수**, 검색과 **조합** | ✅ | `AddCoursePointDialog.tsx` `FilterChip` · 테스트 `칩 3종에 건수가 붙는다` · `칩과 검색이 **조합**된다` |
| 2 | 🔴 `미배정` 칩을 **만들지 않았다** + 사유 기록 | ✅ | 모달 상단 주석 · `spec.md` §3 규칙 5 · `screens.md` §1-3 |
| 3 | 선택 목록 하단에 **선택 순서대로** + 개별/모두 해제 | ✅ | 테스트 `선택 바에서 개별 해제·모두 해제가 된다` |
| 4 | 🔴 순번 = 기존 편성 수 + 선택 순서, 해제 시 **당겨진다** | ✅ | `orderNoOf` 단위 테스트 2건 + 모달 테스트 `순번은 **기존 편성 수 + 선택 순서**다` |
| 5 | 🔴 필터를 바꿔도 **선택 유지** | ✅ | 테스트 `칩을 바꿔 목록에서 사라져도 **선택은 유지된다**` |
| 6 | 전체 선택 · "현재→추가 후 · 예상 소요" **안 만듦** + 사유 | ✅ | `tasks.md` 제약 3 · `spec.md` §3 규칙 4 (구간시간은 담은 뒤 입력이라 **계산 불가**) |
| 7 | `onAdd` 가 **선택 순서대로**, 서버 호출 0건 | ✅ | 테스트 `**고른 순서 그대로** 넘긴다` — 🔴 **고치기 전에는 응답 순서로 나갔다**(T385·T386) |
| 8 | 0건 **4종** + 로딩·실패 구분 | ✅ | 기존 3종 테스트 + 신규 `칩 0건은 검색 0건과 **다른 문구**를 준다` |
| 9 | 🔴 주석 정정 완료 | ✅ | **계획은 5파일이었으나 실제로 11곳**이었다 — 전부 정정(아래 "계획 외" 참조) |
| 10 | `api-spec.md` B-29 철회·대체 + `GetClassificationPoint` 실측 기록 | ✅ | B-29 ❌ 철회 · **B-36 신설** · §5-2 14번 블록에 주석 3줄 |
| 11 | `verify` 0 errors + `test` green (734 → 증가) | ✅ | verify exit 0 · **734 → 756건**(+22 — 순수함수 14 + 모달 8, 파일 75 → 76) |
| 12 | MSW 브라우저 확인 4항목 이상 | ☐ | **미실시** — 사용자 확인 대기(WF-4) |

**11/12 충족 · 1건 대기(#12 브라우저 확인).**

### 계획 외 수정

| 내용 | 사유 |
|---|---|
| 🔴 **tasks Phase 2 자체가 계획 외였다**(T385~T387) | WF-2 분할 중 발견: 선택이 `number[]` 라 제출 때 `all.filter` 로 되살려 **후보 응답 순서**로 나갔다. 순번을 붙이는 순간 화면의 숫자와 실제 편성 순서가 **어긋난다** → UI 보다 먼저 고쳤다 |
| B-29 주석 정정 **5곳 → 11곳** | `grep` 으로 보니 같은 틀린 근거가 `updateCourse.ts`·`CoursePointEditor`(2)·테스트 제목 3개·`request.ts`·`mock/courseData.ts`·`mocks/handlers/courses.ts` 에도 있었다. 5곳만 고치면 **코드베이스가 두 가지 설명을 동시에 들고 있게 된다** |
| 칩에 `aria-label` 추가 | 라벨과 숫자가 붙어 **`전체3`** 으로 읽혔다(테스트가 잡았다) → `전체 3건` |
| 테스트 단언 2건 조정 | 🔴 **하이라이트가 접근성 이름을 바꾼다** — `<mark>` 로 쪼개지면서 **조각 경계의 공백이 사라진다**(`지하주차장 B구역`). 기능 쪽이 아니라 단언을 조정했다(화면 표기는 정상) |

### 남은 것 (028 범위 밖)

| | 내용 | 이유 |
|---|---|---|
| OQ-028-A | 미사용 지점이 편성된 채 남은 코스를 알릴 것인가 | **B-36** 답변 대기(급하지 않음 — 막히는 기능 없음) |
| OQ-028-B | 코스 상세의 미사용 분기 코드 | **지우지 않았다** — B-36 이 ①로 풀리면 그대로 살아난다 |
| 모달 헤더의 코스명·사업장명 | 목업에는 있다 | 페이지 제목이 이미 코스명이고 사업장은 하나뿐 — **같은 값을 한 화면에 두 번** 적게 된다(T395) |

---

## 다음 spec으로 이월

**`spec 029`(지점 상세 디테일)로 넘기는 것: 없음.**

028 은 코스 편성 모달 하나로 닫혔고, Open Question 2건은 **백엔드 답변(B-36) 대기**라 029
와 무관하다. 다만 029 착수 시 **참고할 실측 2건**이 있다:

1. 🟢 **`DetailPoint.qrCode` 가 실제로 온다** — `STSP1:{siteSeq}:{pointSeq}:{epoch}:{서명}`
   (실측 2026-10-13). 027 이 QR 카드를 placeholder 로 둔 근거(B-23)는 **발행 메타**에만
   해당하고, **이미지 자체는 그릴 수 있다.** 타입(`point.ts:84`)·mock 에 이미 있다.
2. ⚠️ **`UpdatePointDto.reissueQrYn`** 가 요청 DTO 에 있다(라이브 swagger 확인) — QR
   재발행 경로가 열려 있다. 다만 **발행일·버전은 응답에 없다**(B-23).
