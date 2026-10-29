import { useQuery } from '@tanstack/react-query'
import { fetchUserSiteSelect } from '@/features/auth/api/userSiteSelect'
import { toSiteOptions } from '@/features/auth/lib/siteOptions'

/**
 * 현장관리자의 사업장 선택지 — 로그인 뒤 사업장 전환(`spec 061`)이 쓴다.
 *
 * - 선택지 규칙은 로그인과 같다 — 같은 API · 같은 어댑터(`toSiteOptions`, 루트 포함).
 *   로그인(`LoginForm`)은 react-query 밖에서 직접 부른다 — 그대로 둔다(A3).
 * - 🔴 **키에 `userSeq` 를 넣는다.** 로그아웃은 캐시를 비우지 않는다(`LogoutButton`) — 빠지면
 *   다음에 로그인한 계정에 앞 계정의 사업장 목록이 붙는다.
 * - 🔴 `enabled` 는 **현장 레이아웃만** 켠다. 본사 토큰으로 부르면 403 이다(`api-spec.md` §2-2 상호 배타).
 */
export const useSiteOptions = (userSeq: number | undefined) =>
  useQuery({
    queryKey: ['site-options', userSeq],
    queryFn: async () => toSiteOptions(await fetchUserSiteSelect()),
    enabled: userSeq !== undefined,
    // 소속은 세션 중에 바뀌지 않는다 — 다시 받을 이유가 없다
    staleTime: Infinity,
  })
