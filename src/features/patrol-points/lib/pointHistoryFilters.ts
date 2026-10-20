import type { AppSelectOption } from '@/components/app/AppSelect'
import { pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import { AUTH_METHOD, POINT_HISTORY_STATUS } from '@/features/course-history/types'
import { ALL_VALUE } from '@/lib/listQuery'

/**
 * 지점 순찰이력 필터의 선택지 (`spec 037` T544).
 *
 * 🔴 **코스 선택지는 여기서 만들지 않는다** — `patrol-zones/lib/courseHistoryFilters.ts` 의
 * `courseFilterOptions` 를 **그대로 쓴다**(036 자산). 사업장의 코스 목록으로 만드는 것은
 * 두 화면이 글자까지 같다.
 *
 * 🔴 **라벨의 단일 출처는 `historyBadge` 다** — 뱃지와 필터에 같은 문구를 두 번 쓰면
 * 한쪽만 고쳐진다(018 규약, 036 승계).
 */

const allOption: AppSelectOption = { value: ALL_VALUE, label: '전체' }

/**
 * 인증수단 선택지 — `9 QR` / `10 NFC`.
 *
 * ⚠️ **라벨을 `historyBadge` 에서 가져오지 않는다** — 인증수단은 뱃지 매핑이 아니라
 * **서버 사전 그대로**(`api-spec.md` §4)이고, 응답의 `authMethodName` 이 같은 문자열을
 * 준다. 변환할 것이 없다.
 */
export const authMethodFilterOptions: AppSelectOption[] = [
  allOption,
  { value: String(AUTH_METHOD.QR), label: 'QR' },
  { value: String(AUTH_METHOD.NFC), label: 'NFC' },
]

/**
 * 결과 선택지 — **지점 사전**의 `3 미완료` · `4 완료` **2종뿐이다.**
 *
 * 🔴 **뱃지는 5종인데 선택지는 2종이다.** 목업(`03`)은 5종을 다 칩으로 그렸지만 서버에
 * 보낼 수 있는 값이 아니다:
 * - `이상없음`↔`순찰기록` 은 `hasMemo` **파생**이다 — `status` 는 둘 다 `4` 라 거를 값이 없다
 * - `시간초과` 는 `overTimeYn` **독립 축**이고 **서버에 그 필터가 없다**(코스 쪽에서 요청을
 *   철회한 B-34 와 같은 자리) — 목록에 뱃지로 **보이지만** 거를 수는 없다
 * - `대기중`(0)·`진행중`(1) 은 **이 응답에 아예 오지 않고**(`checkDt` 가 있는 행만 준다),
 *   `순찰제외`(2) 는 전 사업장 **0건**이다(`api-spec.md` §4 분포표)
 *
 * 🔴 그래서 **거를 수 없는 값을 선택지에 두지 않는다** — 고르면 0건이 돌아오는 필터는
 * "데이터가 없다" 는 **거짓 신호**를 준다.
 *
 * ⚠️ 라벨은 `pointCheckBadge` 가 만든다. `미완료`(3)는 `checkDt` 유무로 `미인증`↔`미완료`
 * 가 갈리는데, **목록에는 `checkDt` 가 있는 행만** 오므로 여기서는 항상 `미완료` 다.
 * `완료`(4)는 `hasMemo` 로 갈리므로 **필터 라벨은 `이상없음` 이 아니라 그 상위어**가
 * 필요하다 — 아래처럼 직접 적는다(뱃지 문구를 그대로 쓰면 `순찰기록` 인 행이 빠진 것처럼
 * 읽힌다).
 */
export const pointResultFilterOptions: AppSelectOption[] = [
  allOption,
  {
    value: String(POINT_HISTORY_STATUS.INCOMPLETE),
    // `checkDt` 가 있는 행만 오므로 뱃지 라벨과 같다
    label: pointCheckBadge(POINT_HISTORY_STATUS.INCOMPLETE, '2026-01-01T00:00:00', false).label,
  },
  {
    value: String(POINT_HISTORY_STATUS.COMPLETED),
    // 🔴 `이상없음`·`순찰기록` 을 함께 거르는 값이라 **상위어**를 쓴다
    label: '완료',
  },
]
