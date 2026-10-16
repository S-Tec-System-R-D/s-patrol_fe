import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ZoneHistoryCard from '../ZoneHistoryCard'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 좁은 폭 카드 (`spec 030` T446 → `spec 036` T506 서버 전환).
 *
 * 🔴 **구조는 030·034 가 세운 것을 그대로 두고 필드만 바꿨다.** 그래서 이 테스트도
 * 관심사가 같다 — **카드에서는 `—` 가 값 누락으로 읽힌다**(그 줄 하나만 보이므로).
 */

const row = (overrides: Partial<CourseHistoryRow> = {}): CourseHistoryRow => ({
  historySeq: 101,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  useYn: true,
  startDt: '2026-05-01T09:00:00',
  endDt: '2026-05-01T09:30:00',
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 3,
  checkedCount: 3,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:30:00',
  hasMemo: false,
  userList: [{ userSeq: 21, userName: '박성민' }],
  ...overrides,
})

describe('ZoneHistoryCard', () => {
  it('코스명·결과·순찰자·시각·인증 수를 보여준다', () => {
    render(<ZoneHistoryCard {...row()} />)

    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('박성민')).toBeInTheDocument()
    expect(screen.getByText('시작 2026-05-01 09:00')).toBeInTheDocument()
    expect(screen.getByText('지점 인증 3/3')).toBeInTheDocument()
  })

  it('🔴 진행 중이면 "진행 중" 이라고 적는다 — 카드에서 "—" 는 값 누락으로 읽힌다', () => {
    render(<ZoneHistoryCard {...row({ endDt: null, status: 0 })} />)

    expect(screen.getByText(/진행 중/)).toBeInTheDocument()
    expect(screen.queryByText(/종료 —/)).not.toBeInTheDocument()
  })

  it('🔴 순찰자가 없으면 "순찰자 미지정" — 빈 칸으로 두지 않는다 (실측 35%)', () => {
    render(<ZoneHistoryCard {...row({ userList: [] })} />)

    expect(screen.getByText('순찰자 미지정')).toBeInTheDocument()
  })

  it('🔴 교대(2명 이상)를 숨기지 않는다', () => {
    render(
      <ZoneHistoryCard
        {...row({
          userList: [
            { userSeq: 21, userName: '박성민' },
            { userSeq: 22, userName: '정우현' },
          ],
        })}
      />
    )

    expect(screen.getByText('박성민 외 1명')).toBeInTheDocument()
  })

  it('🔴 좁은 폭에서도 결과 + 시간초과 뱃지를 함께 둔다', () => {
    render(<ZoneHistoryCard {...row({ overtimeYn: true })} />)

    // 접으면 테이블과 다른 정보를 준다
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('시간초과')).toBeInTheDocument()
  })

  it('특이사항이 있으면 아이콘으로 알린다 — 건수는 서버에 없다', () => {
    render(<ZoneHistoryCard {...row({ hasMemo: true })} />)

    expect(screen.getByLabelText('특이사항 있음')).toBeInTheDocument()
  })

  it('🔴 시 단위 소요시간을 분으로 읽지 않는다', () => {
    render(<ZoneHistoryCard {...row({ actualElapsedTime: '02:17:40' })} />)

    expect(screen.getByText(/2시간 18분/)).toBeInTheDocument()
  })
})
