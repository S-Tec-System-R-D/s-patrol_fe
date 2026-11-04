import { describe, expect, it } from 'vitest'

import type { CourseHistoryRow } from '@/features/course-history/types'
import { pickFinishedCourses } from '@/features/dashboard/lib/finishedCourses'

const TODAY = '2026-11-04'

const row = (historySeq: number, endDt: string | null, status = 1): CourseHistoryRow => ({
  historySeq,
  courseSeq: 1,
  courseName: '코스',
  useYn: true,
  startDt: `${TODAY}T08:00:00`,
  endDt,
  status,
  statusName: '',
  overtimeYn: false,
  pointCount: 5,
  checkedCount: 5,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:10:00',
  hasMemo: false,
  userList: [],
})

const seqs = (rows: CourseHistoryRow[]) => rows.map((item) => item.historySeq)

describe('pickFinishedCourses', () => {
  it('시작 순으로 와도 종료 시각 순으로 — 나중에 시작해 먼저 끝난 회차', () => {
    const rows = [row(2, `${TODAY}T09:00:00`), row(1, `${TODAY}T10:00:00`)]
    expect(seqs(pickFinishedCourses(rows, TODAY))).toEqual([1, 2])
  })

  it('완료 · 미완료 둘 다 · 진행 중과 어제 끝난 회차는 뺀다', () => {
    const rows = [
      row(1, `${TODAY}T09:00:00`, 1),
      row(2, `${TODAY}T08:00:00`, 2),
      row(3, null, 0),
      row(4, '2026-11-03T23:59:00'),
    ]
    expect(seqs(pickFinishedCourses(rows, TODAY))).toEqual([1, 2])
  })

  it('자정을 넘겨 오늘 끝난 회차는 넣는다', () => {
    const overnight = { ...row(1, `${TODAY}T00:20:00`), startDt: '2026-11-03T23:40:00' }
    expect(seqs(pickFinishedCourses([overnight], TODAY))).toEqual([1])
  })

  it('앞 5건만', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((seq) => row(seq, `${TODAY}T0${seq}:00:00`))
    expect(seqs(pickFinishedCourses(rows, TODAY))).toEqual([6, 5, 4, 3, 2])
  })
})
