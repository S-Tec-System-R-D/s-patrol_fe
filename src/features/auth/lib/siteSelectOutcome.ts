import type { SiteOption } from '@/features/auth/types/site'

/**
 * 접근 가능 사업장 목록 → 다음 행동.
 *
 * 분기 규칙은 `api-spec.md` §2-2 확정분이다 — **0개 → 예외 / 1개 → 자동 진입(선택 UI
 * 스킵) / 2개 이상 → 선택**. 단일 소속인지 복수인지는 이 API를 호출해야만 알 수 있어
 * 로그인 직후 무조건 호출한 뒤 분기한다.
 *
 * 🔴 **`0개` 의 의미가 바뀌었다**(2026-10-19). 루트가 선택지에 포함되면서(`siteOptions.ts`)
 * 정상 응답은 **최소 1개**가 보장된다 — `0개` 는 이제 "소속 사업장이 없다" 가 아니라
 * **"응답에서 고를 수 있는 것을 하나도 못 찾았다"**(`data` 가 `null`·루트 `siteSeq` 가
 * 정수가 아니고 `children` 도 비었음) 즉 **비정상 응답 방어선**이다. 분기를 지우지 않는 이유:
 * 서버가 예상 밖 형태를 주면 분기가 없는 쪽이 **빈 화면**으로 끝난다(019 방어 패턴).
 *
 * 020 `loginResult.ts`와 같은 패턴으로 **순수함수**로 둔다. 화면 테스트보다 싸게 3분기
 * 전체를 고정할 수 있고, 특히 "1개일 때 선택 UI를 건너뛰지만 **저장은 건너뛰지 않는다**"는
 * 것을 호출부에서 구조적으로 보장하게 만든다(`spec 021` §3 규칙 10).
 */

export type SiteSelectOutcome =
  /** 1개 — 선택 UI 없이 이 사업장으로 자동 진입 */
  | { kind: 'auto'; site: SiteOption }
  /** 2개 이상 — 사용자가 고른다 */
  | { kind: 'choose'; options: SiteOption[] }
  /** 0개 — 진입 불가. 소속 사업장이 없는 현장관리자 */
  | { kind: 'none'; message: string }

/**
 * 고를 것이 하나도 없을 때의 안내 문구.
 *
 * ✅ **OQ-021-A 해소**(2026-10-19) — "0개 계정이 테스트 데이터에 없어 미실측" 이던 항목은
 * 루트 포함으로 **응답 형태상 0개가 불가능**해져 의미가 없어졌다. 문구는 비정상 응답
 * 방어선에 그대로 쓴다 — 사용자가 할 수 있는 일(관리자 문의)이 같다.
 */
export const NO_SITE_MESSAGE = '소속된 사업장이 없습니다. 관리자에게 문의해주세요.'

export const resolveSiteSelectOutcome = (options: SiteOption[]): SiteSelectOutcome => {
  // 🔴 정상 응답이면 루트가 있어 최소 1개다 — 여기 오는 것은 **비정상 응답**이다
  if (options.length === 0) return { kind: 'none', message: NO_SITE_MESSAGE }

  // 1개여도 `auto`로 **값을 담아 돌려준다.** 호출부가 `choose`와 같은 저장 경로를 타게
  // 하려는 것이다 — "자동 진입"을 "저장 없이 이동"으로 구현하면 siteSeq 없이 홈에 들어가고,
  // 그 조회는 403이 아니라 200 + 빈 목록으로 돌아와 조용히 틀린 화면이 된다.
  if (options.length === 1) return { kind: 'auto', site: options[0] }

  return { kind: 'choose', options }
}
