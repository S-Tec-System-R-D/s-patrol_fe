/**
 * 인증 / 본인 정보 도메인 타입.
 * 출처: docs/data-model.md §4-3.
 *
 * Role / UserStatus 등 도메인 Enum은 004 SSOT(`@/types/enum`)에서 import.
 * 본 파일은 도메인 DTO(`MeDto`)만 책임.
 *
 * (020에서 `MeRaw`를 제거했다. `GET /api/auth/me` 응답 페이로드 타입이었는데 그 엔드포인트가
 *  **백엔드에 존재하지 않는다** — 사용자 정보는 JWT 클레임에서 오고, 그 형태는
 *  `features/auth/types/claims.ts`의 `AccessTokenClaims`다.)
 */

import type { Role } from '@/types/enum'

// 기존 import 호환을 위해 재공개(003에서 작성된 코드가 me.ts를 통해 Role을 가져오던 경로 보존)
export type { AdminRole, FieldRole, Role, UserStatus } from '@/types/enum'

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
