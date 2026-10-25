# 999 — 콘텐츠 톤 점검 (T867)

> 기준: `design-system.md` §4. 2026-10-23 grep(값 없음 · 호칭 · `AppAlertDialog` 제목/설명 · `AppEmpty` title/description).
> 🔴 **확인 후 고친다**(T868) — 044 · 045 등에서 사용자가 정한 문구가 섞여 있다(OQ-999-B).

## ✅ 사용자 결정 (T868, 2026-10-23)

| 묶음 | 결정 |
|---|---|
| **A** 값 없음 `—` → `-` | ✅ **고친다**(T869 완료 — 4곳 + 테스트 단언 5곳) |
| B 호칭 "님" · C 삭제 부연 · E 빈 상태 다음 행동 | ⏸ **고치지 않는다**(사용자 선택에서 제외) — 기록으로 둔다 |
| **D** 본사 확인 제목(명사형) | ✅ **둔다 · 규칙에 예외로 적는다** — `design-system.md` §4-2(T874) |

## A. 값 없음 `—` → `-` (§4-5A) — 규칙 위반

| 위치 | 현재 |
|---|---|
| `features/admins/lib/adminList.ts:87` | 담당 그룹 없음 `—` (045) |
| `features/sites/components/SiteColumns.tsx:12` | 담당 관리자 `—` (044) |
| `features/sites/components/SiteInfoCard.tsx:15` | 소속 그룹 등 `—` (044) |
| `features/sites/components/HealthCheckCard.tsx:29` | 값 없음 `—` (044) |

제안: 4곳 모두 `-`. 044 spec 의 "담당 관리자 `—`" 서술도 함께 정정.

## B. 호칭 "님" (§4-6) — 규칙 위반

| 위치 | 현재 | 제안 |
|---|---|---|
| `features/deployments/components/DeploymentRequestActions.tsx:58` | `{이름}님의 {배치} 요청을 반려합니다. …` | `{이름}의 {배치} 요청을 반려합니다. …` |

## C. 위험 동작 부연 없음 (§4-2 "삭제된 데이터는 복구할 수 없습니다")

| 위치 | 현재 | 제안 설명 |
|---|---|---|
| `pages/service/points/PointDetailPage.tsx:143` | 제목 "지점을 삭제하시겠습니까?" · 설명 없음 | "삭제된 지점은 복구할 수 없습니다." |
| `pages/service/users/UserDetailPage.tsx:221` | 제목 "근무자를 삭제하시겠습니까?" · 설명 없음 | "삭제된 근무자는 복구할 수 없습니다." |

## D. 확인 제목 형식 (§4-2 "{대상}을(를) {동작}하시겠습니까?") — 🔴 사용자 결정 문구

| 위치 | 현재 제목 | 결정 |
|---|---|---|
| `features/groups/components/GroupEditDialog.tsx:234` | `{단계}그룹 삭제` | 043 사용자 결정 |
| `features/sites/components/SiteDeleteDialog.tsx:40` | `사업장 삭제` | 044 |
| `features/admins/components/AdminDetailDialog.tsx:241` | `담당 그룹 해제` | 045 |

선택지: ① 규칙에 맞춘다(`"…을(를) 삭제하시겠습니까?"`) ② 둔다 — 본사 화면은 **명사형 제목 + 설명** 으로, 규칙에 예외로 적는다.

## E. 빈 상태 "다음 행동" 줄 없음 (§4-3)

| 위치 | 현재 title | 제안 description |
|---|---|---|
| `pages/admin/locations/LocationsPage.tsx:174` | 이 그룹에 등록된 사업장이 없습니다. | "사업장 추가로 등록해주세요." |
| `pages/admin/admins/AdminsPage.tsx:168` | 이 그룹에 할당된 관리자가 없습니다. | "관리자 상세에서 담당 그룹을 추가해주세요." |
| `features/sites/components/SiteManagersCard.tsx:64` | 지정된 담당 관리자가 없습니다. | (카드 머리에 "관리자 메뉴에서 그룹 단위로 지정합니다" 가 이미 있다 — 둔다) |
| `features/deployments/components/DeploymentBoard.tsx:300` | 탭별 빈 문구 | 확인 필요 — 요청이 오는 쪽(근무자 앱)이라 화면에서 할 행동이 없다 → 둔다 |
| `features/admins/components/GroupPicker.tsx:52` | 추가할 수 있는 그룹이 없습니다. | 둔다(모든 그룹을 이미 맡음 — 할 행동 없음) |
| `features/sites/components/EmergencyContactCard.tsx:17` · `SiteManagersCard.tsx:54` | 지원 안 됨 · 불러오기 실패 | 둔다(안내 · 실패는 별도 패턴) |

## 참고 — 자동 점검이 어려워 제외

- §4-4 에러 문구(원인 + 해결책) — 서버 문구를 그대로 띄우는 곳이 많다(래퍼 · (D) 문자열). 화면 고유 문구는 폼 검증이 대부분이고 규칙을 따른다.
- 마침표 유무 혼재(빈 상태 title) — 규칙 없음.
