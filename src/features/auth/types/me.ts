/**
 * 인증 / 본인 정보 도메인 타입.
 * 출처: docs/data-model.md §2-2 Enum, §4-3 인증/본인 정보.
 *
 * 004 `src/types/enum.ts` SSOT 통합 전까지 도메인 폴더(`features/auth/types/`)에 둔다.
 */

// 권한 — data-model.md §2-2
export type AdminRole = 'SYSTEM' | 'MASTER' | 'MANAGER'
export type FieldRole = 'FIELD_MANAGER' | 'WORKER'
export type Role = AdminRole | FieldRole

// 사용자 상태
export type UserStatus = 'ACTIVE' | 'INACTIVE'

/**
 * 서버 응답 그대로의 본인 정보(`/auth/me` 응답 페이로드).
 * - data-model.md §4-3 `MeRaw`와 1:1.
 * - 화면에 직접 노출하지 않는다. `MeDto`로 변환 후 사용.
 */
export interface MeRaw {
  id: string
  name: string
  phone: string
  role: Role
  groupId?: string
  groupName?: string
  groupPath?: string
  locationId?: string
  locationName?: string
  status: UserStatus
  registeredAt: string
}

/**
 * 클라이언트 상태 저장용 본인 정보(가드·표시 최소 필드).
 * - data-model.md §4-3 `MeDto`와 1:1.
 */
export interface MeDto {
  id: string
  name: string
  role: Role
  groupName?: string
  locationName?: string
}
