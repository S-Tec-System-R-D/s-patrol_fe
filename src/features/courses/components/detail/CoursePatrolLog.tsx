import { format, isValid, parseISO } from 'date-fns'
import { HistoryIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppEmpty from '@/components/app/AppEmpty'

import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { COURSE_HISTORY_STATUS, type CourseHistoryRow } from '@/features/course-history/types'
import { HISTORY_DAYS } from '@/features/course-history/lib/historyRange'

/**
 * 최근 순찰 기록 (`spec 023` 코스 상세 B단).
 *
 * 🔴 **실측에서 나온 세 경우를 그대로 받는다**(2026-10-12). 목업은 전부 "완료 · 3/3 ·
 * 44분" 이라 그림에 없던 것들이다:
 * 1. **`userList` 가 빈 배열인 이력이 실존한다** → 근무자 칸은 `—` 가 될 수 있다
 * 2. **`완료` 인데 `checkedCount: 0`** → 🔴 상태와 인증을 **따로** 적는다. "완료 = 3/3"
 *    으로 묶으면 **없는 보장을 화면이 약속**한다
 * 3. **`actualElapsedTime` 에 시 단위가 온다**(`"02:17:40"`) → `lib/elapsed.ts` 로 환산
 *
 * 🔴 **비고 칸을 만들지 않는다**(사용자 결정 2026-10-12). "어느 지점이 미인증인가" 는
 * 행에 없고 `GetCourseHistoryCheckDetails` 를 **historySeq 마다** 불러야 한다 — 실측에서
 * 미완료 행이 흔해 그 N+1 이 **최악이 아니라 일상**이다. 대신 `spec 025` 가 이력 상세
 * 라우트를 정하면 **행 클릭으로 그쪽에 넘긴다**(지금은 링크 없음).
 *
 * 🔴 **표가 아니라 목록이 아니다 — `table` 이다.** 6열 고정이고 열 머리가 의미를 갖는다.
 * 다만 `AppTable`(tanstack)을 쓰지 않았다: 정렬·페이징·행 클릭이 **전부 없고**, 30일
 * 고정 조회의 **읽기 전용 요약**이다. 테이블 엔진을 끌어오면 쓰지 않는 기능이 따라온다(A6).
 */

interface CoursePatrolLogProps {
  rows: CourseHistoryRow[]
  /** 🔴 서버 전체 건수 — 받은 행 수보다 크면 "최근 N건" 임을 밝힌다 */
  totalCount: number
  isPending?: boolean
}

/** ISO(타임존 없음) → `MM.dd HH:mm`. 깨졌으면 원본을 그대로 보여준다(숨기지 않는다) */
const formatStartDt = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : value
}

/**
 * 상태 뱃지. ⚠️ **코스 사전**(0 진행중 / 1 완료 / 2 미완료)이다 — 지점 사전(0~4)과 값이
 * 겹치는데 뜻이 다르다. 🔴 `statusName` 이 오면 **그것을 쓴다**(서버 문구가 정답이고,
 * 우리가 이름을 지으면 틀린 이름이 남는다). 비어 있을 때만 사전으로 메운다.
 */
const StatusBadge = ({ row }: { row: CourseHistoryRow }) => {
  const label =
    row.statusName.trim() ||
    (row.status === COURSE_HISTORY_STATUS.COMPLETED
      ? '완료'
      : row.status === COURSE_HISTORY_STATUS.IN_PROGRESS
        ? '진행중'
        : '미완료')

  const variant =
    row.status === COURSE_HISTORY_STATUS.COMPLETED
      ? 'success'
      : row.status === COURSE_HISTORY_STATUS.IN_PROGRESS
        ? 'point'
        : 'warning'

  return <AppBadge variant={variant}>{label}</AppBadge>
}

const CoursePatrolLog = ({ rows, totalCount, isPending }: CoursePatrolLogProps) => (
  <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
    {/* 🔴 건수는 **제목 옆**이다 — 세 카드(지점 순서·순찰 기록·이상 이력)가 같은 모양을
        쓴다(사용자 결정 2026-10-12). 우측에 두면 버튼이 있는 카드에서는 버튼 라벨처럼
        읽히고, 없는 카드와 위치가 어긋나 눈이 한 화면에서 두 규칙을 따라가야 한다 */}
    <div className="flex items-baseline gap-2">
      <span className="text-panel-title font-semibold">최근 순찰 기록</span>
      <span className="text-caption text-muted-foreground">
        최근 {HISTORY_DAYS}일 · {totalCount}건
      </span>
    </div>

    {isPending ? (
      <div className="flex flex-col gap-2">
        {/* 🔴 "기록이 없습니다" 가 아니라 스켈레톤 — 조회 중을 빈 상태로 보여주면
            "순찰을 안 했다" 고 믿는다(027 T324 에서 실제로 터진 퇴행) */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-9 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    ) : rows.length === 0 ? (
      <AppEmpty
        icon={HistoryIcon}
        title="순찰 기록이 없습니다"
        description={`최근 ${HISTORY_DAYS}일 동안 이 코스로 수행된 순찰이 없습니다.`}
      />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-body">
          <thead>
            <tr className="border-b text-caption text-muted-foreground whitespace-nowrap">
              <th className="py-2 pr-3 text-left font-medium">시작</th>
              <th className="py-2 pr-3 text-left font-medium">근무자</th>
              <th className="py-2 pr-3 text-right font-medium">인증</th>
              <th className="py-2 pr-3 text-right font-medium">소요</th>
              <th className="py-2 pr-3 text-left font-medium">상태</th>
              {/* 🔴 열 머리와 뱃지 글자가 같으면("초과"/"초과") 읽는 쪽도 테스트도
                  무엇을 가리키는지 못 가린다. 머리는 **무엇을 넘겼는지**를 말한다 */}
              <th className="py-2 text-left font-medium">기준 초과</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.historySeq} className="border-b last:border-0">
                <td className="py-2 pr-3 tabular-nums whitespace-nowrap">
                  {formatStartDt(row.startDt)}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {/* 🔴 빈 배열이 실존한다 — 아바타·이름을 항상 그릴 수 없다 */}
                  {row.userList.length === 0 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    row.userList.map((user) => user.userName).join(', ')
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                  {/* 🔴 상태와 **따로** 적는다 — 완료인데 0/3 인 행이 실존한다 */}
                  <span className={row.checkedCount < row.pointCount ? 'text-warning-foreground' : ''}>
                    {row.checkedCount}/{row.pointCount}
                  </span>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                  {formatElapsed(row.actualElapsedTime)}
                </td>
                <td className="py-2 pr-3">
                  <StatusBadge row={row} />
                </td>
                <td className="py-2">
                  {row.overtimeYn ? (
                    <AppBadge variant="warning">초과</AppBadge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* 🔴 **"프론트가 더한 수치" 임을 적는다.** 서버에 집계 엔드포인트가 없어 위 KPI 의
        평균·인증률은 이 행들을 우리가 더한 값이다 — 다른 화면과 어긋날 때 출처를 알 수
        있어야 한다. 한 페이지로 다 못 받았으면 **무엇을 기준으로 더했는지**까지 적는다 */}
    {rows.length > 0 && (
      <p className="text-caption text-muted-foreground">
        {totalCount > rows.length
          ? `평균 소요·인증률은 최근 ${rows.length}건 기준으로 화면에서 계산한 값입니다.`
          : '평균 소요·인증률은 위 기록을 화면에서 계산한 값입니다.'}
      </p>
    )}
  </div>
)

export default CoursePatrolLog
