import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import AppTable from '@/components/AppTable'
import { courseColumns } from '../CourseColumn'
import type { CourseRow } from '../../types'

/**
 * 코스 목록 컬럼 — 027 의 `PointColumn.test.tsx` 와 **같은 방식**으로 본다.
 *
 * 🔴 **`AppTable` 안에서 렌더한다**(027 선례). 컬럼 팩토리는 `cell` 함수 모음이라 함수를
 * 직접 호출해 검사하면 테스트가 `row.original` 모양을 흉내내게 되고, 실제 테이블에서
 * 바인딩이 어긋나도 통과한다.
 */

const row = (overrides: Partial<CourseRow> = {}): CourseRow => ({
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  useYn: true,
  switchYn: true,
  totalMin: 45,
  courseStatusCode: 0,
  courseStatusName: '대기중',
  pointCount: 3,
  history: {
    historySeq: 10,
    historyUserSeq: 101,
    historyUserName: '김근무',
    historyStatusCode: 4,
    historyStatusName: '완료',
    historyEndDt: '2026-10-05T21:11:00',
  },
  ...overrides,
})

const renderRow = (overrides: Partial<CourseRow> = {}) => {
  const onRowClick = vi.fn()
  render(
    <AppTable
      columns={courseColumns()}
      data={[row(overrides)]}
      hidePagination
      onRowClick={onRowClick}
    />
  )
  return { onRowClick }
}

describe('courseColumns — 컬럼 구성', () => {
  it('6개 컬럼을 그린다', () => {
    renderRow()

    for (const header of ['코스명', '지점 수', '총 소요시간', '교대', '최근 순찰', '사용여부']) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }
  })

  it('🔴 상태 컬럼이 없다 — 실시간 진행은 별도 페이지가 맡는다 (OQ-3 종결)', () => {
    renderRow({ courseStatusName: '대기중' })

    expect(screen.queryByText('상태')).not.toBeInTheDocument()
    // 🔴 코드 사전을 모르는 값(OQ-3)이 화면에 **아예 올라오지 않는다**
    expect(screen.queryByText('대기중')).not.toBeInTheDocument()
  })

  it('🔴 설명 컬럼이 없다 — 서버가 목록에 memo 를 주지 않는다', () => {
    renderRow()

    expect(screen.queryByText('설명')).not.toBeInTheDocument()
  })
})

describe('courseColumns — 값 표시', () => {
  it('총 소요시간에 단위를 붙인다', () => {
    renderRow({ totalMin: 45 })

    expect(screen.getByText('45분')).toBeInTheDocument()
  })

  it('최근 순찰은 history 의 종료 시각이다', () => {
    renderRow()

    expect(screen.getByText('2026-10-05 21:11')).toBeInTheDocument()
  })

  it('🔴 history 가 null 이면 "기록 없음" — 빈 객체로 가정하지 않는다', () => {
    renderRow({ history: null })

    expect(screen.getByText('기록 없음')).toBeInTheDocument()
  })

  it('🔴 깨진 날짜도 화면을 깨뜨리지 않는다', () => {
    renderRow({
      history: {
        historySeq: 1,
        historyUserSeq: 1,
        historyUserName: '김근무',
        historyStatusCode: 4,
        historyStatusName: '완료',
        historyEndDt: 'not-a-date',
      },
    })

    expect(screen.getByText('기록 없음')).toBeInTheDocument()
  })

  it('🔴 지점 0개도 그대로 보여준다 — 경고·자동 조치가 없다 (규칙 12)', () => {
    renderRow({ pointCount: 0 })

    expect(screen.getByText('0')).toBeInTheDocument()
    // "지점을 추가하세요" 류의 경고를 행에 넣지 않는다
    expect(screen.queryByText(/추가/)).not.toBeInTheDocument()
  })
})

describe('courseColumns — 상태 표시', () => {
  it('교대 허용을 뱃지로 보여준다', () => {
    renderRow({ switchYn: true })
    expect(screen.getByText('허용')).toBeInTheDocument()
  })

  it('허용 안 함도 뱃지다 — 하이픈은 빈 칸처럼 읽힌다 (사용자 결정)', () => {
    renderRow({ switchYn: false })

    expect(screen.getByText('허용 안 함')).toBeInTheDocument()
    expect(screen.queryByText('-')).not.toBeInTheDocument()
  })

  it('미사용 코스는 사용여부 뱃지로 글자를 준다 — 색·명도만으로 전달하지 않는다', () => {
    renderRow({ useYn: false })

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

})

describe('courseColumns — 행 클릭', () => {
  it('🔴 행을 클릭하면 코스 데이터를 넘긴다 — 라우트 이동의 근거다', async () => {
    const user = userEvent.setup()
    const { onRowClick } = renderRow({ courseSeq: 42 })

    await user.click(screen.getByText('A동 순찰코스'))

    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ courseSeq: 42 }))
  })
})
