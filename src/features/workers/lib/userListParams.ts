import {
  clampPageSize,
  omitIfAll,
  parseIntegerFilter,
  parsePageNumber,
} from '@/features/course-history/lib/courseHistoryListParams'
import type { UserListParams } from '../types/user'

/**
 * URL 쿼리스트링 ↔ `UserList` 서버 파라미터 변환 (`spec 038` T598).
 *
 * 🔴 026 `noticeListParams` 와 같은 규약 — 상한 100 · 1-based · 빈 값은 키를 뺀다 · 파싱 실패는
 * 기본값으로 수렴. 헬퍼는 `course-history` 의 것을 **재사용**한다.
 */

/** URL 쿼리 키 — 전부 문자열이다 */
export interface UserQuery {
  /** 검색 → `searchKey` */
  q?: string
  /** 권한 → `codeSeq` */
  role?: string
  /** 근무 상태 → `workYn` (`'true'`/`'false'`) */
  work?: string
  page?: string
  size?: string
}

/** 🔴 `'true'`/`'false'` 만 인정한다 — 그 외(`전체` 센티넬·손으로 고친 값)는 키를 뺀다 */
const parseBoolean = (value?: string): boolean | undefined => {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export const toUserListParams = (siteSeq: number, query: UserQuery): UserListParams => ({
  // 🔴 서버 이름은 `siteId` 다(B-12)
  siteId: siteSeq,
  searchKey: omitIfAll(query.q),
  codeSeq: parseIntegerFilter(query.role),
  workYn: parseBoolean(query.work),
  pageNumber: parsePageNumber(query.page),
  pageSize: clampPageSize(parseIntegerFilter(query.size)),
})
