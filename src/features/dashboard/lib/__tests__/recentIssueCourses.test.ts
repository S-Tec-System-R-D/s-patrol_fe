import { describe, expect, it } from 'vitest'

import type { CheckDetailRow, CourseHistoryRow } from '@/features/course-history/types'
import { missedPointNames, pickIssueCourses } from '@/features/dashboard/lib/recentIssueCourses'

const row = (
  historySeq: number,
  endDt: string | null,
  {
    status = 1,
    overtimeYn = false,
    // 서버 미완료(2)는 실측에서 늘 지점이 빠져 있다
    checkedCount = status === 2 ? 3 : 5,
  }: { status?: number; overtimeYn?: boolean; checkedCount?: number } = {}
): CourseHistoryRow => ({
  historySeq,
  courseSeq: 1,
  courseName: '코스',
  useYn: true,
  startDt: '2026-11-11T08:00:00',
  endDt,
  status,
  statusName: '',
  overtimeYn,
  pointCount: 5,
  checkedCount,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:10:00',
  hasMemo: false,
  userList: [],
})

const detail = (orderNo: number, pointName: string, status: number): CheckDetailRow => ({
  detailSeq: orderNo,
  pointSeq: orderNo,
  pointName,
  status,
  checkDt: null,
  authMethod: null,
  checkUserSeq: null,
  userName: null,
  orderNo,
  gpsLat: null,
  gpsLng: null,
  overtimeYn: null,
  memos: [],
})

const seqs = (rows: CourseHistoryRow[]) => rows.map((item) => item.historySeq)

describe('pickIssueCourses', () => {
  it('🔄 미인증 지점 있음 · 시간초과만 — 서버 상태가 아니라 두 수로 본다 · 진행 중은 뺀다 (D11)', () => {
    const rows = [
      row(1, '2026-11-11T09:00:00'),
      row(2, '2026-11-11T09:10:00', { status: 2 }),
      row(3, '2026-11-11T09:20:00', { overtimeYn: true }),
      row(4, null, { status: 0, overtimeYn: true }),
      // 서버 완료인데 지점이 빠진 회차도 들어온다(실측 41건 중 25건)
      row(5, '2026-11-11T09:30:00', { checkedCount: 4 }),
    ]
    expect(seqs(pickIssueCourses(rows))).toEqual([5, 3, 2])
  })

  it('종료 시각 역순 앞 5건 — 어제 끝난 회차도 들어간다', () => {
    const rows = [
      row(1, '2026-11-10T23:00:00', { status: 2 }),
      ...[2, 3, 4, 5, 6].map((seq) => row(seq, `2026-11-11T0${seq}:00:00`, { status: 2 })),
    ]
    expect(seqs(pickIssueCourses(rows))).toEqual([6, 5, 4, 3, 2])
  })
})

describe('missedPointNames', () => {
  it('미완료 지점만 순번 순 — 완료 · 순찰제외는 뺀다', () => {
    const details = [detail(3, '옥상', 3), detail(1, '정문', 4), detail(2, '로비', 3), detail(4, '창고', 2)]
    expect(missedPointNames(details)).toEqual(['로비', '옥상'])
  })
})
