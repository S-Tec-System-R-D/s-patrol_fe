# 021-site-select spec

> 위험도: **A** — ⚠️ `roadmap.md` §7-1 표에 021 위험도가 **미기재**다. 임의 산정이 아니라 미기재 보완으로, 020(A급)과 같은 영역(로그인 직후 진입·가드·토큰 생애)을 다루므로 A로 둔다. 사용자 확인 요청함(2026-10-06).
> 관련 화면: `docs/screens.md` §1-1(로그인). **선택 단계는 별도 화면이 아니다** — 로그인 화면 내 단계이므로 §4 라우트 매핑에 새 행이 생기지 않는다.
> Phase: `roadmap.md` Phase 3 (§7-1 번호 SSOT — `021` 사업장 선택)
> 선행: `spec 019`(에러 정규화·`_raw`) / `spec 020`(로그인·JWT·`code` 분기)
> 응답 근거: `docs/api-spec.md` §2-2(선택 규칙 확정) · §5-2(`UserSiteSelectData` 실측)

---

## 0. Carry-over (직전 spec = 020 핸드오프)

`specs/phase3/020-login-and-jwt/tasks.md` 맨 아래 이월 블록 기준.

**본 spec에서 해소한다**

- [ ] **`locationName`이 `undefined`** → 선택한 사업장명(`siteName`)을 저장하고 `useMe`가 읽어 채운다. 실소비처 2곳(`DeploymentHistoryTabs.tsx:29`, `DeploymentKpiRow.tsx:16·19`)의 전입/전출 판정이 빈 결과였던 일시 퇴행을 끝낸다.
- [ ] 🔴 **`DeploymentHistoryTabs.test.tsx`의 `vi.mock` 스텁 제거** — 위 항목이 해소되면 스텁이 실제 값을 가린다. **스텁을 남긴 채 021을 끝내면 "동작한다고 착각"하게 된다**(020 이월 블록의 경고 그대로 승계).
- [ ] **`npm run capture` baseline 재촬영 여부** → 로그인 화면에 단계가 추가되므로 본 spec에서 판단한다. 020에서 고친 캡쳐 파이프라인(JWT 생성기)이 유효한지도 이번에 실증된다.

**본 spec 범위 외 → 이월 유지**

- [ ] **실 서버 로그인 확인**(020 DoD #14 ◩) → 사내망 접속이 필요해 오늘 수행 불가(2026-10-06 `123.2.156.148:5231` 연결 타임아웃 확인). `npm run dev:real`로 사내망에서 1회 수행. **본 spec의 실 서버 검증과 묶어서** 한 번에 한다.
- [ ] **OQ-D JWT `role` 문자열 3종 미실측**(Master·Manager·근무자) → Phase 5 본사 영역. 본 spec은 현장(`FieldManager`)만 다뤄 영향 없음.
- [ ] **OQ-F `AppInput` label-input 연결 끊김** → `AppFormField` 도입 작업(`roadmap.md` §6). 본 spec이 `AppInput`을 새로 쓰지 않으므로 악화되지 않는다.
- [ ] **OQ-A `roleDisplay` 사용 여부** / **OQ-C 이미 로그인된 상태로 `/login` 접근** → 현행 유지.
- [ ] **020 DoD #7 `ProfileBadge` 1곳 수정**(◩ 11/12) → 종결된 사실. 이월 아님.

---

## User Stories

- **US1.** 현장관리자가 로그인하면, 소속 사업장이 **2개 이상일 때** 로그인 화면에서 사업장을 골라 현장 홈에 들어간다.
- **US2.** 현장관리자의 소속 사업장이 **1개면** 선택 단계가 보이지 않고 그 사업장으로 자동 진입한다.
- **US3.** 현장관리자의 소속 사업장이 **0개면** 홈에 들어가지 못하고 안내를 받는다.
- **US4.** 토큰은 있으나 사업장이 선택되지 않은 상태로 보호 화면에 진입하면 로그인 화면으로 돌아간다.

---

## 1. 목적

`siteSeq`는 `spec 022~026`(순찰지점·순찰코스·지점이력·코스이력·공지) **모든 조회의 필수 파라미터**다. 그런데 권한 밖 사업장 조회는 403이 아니라 **`HTTP 200` + 빈 목록**으로 돌아와(`api-spec.md:211`) 응답으로는 "권한 없음"과 "데이터 없음"을 구분할 수 없다. 따라서 **접근 가능한 사업장 목록을 서버에서 받아, 그 안에서 고른 값만** 이후 쿼리에 싣는 것이 프론트 책임이다. 본 spec은 로그인과 홈 사이에 그 단계를 넣고 `siteSeq`를 확보한다.

**본 spec은 현장(`code` `2xx`)만 다룬다.** 본사(`1xx`)는 선택 없이 `/admin/locations` 직행을 유지한다 — ① 본사 홈이 아직 `AdminPlaceholderPage`(`src/pages/admin/AdminPlaceholderPage.tsx:9`)이고 실화면은 Phase 5라 **`siteSeq` 소비처가 0개**다 ② `AdminSiteSelect` 평면 배열의 필드명이 미실측이라 추측이 필요하다(A1). 사용자 결정 2026-10-06.

---

## 2. I/O

### Input

- **API**: `GET /api/v1/Login/W/sign/UserSiteSelect` — 파라미터 없음. **`sign` 엔드포인트라 `Authorization` 헤더가 필요하다.**
- **응답**(`api-spec.md` §5-2 실측):

```ts
interface UserSiteSelectData {
  siteSeq: number    // 루트 = 소속 지사·상위 조직. 선택 대상 ❌
  siteName: string
  children: {
    childSiteSeq: number    // ← siteSeq 아님. 이 값이 선택 결과
    childSiteName: string   // ← siteName 아님
    parentSeq: number       // ← parentSiteSeq 아님
  }[]                       // 1단 평면. 재귀 아님
}
```

- **사용자 입력**: 사업장 목록 중 1건 선택(클릭). 폼 필드 없음, 쿼리스트링 없음, 라우트 파라미터 없음.

### Output

- **화면 전환**: 선택 완료 → `paths.service.zones`(`/zones`)로 `navigate({ replace: true })`.
- **상태 변화**: `localStorage`에 `siteSeq`·`siteName` 저장. `useMe().data.locationName`이 `siteName`을 반환하게 된다.
- **외부 효과**: 없음(서버 상태를 바꾸는 호출이 없다 — §3 규칙 1).

---

## 3. 제약

### 기술 제약

- 재사용: `LoginForm`(단계 추가), `AppButton`, `AppEmpty`(0개 상태), `tokens.ts`의 `readString`/`writeString` 패턴
- 신규: `features/auth/api/userSiteSelect.ts`, `features/auth/lib/siteOptions.ts`(어댑터), `lib/auth/site.ts`(저장소)
- 라이브러리 추가 없음. 선택 단계는 **라우트가 아니므로** `react-router` 설정 변경 없음

### 비즈니스 규칙

1. 🔴 **선택 확정 API가 없다.** `swagger-api.json`의 `Login` 태그는 5개(`Login`/`RefreshToken`/`Logout`/`AdminSiteSelect`/`UserSiteSelect`)뿐이고, 두 SiteSelect는 **파라미터 없는 조회 GET**이다. 서버는 선택한 `siteSeq`를 기억하지 않는다 → **클라이언트가 보관하고 매 요청 쿼리로 전달**한다.
   - ✅ **`api-spec.md` OQ-1A ② 해소** — 기존 가정("매 요청 쿼리")이 맞았다. `spec 022~026`의 쿼리 설계에 변경 없음.
   - 과거 구현은 선택 시 **토큰을 재발급**해 거기에 담았으나 현 백엔드에는 그 엔드포인트가 없다(사용자 전달 2026-10-06). **JWT 클레임에서 `siteSeq`를 찾지 말 것** — `AccessTokenClaims`에 없다.
2. **저장소는 `localStorage`**. `sessionStorage`를 쓰지 않는다 — 토큰이 `localStorage`에 있는데(`lib/auth/tokens.ts:8`) `siteSeq`만 세션에 두면 **새 탭·브라우저 재시작마다 "토큰은 있고 `siteSeq`는 없는" 고장 상태**가 기본 동작이 된다.
3. 🔴 **`clearTokens()`가 `siteSeq`·`siteName`도 지운다.** 로그아웃 시 남으면 다음 사용자 계정에 이전 사업장이 붙는다.
4. **선택 UI는 로그인 카드 내 단계 전환**(step1 폼 → step2 목록). 모달 오버레이를 쓰지 않는다 — 선택은 skip 가능한 단계가 아니라 "닫을 수 없는 모달"이 되고, 그건 `AppDialog`를 기본 동작과 반대로 쓰는 것이다. 단계 전환이면 "뒤로 = 다시 로그인" 하나로 끝난다.
5. 🔴 **토큰 저장이 `UserSiteSelect` 호출보다 먼저여야 한다.** `sign` 엔드포인트라 `Authorization`이 필요하고, 헤더는 인터셉터가 `getAccessToken()`에서 읽는다. 따라서 **"토큰 있음 + `siteSeq` 없음" 중간 상태가 반드시 생긴다** → 규칙 6이 필수다.
6. **`AuthGuard`가 `siteSeq` 없음을 막는다.** 토큰 체크 뒤에 1건 추가 — 없으면 로그인으로 `Navigate`(기존 `?redirect=` 보존 방식 그대로). 이것이 없으면 중간 상태에서 새로고침 시 홈이 `siteSeq` 없이 쿼리를 날려 **`200` + 빈 목록이 "정상 응답인 빈 화면"으로 그려진다**(규칙 1의 함정).
   - 🔴 **본사 영역에는 적용하지 않는다.** 본사는 본 spec에서 선택을 넣지 않으므로(§1) `siteSeq`를 요구하면 본사 로그인이 즉시 막힌다. `isAdminArea(location.pathname)`로 제외한다.
7. **선택 대상은 `children` 만이다. 루트 `siteSeq`는 제외**(`api-spec.md` §2-2). 루트(테스트 데이터 `siteSeq 6`)에도 지점·코스·근무자가 붙어 있지만 규칙대로 간다.
8. **필드명 차이는 어댑터가 흡수한다.** `childSiteSeq`/`childSiteName` → 공용 `SiteOption { siteSeq, siteName }`. 근거는 `CLAUDE.md` B4의 "목록↔상세 필드명 차이"와 같은 **서버 내부 불일치**다. 서버 이름을 우리 옛 이름으로 되돌리는 것이 아니다.
9. **`siteSeq`를 URL 쿼리스트링에 노출하지 않는다.** `api-spec.md:212`가 "노출할 경우 목록 밖 값은 거부"를 요구하는데, **노출하지 않으면 거부 로직 자체가 불필요하다**(A6). 검색·필터는 URL에 둔다는 `CLAUDE.md` B4 규칙과 충돌하지 않는다 — `siteSeq`는 필터가 아니라 **데이터 스코프**다.
10. **1개 자동 진입도 저장 경로는 같다.** 분기만 다르고 "저장 → `/zones`"는 하나의 경로를 쓴다. 자동 진입에서만 저장을 빼먹는 실수를 구조적으로 막는다.
11. **근무자(`202`) 차단은 선택 단계보다 먼저다.** 020의 순서(`resolveLoginOutcome` → 허용 아니면 토큰 저장 전 `return`)를 유지한다. 근무자는 `UserSiteSelect`를 호출하지 않는다.

---

## 4. 엣지 케이스

| 상황 | 처리 |
|---|---|
| `children` **0개** | US3. "소속된 사업장이 없습니다. 관리자에게 문의해주세요." + **토큰 삭제**(`clearTokens()`) 후 로그인 단계로 복귀. ⚠️ **미실측** — 서버가 빈 배열인지 에러인지 모른다(OQ-1A ①). **양쪽 모두 이 처리로 수렴**시킨다 |
| `UserSiteSelect` 호출 실패 (네트워크·500) | 019 `ApiError` 메시지를 로그인 폼 인라인으로 표시 + **토큰 삭제** 후 로그인 단계 복귀. 🔴 중간 상태를 남기지 않는 것이 핵심 |
| `UserSiteSelect`가 **403** | 현장 계정인데 본사 전용으로 판정된 경우(두 API는 상호 배타 — `api-spec.md:286·287`). 위와 동일 처리. `code`와 서버 판정이 어긋났다는 뜻이라 추측으로 통과시키지 않는다(A1) |
| 응답이 왔으나 `children`이 배열이 아님 | 0개와 동일 처리. 파싱으로 throw하지 않는다(019 방어 패턴) |
| 선택 **연타** | 선택 버튼 `disabled` + 저장은 멱등(같은 값 덮어쓰기). 저장은 동기라 경합 없음 |
| `localStorage` 쓰기 실패 (시크릿 모드 등) | `tokens.ts`의 기존 방침을 따른다 — 저장 실패는 무시하고 진행. 다음 진입에서 가드(규칙 6)가 로그인으로 보낸다 |
| 저장된 `siteSeq`가 숫자가 아님 (손상) | `null` 취급 → 가드가 로그인으로. 자동 클리어하지 않는다(`tokens.ts` 비파괴 방침) |
| 로그인 후 **다른 사업장으로 전환** | 본 spec 범위 외. 현재는 로그아웃 후 재로그인. 실사용 불편이 확인되면 별도 spec에서 헤더 전환 UI 추가 — 그때 재사용되도록 선택 목록 컴포넌트를 `LoginForm`에서 분리해 둔다 |
| 본사 계정(`1xx`) 로그인 | 선택 단계 없이 `/admin/locations` 직행(현행 유지). 가드의 `siteSeq` 체크에서도 제외(규칙 6) |

---

## 5. 완료 조건 (DoD)

WF-4에서 증거(`파일:라인`) 명시 필요.

- [ ] 1. 현장 로그인 성공 후 `UserSiteSelect`를 호출한다 (토큰 저장 뒤, `Authorization` 포함)
- [ ] 2. `children` **2개 이상** → 로그인 카드가 목록 단계로 전환되고, 선택 시 `/zones`로 이동한다 (US1)
- [ ] 3. `children` **1개** → 목록이 보이지 않고 자동 진입한다. 저장은 2번과 **같은 경로**를 탄다 (US2, 규칙 10)
- [ ] 4. `children` **0개** → 안내 + 토큰 삭제 + 로그인 단계 복귀. 홈으로 가지 않는다 (US3)
- [ ] 5. 선택 대상에 **루트 `siteSeq`가 포함되지 않는다** (규칙 7)
- [ ] 6. `childSiteSeq`/`childSiteName` → `SiteOption`으로 정규화된다 (규칙 8)
- [ ] 7. 🔴 토큰은 있고 `siteSeq`는 없는 상태로 `/zones` 진입 → 로그인으로 리다이렉트 (US4, 규칙 6)
- [ ] 8. 🔴 본사 영역은 `siteSeq` 체크에서 제외된다 — 본사 로그인이 막히지 않는다 (규칙 6)
- [ ] 9. `clearTokens()`가 `siteSeq`·`siteName`을 함께 지운다 (규칙 3)
- [ ] 10. `useMe().data.locationName`이 선택한 `siteName`을 반환한다 (Carry-over)
- [ ] 11. 🔴 `DeploymentHistoryTabs.test.tsx`의 `vi.mock` 스텁이 제거되고, 전입/전출 판정이 실제 `locationName`으로 통과한다 (Carry-over)
- [ ] 12. `UserSiteSelect` 실패·403에서 **토큰이 남지 않는다** (§4)
- [ ] 13. `siteSeq`가 URL에 노출되지 않는다 (규칙 9)
- [ ] 14. MSW 핸들러가 `UserSiteSelect` 3종(0개·1개·2개 이상)을 제공한다
- [ ] 15. `npm run verify` 0 errors + `npm run test` green
- [ ] 16. 브라우저 확인(MSW 모드) — 0/1/N 3분기 + 가드 리다이렉트
- [ ] 17. 문서 동기화: `api-spec.md`(OQ-1A ② 해소·본사 평면 배열 메모) / `flow.md` §0(선택 단계 반영, `Open(021)` 해소) / `data-model.md` §4-3(`locationName` 출처) / `roadmap.md` §7-1·§12

---

## Open Questions

| ID | 내용 |
|---|---|
| OQ-021-A | **`children` 0개일 때 서버 응답**(빈 배열 / 에러 / 그 외) 미실측. 0개 계정이 테스트 데이터에 없어 **계정 생성이 필요**하다. 양쪽 모두 §4의 동일 처리로 수렴시켜 두었으나, 실측 후 메시지·분기를 재확인한다. (`api-spec.md` OQ-1A ① 승계) |
| OQ-021-B | **`AdminSiteSelect`가 평면 배열로 바뀐다**(사용자 전달 2026-10-06, **미실측**). `api-spec.md` §5-2의 실측 기록은 `GroupNode` 이중 재귀 트리다. 필드명 미정 → 본사 선택은 Phase 5로 미뤘다(§1). 실 응답 확보 시 `api-spec.md` 교정 + 본사 단계 추가 |
| OQ-021-C | **사업장 전환 UI** 필요 여부. 현재는 로그아웃→재로그인. 복수 소속 현장관리자의 실사용 빈도에 따라 결정 |
| OQ-021-D | 선택한 사업장을 **다음 로그인에서 기억**할지(기본 선택). 미결정 — 현재는 매 로그인마다 고른다 |

---

## 참고

- 선택 규칙 확정: `docs/api-spec.md` §2-2
- 실측 응답 타입: `docs/api-spec.md` §5-2 (3·4번 블록)
- 권한 밖 조회 함정: `docs/api-spec.md:211` (B-9)
- 로그인 `code` 사전: `docs/api-spec.md` §2-1
- 진입 흐름: `docs/flow.md` §0
- 목업: **없음.** 선택 목록은 `design-system.md` 토큰 + `AppButton`/`AppEmpty`로 구성
