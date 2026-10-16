import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ZoneHistoryCard from '../ZoneHistoryCard'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 좁은 폭 카드 (`spec 030` T446 → `spec 036` T506 서버 전환).
 *
 * 🔴 **`spec 034` 의 카드 골격**(타일 + 이름·뱃지 + 지표 줄 + 꺾쇠)으로 다시 짰다
 * (목업 "반응형카드" 반영, 2026-10-16). 관심사 셋을 고정한다:
 * ① **축이 비지 않는다**(순찰자 없는 이력 35% — 그래서 아바타가 아니라 아이콘 타일)
 * ② **뱃지 2개 병기**를 좁은 폭에서도 유지한다
 * ③ **날짜를 자르지 않는다**(이력은 여러 날에 걸쳐 있어 "언제" 가 선택 기준이다)
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
    // 🔴 **날짜를 자르지 않는다** — 시:분만 두면 다른 날 회차와 구분되지 않는다
    expect(screen.getByText('2026-05-01 09:00')).toBeInTheDocument()
    expect(screen.getByText('3/3 인증')).toBeInTheDocument()
  })

  it('🔴 진행 막대를 넣지 않는다 — 좁은 폭에는 고르는 데 쓰는 값만 둔다', () => {
    const { container } = render(<ZoneHistoryCard {...row({ checkedCount: 1 })} />)

    // 비율은 `1/3` 이 이미 말한다(`spec 030` §3 규칙 5). 테이블에는 막대가 남아 있다
    expect(container.querySelector('[style*="width"]')).toBeNull()
    expect(screen.getByText('1/3 인증')).toBeInTheDocument()
  })

  it('🔴 진행 중이면 상태는 뱃지만 말한다 — 종료 줄을 따로 두지 않는다', () => {
    render(<ZoneHistoryCard {...row({ endDt: null, status: 0 })} />)

    expect(screen.getByText('진행중')).toBeInTheDocument()
    // 034 골격에서 종료 일시는 카드에 없다 — 고르는 데 쓰는 값이 아니다(030 규칙 5).
    // "종료 진행 중" 처럼 같은 말을 두 번 하던 자리가 사라졌다
    expect(screen.queryByText(/종료/)).not.toBeInTheDocument()
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

    expect(screen.getByText('2시간 18분')).toBeInTheDocument()
  })

  it('🔴 순찰자가 없어도 축(타일)이 남는다 — 아바타를 축으로 쓰지 않은 이유다', () => {
    const { container } = render(<ZoneHistoryCard {...row({ userList: [] })} />)

    // 실측 35% 가 순찰자 없는 이력이다. 아바타가 축이면 3건 중 1건은 축이 사라진다
    expect(container.querySelector('.size-11')).not.toBeNull()
    expect(screen.getByText('순찰자 미지정')).toBeInTheDocument()
  })
})
