# 029-point-detail-polish tasks

> 입력: 같은 폴더 [`spec.md`](./spec.md)
> 028 이 `T407` 로 끝나 **`T408` 부터** 쓴다.
> `[P]` = 병렬 가능 · `[US1~3]` = user story 소속
> 위험도 **A** → 잘게 분할(검증·제출·에러를 따로 둔다)

> 🔴 **이 spec 의 위험은 한 곳에 몰려 있다 — 전환 방향의 비대칭.**
> `authMethod: 10` 은 `nfcTagId` 없이 보내면 **400** 이다(WF-1-0 실측). 코드에 "TAG ID 없이
> NFC 로 보내는 경로" 가 **존재하지 않게** 만드는 것이 Phase 2~4 의 목표다.

---

## Phase 1: Setup — 검증 규칙 단일화 (모든 UI 선행)

> **독립 테스트 기준**: zod 스키마 단위 테스트만으로 14자리 HEX 규칙이 **세 소비처
> (추가 폼·수정 폼·전환 모달)에서 같은 메시지**를 내는 것이 확인된다.
> 🔴 **지금 `pointSchema` 는 추가·수정 공용이고 `authenticationMethod` 가 required 다.**
> 수정 폼에서 인증수단을 빼면 그 스키마를 그대로 쓸 수 없다 — **먼저 쪼갠다.**

- [x] T408 NFC TAG ID 규칙(14자리 HEX)을 **단일 출처**로 분리 — 패턴·메시지 export in src/features/points/form/schema.ts
- [x] T409 [P] **전환 모달용** 스키마(`authSwitchSchema` — `nfcTagId` 하나) in src/features/points/form/schema.ts
- [x] T410 [P] **수정 폼용** 스키마(`editPointSchema` — 인증수단 없음, `nfcTagId` 는 NFC 지점일 때만 검증) in src/features/points/form/schema.ts

## Phase 2: Foundational — 전환 경로 + MSW 실측 반영 (US2 선행 blocking)

> **독립 테스트 기준**: 훅을 직접 호출해 ① QR→NFC 가 `nfcTagId` 와 **함께** 나가고
> ② TAG ID 없는 NFC 요청이 **MSW 에서 400** 으로 돌아오는 것이 확인된다.

- [x] T411 인증수단 전환 mutation 훅 — `UpdatePoint` 호출 + `detail`·`lists` 무효화, **옵티미스틱 아님** in src/features/points/hooks/useChangeAuthMethod.ts
- [x] T412 🔴 **MSW 를 실측에 맞춘다** in src/mocks/handlers/points.ts
      - `authMethod: 10` 인데 `nfcTagId` 없으면 **400 + `"NFC 값을 입력해주세요."`**
      - `nfcTagId: null`·`''` 는 **무시**(B-15) · 전환해도 반대쪽 값(`qrCode`/`nfcTagId`)은 **남는다**
      - `reissueQrYn: true` 를 받아도 **`qrCode` 를 바꾸지 않는다**(B-37)
      > ⚠️ **이게 빠지면 mock 에서만 되는 화면이 된다** — 022 가 겪은 "실측 후 교정" 을 막는 자리

## Phase 3: US1 — 수정 버튼 이동 + 수정 모달 정리

> **독립 테스트 기준**: 헤더에 `삭제` 만 있고, 기본정보 카드의 아이콘으로 수정 모달이
> 열리며, 그 모달에 **인증수단 선택이 없다**.

- [x] T413 [US1] 수정 버튼을 **기본정보 카드**로 — 헤더에는 삭제만 in src/pages/service/points/PointDetailPage.tsx
- [x] T414 [US1] 기본정보 카드에 수정 아이콘(`SquarePen`) 수용 — 코스 `CourseInfo` 와 같은 조립 in src/features/points/components/detail/PointDetail.tsx
- [x] T415 [US1] 🔴 수정 폼에서 **인증수단 선택 제거** + `authMethod` **미전송**(`UpdatePoint` 는 진짜 부분 갱신) in src/features/points/form/EditPointForm.tsx
- [x] T416 [US1] TAG ID 필드는 **NFC 지점일 때만** 노출 — 폼 값이 아니라 **`point.authMethod`** 로 판단한다 in src/features/points/form/EditPointForm.tsx
- [x] T417 [P] [US1] `AuthMethodSelector` 소비처 확인 — **추가 폼에만** 남는지 in src/features/points/form/fields/AuthMethodSelector.tsx

## Phase 4: US2 — 인증수단 스위치 (🔴 이 spec 의 핵심)

> **독립 테스트 기준**: ① NFC→QR 은 확인 모달 한 번으로 바뀐다 ② QR→NFC 는 **TAG ID 를
> 받아야만** 저장된다 ③ 실패하면 모달이 **닫히지 않고** 스위치가 **제자리에 있다**.

- [x] T418 [US2] 자격증명 카드에 **QR|NFC 2칸 스위치** — 현재 값 선택 상태(목업 `authopt`) in src/features/points/components/detail/PointCredentialSwitch.tsx
- [x] T419 [US2] **NFC→QR** 확인 모달 → `authMethod: 9` 전송 in src/features/points/components/detail/PointCredentialSwitch.tsx
- [x] T420 [US2] 🔴 **QR→NFC** TAG ID 입력 모달(`authSwitchSchema`) → `authMethod: 10` + `nfcTagId` **함께** 전송 in src/features/points/components/detail/AuthMethodChangeDialog.tsx
- [x] T421 [US2] 🔴 **비옵티미스틱** — 응답 전까지 스위치가 이전 값에 머문다 + 저장 중 잠금 in src/features/points/components/detail/PointCredentialSwitch.tsx
- [x] T422 [US2] 실패 시 **모달 유지** + 서버 문구 그대로(전역 토스트, B-17 의 예외라 사유를 말해 준다) in src/features/points/components/detail/AuthMethodChangeDialog.tsx
- [x] T423 [US2] 전환 성공 → 자격증명 카드가 **반대쪽으로 교체**된다(현재 수단 것만 그린다) in src/features/points/components/detail/PointDetail.tsx

## Phase 5: US3 — QR 실물

> **독립 테스트 기준**: QR 지점에서 `qrCode` 문자열이 **이미지로** 보이고, 식별자가 함께
> 뜨며, **재발행 버튼이 없다**.

- [x] T424 [US3] `qrcode` 계열 패키지 도입 + `components.md` 컨벤션 등재 in package.json · docs/components.md
- [x] T425 [US3] 🔴 QR 카드 — **서버 `qrCode` 문자열 그대로** 인코딩(우리가 조합하지 않는다) + 식별자 표기 in src/features/points/components/detail/PointCredentialCard.tsx
- [x] T426 [US3] `qrCode` 가 `null` 인 경우 — "준비 중" 이 아니라 **이상 상태** 문구(생성 시 서버가 발급한다) in src/features/points/components/detail/PointCredentialCard.tsx
- [x] T427 [US3] 🔴 **재발행·다운로드·인쇄 버튼을 만들지 않는다** — B-37(재발행 무동작)·범위 결정 사유를 주석으로 in src/features/points/components/detail/PointCredentialCard.tsx
- [x] T428 [US3] NFC 카드 — TAG ID 표시 유지, 🔴 **QR 지점에는 남아 있어도 보여주지 않는다** in src/features/points/components/detail/PointCredentialCard.tsx

## Phase 6: 변경 이력 제거 + 레이아웃

- [x] T429 변경 이력 `PendingSection` **제거**(OQ-027-E 종결) in src/pages/service/points/PointDetailPage.tsx
- [x] T430 [P] `PendingBlock` 잔여 소비처 확인 — 기본정보의 `PendingValue` 4개는 **남긴다**(서버에 필드가 없을 뿐 설계에는 있다) in src/features/points/components/detail/PendingBlock.tsx
- [x] T431 2열 비율 재조정 — 우측이 자격증명 카드 하나가 되고 QR 카드가 커진다 in src/pages/service/points/PointDetailPage.tsx

## Phase 7: Polish

- [x] T432 [P] 스키마 단위 테스트 — 14자리 HEX 가 세 소비처에서 같은 메시지 in src/features/points/form/\_\_tests\_\_/schema.test.ts
- [x] T433 [P] 전환 테스트 — 2방향 · TAG ID 검증 · **실패 시 모달 유지** · 비옵티미스틱 in src/features/points/components/detail/\_\_tests\_\_/PointCredentialSwitch.test.tsx
- [x] T434 [P] 수정 폼 테스트 — 인증수단 선택이 **없다** · `authMethod` 미전송 · TAG ID 노출 조건 in src/features/points/form/\_\_tests\_\_/EditPointForm.test.tsx
- [x] T435 [P] QR 카드 테스트 — 이미지 렌더 · `null` 이상 상태 · **재발행 버튼 없음** in src/features/points/components/detail/\_\_tests\_\_/PointDetail.test.tsx
- [x] T436 `npm run verify` + `npm run test` **병렬 실행**, 756 → 증가 확인
- [x] T437 브라우저 확인(MSW) — DoD #12 의 4항목
- [x] T438 캡쳐 `points--상세.png` 재촬영 + `docs/ui-current/README.md` 갱신
- [x] T439 문서 동기화 — `screens.md` §1-3(지점 상세·추가/수정 행) · `patterns.md` §10-B(전환 비대칭을 사례로) · `roadmap.md` §7-1·§12
- [x] T440 DoD 14개 대조표 + `## 다음 spec으로 이월` 블록 in specs/phase3/029-point-detail-polish/tasks.md

---

## Dependencies & Execution Order

- **T408 → T409·T410** (패턴을 먼저 꺼내야 두 스키마가 그것을 쓴다). T409·T410 은 `[P]`
- **T410 → T415·T416** (수정 폼이 새 스키마를 쓴다)
- **T409 → T420** (전환 모달이 새 스키마를 쓴다)
- **T411·T412 → Phase 4 전체.** 🔴 **T412 가 빠지면 Phase 4 의 테스트가 가짜로 통과한다** —
  mock 이 TAG ID 없는 NFC 를 받아주면 "되는 줄 알고" 넘어간다
- **Phase 3 과 Phase 4 는 병렬 가능**하지만 **T415(수정 폼에서 인증수단 제거)와
  T418(스위치 신설)은 같은 커밋에 둔다** — 사이에 끊기면 **인증수단을 바꿀 수단이
  아무 데도 없는 상태**가 된다
- **Phase 5 는 독립** — Phase 3·4 와 병렬 가능(자격증명 카드의 다른 가지)
- **Phase 6 → T431** 은 Phase 5 뒤(QR 카드 크기가 정해져야 비율을 정한다)
- **Phase 7** 은 전부 뒤. T432~T435 `[P]` → T436 → T437 → T438 → T439 → T440

## 제약 (구현 중 지킬 것)

1. 🔴 **"TAG ID 없이 `authMethod: 10`" 을 보내는 경로를 만들지 않는다.** 전환 모달이
   유일한 입구이고 스키마가 막는다. 서버도 400 으로 막지만 **그건 마지막 방어선**이다.
2. 🔴 **스위치는 응답 후에 움직인다.** 눌린 즉시 바뀌면, TAG ID 입력을 취소했을 때
   **서버와 화면이 어긋난 채로 남는다.**
3. 🔴 **`qrCode` 를 우리가 조합하지 않는다** — 서버 문자열 그대로 인코딩한다. 한 글자만
   달라도 **앱이 못 읽는 QR** 이 된다.
4. 🔴 **재발행 버튼을 만들지 않는다**(B-37). 다운로드·인쇄도 이번 범위가 아니다 —
   "되는 것처럼 보이는 버튼" 을 만들지 않는 것이 요점이다.
5. **지금 쓰는 수단의 자격증명만 그린다** — 반대쪽 잔존값(`qrCode`/`nfcTagId`)은 숨긴다.
   지우는 것은 서버가 못 한다(B-15) — 우리는 **보여주지 않을 뿐**이다.
6. **기본정보의 `PendingValue` 4개는 남긴다** — 변경 이력과 다르다. 그건 **API 가 없는
   기능**이었고, 이쪽은 **응답에 필드가 없는 값**이다(B-19, 추가되면 바로 채워진다).

## 백엔드 대기

**없음.** B-37(재발행)·B-15(값 비우기)·B-38(오류 메시지)은 **전부 우회해서** 완결한다 —
재발행 버튼을 만들지 않고, 잔존값을 숨기고, 서버 문구를 그대로 노출한다.

---

## DoD 14개 대조표 (T440, 2026-10-13)

| # | 조건 | 결과 | 근거 / 사유 |
|:-:|---|:-:|---|
| 1 | 수정 버튼이 **기본정보 카드**, 헤더엔 삭제만 | ✅ | `PointDetail` `DetailSection action` · 테스트 `헤더에는 삭제만 있다` |
| 2 | 인증수단 **QR\|NFC 2칸 스위치**, 현재 값 선택 상태 | ✅ | `PointCredentialSwitch` · 테스트 `현재 수단이 선택 상태이고, 다시 눌러도 요청이 나가지 않는다` |
| 3 | **NFC→QR** 확인 모달 → `authMethod: 9` | ✅ | 테스트 `확인 모달을 거쳐 authMethod 9 를 보낸다` |
| 4 | 🔴 **QR→NFC** TAG ID 입력 모달, TAG ID 없이 전송하는 경로가 **없다** | ✅ | 테스트 3건(빈 값·형식 오류에서 **요청이 안 나간다**) + 훅 타입이 NFC 방향에 `nfcTagId` 를 **필수로** 받는다 |
| 5 | **비옵티미스틱** | ✅ | 테스트 `응답이 와도 스위치는 prop 을 따른다` |
| 5-1 | 수정 모달에 인증수단 **없음**, TAG ID 는 NFC 지점만, **같은 zod 스키마** | ✅ | `EditPointForm` · `schema.test.ts` 18건(세 소비처가 **같은 문구**를 낸다) |
| 6 | 실패 시 **모달 유지** + 서버 문구 그대로 | ✅ | 테스트 `실패하면 모달이 닫히지 않는다` |
| 7 | 🔴 **QR 재발행 버튼 없음**(B-37) + 사유 기록 | ✅ | `PointQrCode` 주석 · `components.md` 5조 · 테스트 `재발행 버튼을 만들지 않았다` |
| 8 | 🔴 **QR 을 화면에 그리지 않고 PNG 로 내려받는다**(변경된 조건) | ✅ | 🔴 **브라우저 확인 중 사용자 결정으로 바뀐 조건.** 원래는 "QR 이미지가 보이고 식별자가 함께 표시된다" 였다 — **화면을 찍어 현장 밖에서 인증**할 수 있다는 지적. 식별자 문자열도 함께 숨겼다(테스트로 고정) |
| 9 | **지금 쓰는 수단의 자격증명만** 그린다 | ✅ | `PointCredentialCard` 분기 — 전환해도 반대쪽 값이 서버에 남지만(B-15) 보여주지 않는다 |
| 10 | 변경 이력 제거 + 2열 비율 재조정 | ✅ | 🔴 **비율만 바꾸는 대신 구조를 바꿨다**(사용자 결정) — 기본정보를 우측으로 옮겨 좌(시간이 쌓이는 것) / 우(이 지점이 무엇인가)로 가른다. 좁은 폭 `order` 보정 포함 |
| 11 | `verify` 0 errors + `test` green (756 → 증가) | ✅ | **756 → 772**(+16), 77 files |
| 12 | 브라우저 확인 4항목 이상 | ✅ | **2회**(QR 재설계 전 7항목 + 재설계·재구성 후 5항목) |
| 13 | 캡쳐 재촬영 + `README` 갱신 | ✅ | `points--상세.png` 1장. **나머지 12장은 ±1% 노이즈라 덮지 않았다** |
| 14 | — | — | (spec DoD 는 13개 + 5-1 로 실제 14항목) |

**14/14 충족.**

### 계획 외 작업

| 내용 | 사유 |
|---|---|
| 🔴 **보강 실측 1회 추가** | mock 규칙 하나가 미실측 가정이었다 — "NFC 지점은 수정할 때마다 TAG ID 를 다시 실어야 하나?" 지점을 만들어 찍으니 **400 은 `authMethod` 를 명시할 때만** 났다(이름·memo·`useYn` 부분 갱신은 전부 200). 이게 수정 폼이 `authMethod` 를 생략해도 되는 근거다 |
| 🔴 **mock 의 `name` 필수 검사 제거** | 실서버는 부분 갱신이라 `name` 없이 200 이다. 안 고쳤으면 **인증수단 전환이 dev 에서만 400** 이 나 있지도 않은 버그를 쫓았다 |
| **B-39 신설** | NFC 지점 생성이 500 나서 파봤더니 **TAG ID 중복**이었다. 유효성 오류가 500 으로 새서 **사용자에게 사유를 보여줄 수 없다**. ⚠️ **삭제한 지점이 태그를 계속 점유**한다 |
| **B-19 철회** | 생성·수정 메타를 쓰던 4칸을 화면에서 치웠다 — 받을 자리를 없애 놓고 요청만 남겨 두지 않는다(B-34·B-29 선례) |
| **QR 전면 재설계** | 브라우저 확인 중 **"QR 이 실제로 찍히면 안 될 것 같다"**. 보안 근거가 명확해 바로 반영했다 — 관리 화면의 QR 은 **현장에 가지 않고 인증하는 길**이 된다 |
| **지점 상세 2열 재구성** | 같은 확인에서 "placeholder 값들이 어떻게 될지 모르겠다 → 기본정보를 우측으로" 제안. 변경 이력을 치우며 비어 보이던 우측 칸이 함께 해결됐다 |
| `DetailSection` 에 `action` 슬롯 추가 | 수정 아이콘을 넣으려고 제목 줄을 두 번 그릴 뻔했다 |

### 남은 것 (029 범위 밖)

| | 내용 | 막힌 이유 |
|---|---|---|
| OQ-029-A | QR **다운로드 형식은 해결**(PNG). **인쇄**는 남음 | 인쇄물에 지점명·사업장을 넣을지 미정 |
| OQ-029-B | QR **재발행** | **B-37** — 서버에서 동작하지 않는다 |
| OQ-029-C | **좌표 입력** | `spec 032`(지도)에서 "좌표 없는 지점을 어떻게 다룰지" 와 함께. 표시는 029 에서 끝냈다 |

---

## 다음 spec으로 이월

**`spec 030`(목록 반응형 카드)로 넘기는 것: 없음.** 029 는 지점 상세 안에서 닫혔다.

다만 **`spec 032`(지도)가 가져갈 재료**가 둘 있다:

1. **좌표 표시가 이미 있다**(`PointDetail` 의 `formatCoords`) — 없으면 `-`. 지도에서
   "좌표 없는 지점" 을 어떻게 다룰지 정할 때 **입력 UI 도 함께** 설계한다(OQ-029-C).
2. 🔴 **B-33(서버 범위 검증 없음)이 입력을 막고 있다.** `gpsLat: 123` 이 실제로 저장돼
   있어, 입력을 열면 프론트가 -90~90 / -180~180 검사를 떠안아야 한다.
