/**
 * 도메인 Enum SSOT.
 * 출처: docs/data-model.md §2-2 (1:1 일치).
 * 라벨 매핑은 같은 파일에 둠 — 신규 enum 추가 시 라벨도 함께 추가.
 *
 * 003에서 임시로 `features/auth/types/me.ts`에 두었던 Role 계열을 본 파일로 통합.
 * `me.ts`는 본 파일에서 import해 사용.
 */

// 권한
export type AdminRole = 'SYSTEM' | 'MASTER' | 'MANAGER'
export type FieldRole = 'FIELD_MANAGER' | 'WORKER'
export type Role = AdminRole | FieldRole

// 사용자 상태
export type UserStatus = 'ACTIVE' | 'INACTIVE'

// 사업장 운영 상태
export type LocationStatus = 'OPERATING' | 'SUSPENDED' | 'TERMINATED'

// 인증 수단
export type AuthMethod = 'QR' | 'NFC'

// 🔴 **순찰이력 결과는 여기 없다** — `features/course-history/lib/historyBadge.ts` 다.
//
// `CourseResult`('COMPLETE' | 'PROCESSING' | 'INCOMPLETE') 와 `PointResult`(6종) 를
// 두고 있었지만 **소비처가 0개인 dead 선언**이었고(`spec 036` T492 확인), 무엇보다
// 서버와 모양이 맞지 않았다: 결과는 **문자열 enum 이 아니라 정수 `status`** 이고
// (코스 0~2 / 지점 0~4, 값이 겹치는데 뜻이 다르다) `overTimeYn`·`hasMemo` 와의
// **조합으로 유도**된다. 문자열 사전을 SSOT 로 두면 서버 값을 그 사전으로 번역하는
// 어댑터가 생기는데, 그 어댑터가 곧 조합 규칙이라 **사전 쪽이 군더더기가 된다.**
// → 매핑은 `historyBadge.ts` 가 **화면 단위로** 갖는다(`api-spec.md` §4 실측 분포).

// 요일
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

// 배치 요청 방향 (파견 / 복귀)
export type DeploymentDirection = 'DEPLOY' | 'RETURN'

// 배치 요청 상태
export type DeploymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

// ─────────────────────────────────────────────
// 라벨 매핑 (화면 표시용)
// 콘텐츠 톤은 docs/design-system.md §4 따름.
// ─────────────────────────────────────────────

export const roleLabel: Record<Role, string> = {
  SYSTEM: '시스템관리자',
  MASTER: 'Master',
  MANAGER: 'Manager',
  FIELD_MANAGER: '현장관리자',
  WORKER: '근무자',
}

export const userStatusLabel: Record<UserStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
}

export const locationStatusLabel: Record<LocationStatus, string> = {
  OPERATING: '운영중',
  SUSPENDED: '중지',
  TERMINATED: '종료',
}

export const authMethodLabel: Record<AuthMethod, string> = {
  QR: 'QR',
  NFC: 'NFC',
}

export const dayOfWeekLabel: Record<DayOfWeek, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}

export const deploymentDirectionLabel: Record<DeploymentDirection, string> = {
  DEPLOY: '파견',
  RETURN: '복귀',
}

export const deploymentStatusLabel: Record<DeploymentStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인',
  REJECTED: '거부',
  CANCELLED: '취소',
}
