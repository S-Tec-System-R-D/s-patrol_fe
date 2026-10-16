import { MessageSquareTextIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppEmpty from '@/components/app/AppEmpty'
import { checkGaps } from '@/features/course-history/lib/checkIntervals'
import { formatDuration } from '@/features/course-history/lib/elapsed'
import { pointCheckBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { AUTH_METHOD, type CheckDetailRow } from '@/features/course-history/types'

/**
 * 지점 인증 내역 (`spec 036` T513).
 *
 * 🔴🔴 **미완료를 두 종류로 구분한다** — `checkDt` 로 갈린다(실측 124건이 79 / 45 로 갈린다):
 * - **미인증**: 아예 가지 않았다. 순찰자·시각도 전부 `null`
 * - **미완료**: 순찰자·시각은 남았는데 **인증이 안 됐다**(`authMethod` 는 `null`)
 *
 * 둘을 한 뱃지로 묶으면 **"안 간 것" 과 "갔는데 인증 실패" 가 구분되지 않는다** — 관리자가
 * 해야 할 일이 다르다(전자는 순찰 누락, 후자는 태그·단말 문제일 수 있다).
 *
 * 🔴 **미완료 행의 `checkDt` 를 보여주지 않는다**(OQ-15). 코스 `endDt` 와 같은 것이 12건,
 * 다른 것이 33건이라 **의미가 확정되지 않았다** — "인증 시각" 칸에 그대로 쓰면 **인증한
 * 것처럼** 보인다. 백엔드 회신 뒤에 표기를 정한다.
 *
 * 🔴 **위치 컬럼을 만들지 않는다** — 층·위치 필드가 **서버 어디에도 없다**(목업에는 있다).
 *
 * 🔴 **순번은 `orderNo` 를 그대로 쓴다.** 서버가 중복을 저장하지만(032) 그건 **편성의
 * 사실**이고, 배열 위치로 바꿔 매기면 **같은 지점을 화면마다 다른 번호**로 부른다.
 */

/** `'2026-05-01T10:06:00'` → `'10:06'` — 같은 회차라 날짜는 헤더가 이미 말한다 */
const formatTime = (value: string): string => value.slice(11, 16)

interface CheckDetailTableProps {
  rows: CheckDetailRow[]
}

const CheckDetailTable = ({ rows }: CheckDetailTableProps) => {
  if (rows.length === 0) {
    /* 🔴 이력은 있는데 인증 행이 0건인 경우가 **실재한다**(완료인데 `checkedCount: 0`) —
       장애가 아니라 사실이므로 실패 문구를 쓰지 않는다 */
    return (
      <AppEmpty
        icon={MessageSquareTextIcon}
        title="인증 내역이 없습니다."
        description="이 회차에는 기록된 지점 인증이 없습니다."
      />
    )
  }

  const gaps = checkGaps(rows)
  const ordered = [...rows].sort((a, b) => a.orderNo - b.orderNo)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted">
          <tr className="text-left text-xs font-medium text-muted-foreground">
            <th className="px-3 py-2 w-12">순서</th>
            <th className="px-3 py-2">순찰지점</th>
            <th className="px-3 py-2 w-20">인증수단</th>
            <th className="px-3 py-2 w-20">인증시각</th>
            <th className="px-3 py-2 w-20">구간</th>
            <th className="px-3 py-2 w-28">결과</th>
            <th className="px-3 py-2 w-16">기록</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => {
            const result = pointCheckBadge(row.status, row.checkDt, row.memos.length > 0)
            const overtime = overtimeBadge(row.overtimeYn)
            const gap = gaps.get(row.detailSeq) ?? null
            /* 🔴 **인증이 찍힌 행만 시각을 보여준다**(OQ-15) */
            const authenticated = row.authMethod !== null && row.checkDt !== null

            return (
              <tr key={row.detailSeq} className="border-b last:border-0">
                <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.orderNo}</td>
                <td className="px-3 py-2 font-medium">{row.pointName}</td>
                <td className="px-3 py-2">
                  {/* 🔴 미인증·미완료 행은 `authMethod` 가 `null` 이다 — 빈 칸이 아니라 `—` */}
                  {row.authMethod === AUTH_METHOD.QR ? (
                    <AppBadge variant="point">QR</AppBadge>
                  ) : row.authMethod === AUTH_METHOD.NFC ? (
                    <AppBadge variant="success">NFC</AppBadge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {authenticated ? formatTime(row.checkDt as string) : '—'}
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {gap === null ? '—' : `+${formatDuration(gap)}`}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <AppBadge variant={result.variant}>{result.label}</AppBadge>
                    {/* 🔴 결과와 **독립 축**이라 병기한다(목록과 같은 규칙) */}
                    {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {row.memos.length > 0 ? (
                    <MessageSquareTextIcon
                      size={16}
                      className="text-warning-foreground"
                      aria-label="기록 있음"
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default CheckDetailTable
