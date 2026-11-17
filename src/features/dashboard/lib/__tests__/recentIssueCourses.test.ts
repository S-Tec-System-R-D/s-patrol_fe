import { describe, expect, it } from 'vitest'

import type { CourseHistoryRow } from '@/features/course-history/types'
import { pickIssueCourses } from '@/features/dashboard/lib/recentIssueCourses'

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


const seqs = (rows: CourseHistoryRow[]) => rows.map((item) => item.historySeq)

describe('pickIssueCourses', () => {
  it('🔄 서버 미완료 · 시간초과만 — 회차 상태로만 본다 · 진행 중은 뺀다 (D13)', () => {
    const rows = [
      row(1, '2026-11-11T09:00:00'),
      row(2, '2026-11-11T09:10:00', { status: 2 }),
      row(3, '2026-11-11T09:20:00', { overtimeYn: true }),
      row(4, null, { status: 0, overtimeYn: true }),
      // 🔴 서버 완료인데 지점이 빠진 회차는 들어오지 않는다 — 지점 결과가 회차 줄에 섞이지 않는다
      row(5, '2026-11-11T09:30:00', { checkedCount: 4 }),
    ]
    expect(seqs(pickIssueCourses(rows))).toEqual([3, 2])
  })

  it('종료 시각 역순 앞 5건 — 어제 끝난 회차도 들어간다', () => {
    const rows = [
      row(1, '2026-11-10T23:00:00', { status: 2 }),
      ...[2, 3, 4, 5, 6].map((seq) => row(seq, `2026-11-11T0${seq}:00:00`, { status: 2 })),
    ]
    expect(seqs(pickIssueCourses(rows))).toEqual([6, 5, 4, 3, 2])
  })
})

