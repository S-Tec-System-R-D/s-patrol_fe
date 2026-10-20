import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { PointHistoryRow } from '@/features/course-history/types'
import PointHistoryCard from '../PointHistoryCard'

/**
 * 지점 이력의 좁은 폭 카드 (`spec 037` T542) — **컬럼이 8개로 가장 많은 화면**이다.
 *
 * 🔴 **팩토리가 아니라 컴포넌트가 됐다.** 이전 판은 기록 모달 버튼 때문에 `onRecordClick`
 * 을 받는 팩토리였는데, 상세가 **페이지**가 되면서 카드 안의 버튼이 사라졌다 — 이제 카드는
 * `AppTable` 이 `button` 으로 그리므로 **안에 버튼을 둘 수 없다**(중첩 금지).
 */

const row = (over: Partial<PointHistoryRow> = {}): PointHistoryRow => ({
  detailSeq: 418,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  pointSeq: 12,
  pointName: '정문 입구',
  checkDt: '2026-10-13T09:07:00',
  userSeq: 21,
  userName: '김근무',
  authMethod: 9,
  authMethodName: 'QR',
  status: 4,
  statusName: '완료',
  overTimeYn: false,
  hasMemo: false,
  pauseTime: '00:07:00',
  ...over,
})

describe('PointHistoryCard', () => {
  it('지점명 + 결과 뱃지를 앞에, 코스·순찰자·인증수단은 지표 줄로 묶는다', () => {
    render(<PointHistoryCard {...row()} />)

    expect(screen.getByText('정문 입구')).toBeInTheDocument()
    expect(screen.getByText('이상없음')).toBeInTheDocument()
    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('김근무')).toBeInTheDocument()
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  it('🔴 날짜를 자르지 않는다 — 여러 날에 걸친 목록이라 "언제" 가 선택 기준이다', () => {
    render(<PointHistoryCard {...row()} />)

    expect(screen.getByText('2026-10-13 09:07')).toBeInTheDocument()
  })

  it('🔴 카드 안에 버튼을 두지 않는다 — 카드 자체가 button 이라 중첩이 된다', () => {
    render(<PointHistoryCard {...row({ hasMemo: true })} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByLabelText('순찰 기록 있음')).toBeInTheDocument()
  })

  it('🔴 좁은 폭에서도 뱃지 2개 병기를 유지한다 — 접으면 테이블과 다른 정보를 준다', () => {
    render(<PointHistoryCard {...row({ overTimeYn: true })} />)

    expect(screen.getByText('이상없음')).toBeInTheDocument()
    expect(screen.getByText('시간초과')).toBeInTheDocument()
  })

  it('🔴 미완료 행도 시각을 보여주고 인증수단만 비운다', () => {
    render(
      <PointHistoryCard {...row({ status: 3, authMethod: null, authMethodName: '' })} />
    )

    expect(screen.getByText('미완료')).toBeInTheDocument()
    expect(screen.getByText('2026-10-13 09:07')).toBeInTheDocument()
    expect(screen.queryByText('QR')).not.toBeInTheDocument()
  })

  it('완료인데 순찰자가 null 인 행에서도 터지지 않는다 (OQ-16, 실측 3건)', () => {
    render(
      <PointHistoryCard
        {...row({ userName: null as unknown as string, authMethod: null, authMethodName: '' })}
      />
    )

    expect(screen.getByText('정문 입구')).toBeInTheDocument()
  })
})
