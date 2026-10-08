import { useMemo } from 'react'
import { decodeAccessToken } from '@/lib/auth/jwt'
import { getAccessToken } from '@/lib/auth/tokens'
import { getSiteName } from '@/lib/auth/site'
import { toRole } from '@/features/auth/types/claims'
import type { MeDto } from '@/features/auth/types/me'

/**
 * 본인 정보 훅.
 *
 * **엔드포인트가 없다.** 서버에 본인 정보 조회 API가 존재하지 않아(`api-spec.md` §1-2)
 * `accessToken` JWT 클레임을 디코딩해서 얻는다. 019까지는 실재하지 않는 `/api/auth/me`를
 * 호출하고 MSW mock이 그것을 받아주고 있었다.
 *
 * - **네트워크 호출이 없다.** 디코딩은 동기이므로 react-query를 쓰지 않는다.
 * - `locationName`은 **선택한 사업장명**이다(021). JWT에 없으므로 로컬 저장값에서 읽는다.
 * - 🔴 **반환 모양 `{ data, isLoading, isError }`는 react-query 시절 그대로 유지**한다.
 *   소비처 12곳과 `AuthGuard`/`RequireRoute`/`RequireRole`의 분기를 건드리지 않기 위한 것이고
 *   (A3), `spec 021`에서 사업장 선택이 붙으면 비동기 로딩이 다시 생길 수 있다.
 * - `isLoading`은 항상 `false`다. 동기이므로 로딩 상태가 존재하지 않는다.
 * - `isError`는 **"사용자를 특정할 수 없다"**는 뜻이다 — 토큰 없음 / 디코딩 실패 /
 *   `role` 매핑 실패(미실측 role) 세 경우. 가드가 이걸 보고 로그인으로 보낸다.
 */

interface UseMeResult {
  data: MeDto | undefined
  isLoading: boolean
  isError: boolean
}

const FAILED: UseMeResult = { data: undefined, isLoading: false, isError: true }

/**
 * 토큰 → 결과. 훅 밖의 순수함수로 둔다.
 *
 * `useMemo` 콜백 안에서 조건부 early return을 하면 `react-hooks/preserve-manual-memoization`
 * 이 memoization 보존을 보장할 수 없다고 막는다. 계산을 빼내면 콜백이 단일 호출식이 된다.
 */
const resolveMe = (token: string | null, siteName: string | null): UseMeResult => {
  const claims = decodeAccessToken(token)
  if (!claims) return FAILED

  const role = toRole(claims)
  // 미실측 role(Master·Manager·근무자)은 매핑이 없어 null이 된다. 토큰은 유효하지만
  // 권한을 특정할 수 없으므로 통과시키지 않는다 — spec 020 §3 규칙 6.
  if (!role) return FAILED

  return {
    data: {
      // 클레임은 문자열('13'), 우리 모델은 number(B4) — 변환은 이 한 자리에서만.
      userSeq: Number(claims.userSeq),
      name: claims.userName,
      role,
      // 🔴 사업장명은 클레임이 아니라 **선택 결과**에서 온다(spec 021). 서버는 고른
      // siteSeq를 기억하지 않고 토큰에도 담지 않으므로, 로컬에 저장한 값이 유일한 출처다.
      locationName: siteName ?? undefined,
      // groupName은 여전히 undefined다 — 현장관리자·근무자는 사업장에만 소속되고
      // 그룹에는 소속되지 않는다(api-spec.md §2-2). 본사 계정 영역은 Phase 5.
    },
    isLoading: false,
    isError: false,
  }
}

export const useMe = (): UseMeResult => {
  const token = getAccessToken()
  const siteName = getSiteName()

  // 토큰·사업장명이 같으면 같은 객체 참조를 유지한다. 매 렌더마다 새 `data`를 만들면
  // 이 값을 의존성에 넣은 소비처가 불필요하게 재계산된다.
  return useMemo(() => resolveMe(token, siteName), [token, siteName])
}
