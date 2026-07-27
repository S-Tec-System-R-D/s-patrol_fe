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

// 근무 상태 (근무자)
export type WorkStatus = 'WORKING' | 'OFF_DUTY'

// 사업장 운영 상태
export type LocationStatus = 'OPERATING' | 'SUSPENDED' | 'TERMINATED'

// 인증 수단
export type AuthMethod = 'QR' | 'NFC'

// 코스 이력 결과
export type CourseResult = 'COMPLETE' | 'PROCESSING' | 'INCOMPLETE'

// 지점 이력 결과 (코드 PatrolPointResultState 기반)
export type PointResult =
  | 'PENDING'
  | 'RUNNING'
  | 'SKIP'
  | 'NORMAL'
  | 'RECORDED'
  | 'TIMEOUT'

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

export const workStatusLabel: Record<WorkStatus, string> = {
  WORKING: '근무 중',
  OFF_DUTY: '근무 종료',
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

export const courseResultLabel: Record<CourseResult, string> = {
  COMPLETE: '완료',
  PROCESSING: '진행중',
  INCOMPLETE: '미완료',
}

export const pointResultLabel: Record<PointResult, string> = {
  PENDING: '대기중',
  RUNNING: '진행중',
  SKIP: '순찰제외',
  NORMAL: '이상없음',
  RECORDED: '순찰기록',
  TIMEOUT: '시간초과',
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
