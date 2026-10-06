/**
 * 인증 / 본인 정보 도메인 타입.
 * 출처: docs/data-model.md §4-3.
 *
 * Role / UserStatus 등 도메인 Enum은 004 SSOT(`@/types/enum`)에서 import.
 * 본 파일은 도메인 DTO(`MeRaw` / `MeDto`)만 책임.
 */

import type { Role, UserStatus } from '@/types/enum'

// 기존 import 호환을 위해 재공개(003에서 작성된 코드가 me.ts를 통해 Role을 가져오던 경로 보존)
export type { AdminRole, FieldRole, Role, UserStatus } from '@/types/enum'

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
 *
 * **출처는 `accessToken` JWT 클레임이다**(020). 서버에 본인 정보 조회 엔드포인트가 없다.
 * - `userSeq`/`name`/`role`은 클레임에서 바로 나온다.
 * - 🔴 `locationName`·`groupName`은 **클레임에 없다.** 020에서는 항상 `undefined`이고,
 *   사업장명은 `spec 021`의 `UserSiteSelect` 결과로 채운다. 그래서 필드는 남겨 둔다.
 */
export interface MeDto {
  /** JWT `userSeq`. ID는 number + `~Seq` 접미사(CLAUDE.md B4) */
  userSeq: number
  name: string
  role: Role
  groupName?: string
  locationName?: string
}
