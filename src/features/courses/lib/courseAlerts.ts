import { formatElapsed } from '@/features/course-history/lib/elapsed'

import { COURSE_HISTORY_STATUS, type CourseHistoryRow, type PointHistoryRow } from '@/features/course-history/types'

/**
 * 이상 이력 모으기 (`spec 023` 코스 상세 C단).
 *
 * 🔴 **요청을 더 하지 않는다.** B단이 이미 받아 둔 두 응답(`GetCourseHistory` 30일 ·
 * `GetPointHistory status=3`)에서 **뽑아 모을 뿐**이다 — 이상 이력 전용 엔드포인트는
 * 없고, 있어야 할 이유도 없다.
 *
 * 🔴🔴 **사유 문구를 만들지 않는다.** 메모는 목록에 없고(`hasMemo: boolean` 뿐)
 * `CheckDetails(historySeq)` / `PointHistoryDetail(detailSeq)` 에만 있어서, 사유를 붙이면
 * **행마다 상세 조회**(10행 → 11요청)가 된다. 게다가 실측된 메모 내용은
 * `"[조명 고장] [누수]"` 처럼 **앱에서 고른 키워드 조합**이고 "왜 미인증인지" 를 설명하는
 * 문장이 **아니다** — 그대로 사유로 붙이면 틀린 설명이 된다(A1). 대신 **"메모 있음" 표시만**
 * 남겨, 기록이 있다는 사실은 전하고 내용은 나중에(이력 상세, `spec 025`) 보게 한다.
 *
 * 🔴 **순수 함수로 꺼냈다** — "한 순찰이 미완료이면서 초과인 경우", "근무자 없는 이력",
 * "같은 지점이 여러 번 미인증" 같은 겹침을 컴포넌트 안에서는 테스트할 수 없다.
 */

export type CourseAlertKind = 'unchecked' | 'incomplete' | 'overtime'

export interface CourseAlert {
  /** 🔴 `historySeq`·`detailSeq` 가 종류별로 겹칠 수 있어 **종류를 키에 넣는다** */
  key: string
  kind: CourseAlertKind
  title: string
  meta: string
  /** ISO 8601(타임존 없음). 정렬·표시의 기준 */
  occurredAt: string
  /** 🔴 사유 **내용**이 아니라 **있다는 사실**이다 — 내용은 상세 조회에만 있다 */
  hasMemo: boolean
}

/** 근무자 이름. 🔴 **빈 배열인 이력이 실존한다**(실측) — 없으면 그렇게 적는다 */
const runnerNames = (row: CourseHistoryRow): string =>
  row.userList.length === 0 ? '근무자 기록 없음' : row.userList.map((u) => u.userName).join(', ')

export interface CourseAlerts {
  /** 화면에 그릴 것(최근 순, `limit` 개) */
  items: CourseAlert[]
  /** 🔴 잘라내기 **전** 전체 건수 — "n건 중 m건 표시" 를 적을 수 있게 */
  totalCount: number
}

/**
 * @param runs      30일 코스 이력(B단이 받은 것)
 * @param unchecked 미인증 지점 이력(`status=3`, B단이 받은 것)
 */
export const buildCourseAlerts = (
  runs: CourseHistoryRow[],
  unchecked: PointHistoryRow[],
  limit = 6
): CourseAlerts => {
  const alerts: CourseAlert[] = [
    ...unchecked.map((row) => ({
      key: `unchecked-${row.detailSeq}`,
      kind: 'unchecked' as const,
      title: `${row.pointName} 미인증`,
      meta: row.userName.trim() || '근무자 기록 없음',
      occurredAt: row.checkDt,
      hasMemo: row.hasMemo,
    })),

    // 🔴 미완료와 초과를 **한 건으로 합치지 않는다.** 한 순찰이 둘 다일 수 있고, 그건
    // 서로 다른 문제다("다 돌지 못했다" vs "오래 걸렸다"). 합치면 하나가 가려진다
    ...runs
      .filter((row) => row.status === COURSE_HISTORY_STATUS.INCOMPLETE)
      .map((row) => ({
        key: `incomplete-${row.historySeq}`,
        kind: 'incomplete' as const,
        title: '순찰 미완료',
        meta: `${runnerNames(row)} · 인증 ${row.checkedCount}/${row.pointCount}`,
        occurredAt: row.startDt,
        hasMemo: row.hasMemo,
      })),

    ...runs
      .filter((row) => row.overtimeYn)
      .map((row) => ({
        key: `overtime-${row.historySeq}`,
        kind: 'overtime' as const,
        title: '소요시간 초과',
        // 🔴 "기준 대비 +n분" 을 적지 않는다 — 기준(`totalMin`)은 **지금 값**이고 이력은
        // 과거다. 편성을 바꾸면 과거 순찰의 초과량이 따라 바뀌어 거짓이 된다
        meta: `${runnerNames(row)} · ${formatElapsed(row.actualElapsedTime)} 소요`,
        occurredAt: row.startDt,
        hasMemo: row.hasMemo,
      })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))

  return { items: alerts.slice(0, limit), totalCount: alerts.length }
}

/**
 * 미인증을 **지점별로 묶는다** (`spec 031` — 미인증 KPI 의 구성 바).
 *
 * 🔴 **건수만으로는 "어디가 문제인지" 를 모른다.** `미인증 8건` 이 한 지점에서 8번인지
 * 여덟 지점에서 한 번씩인지는 **완전히 다른 상황**이다 — 전자는 그 지점(태그 고장·접근
 * 불가)을 보면 되고, 후자는 코스 운영을 봐야 한다.
 *
 * 🔴 **서버 요청을 늘리지 않는다** — B단이 이미 받아 둔 `unchecked` 행을 다시 센다.
 *
 * @returns 많은 순 정렬. 동률이면 **지점명 순**(렌더마다 순서가 바뀌면 눈이 쫓아간다)
 */
export const uncheckedByPoint = (
  unchecked: PointHistoryRow[]
): { label: string; value: number }[] => {
  const counts = new Map<string, number>()
  for (const row of unchecked) {
    // 🔴 이름이 비어 있으면 **버리지 않고** 묶는다 — 빼면 합이 총계와 어긋난다
    const label = row.pointName.trim() || '이름 없음'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
}
