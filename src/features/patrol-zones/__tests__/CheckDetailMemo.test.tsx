import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { CheckDetailRow } from '@/features/course-history/types'

import CheckDetailMemo from '../components/detail/CheckDetailMemo'
import CheckDetailTable from '../components/detail/CheckDetailTable'

/**
 * 메모 펼침 패널 + 사진 폴백 (`spec 036` T520~T522).
 *
 * 🔴 **가장 중요한 단정은 사진 폴백이다**(B-40) — 첨부 URL 이 **404 다**(실측 2026-10-16,
 * 순찰 2건·공지 1건 전부). 응답은 절대 URL 을 정상적으로 주므로 폴백이 없으면 **깨진
 * 이미지만 뜨고 원인을 화면에서 알 수 없다.**
 */

const row = (over: Partial<CheckDetailRow> = {}): CheckDetailRow => ({
  detailSeq: 1,
  pointSeq: 11,
  pointName: '정문',
  status: 4,
  checkDt: '2026-05-01T10:06:00',
  authMethod: 9,
  checkUserSeq: 5,
  userName: '김순찰',
  orderNo: 1,
  gpsLat: 37.5,
  gpsLng: 127.1,
  overtimeYn: null,
  memos: [],
  ...over,
})

const memo = (over: Partial<CheckDetailRow['memos'][number]> = {}) => ({
  memoSeq: 1,
  memo: '조명 고장',
  attaches: null,
  ...over,
})

const attach = (over: Partial<{ attachSeq: number; imagePath: string; fileName: string; fileExt: string }> = {}) => ({
  attachSeq: 1,
  imagePath: 'http://123.2.156.148:5231/UploadedFiles/patrols/202605/abc.jpg',
  fileName: 'abc.jpg',
  fileExt: 'jpg',
  ...over,
})

describe('CheckDetailMemo — 본문과 메타', () => {
  it('메모 본문을 보여준다', () => {
    render(<CheckDetailMemo row={row({ memos: [memo({ memo: '누수 발견' })] })} />)

    expect(screen.getByText('누수 발견')).toBeInTheDocument()
  })

  it('메모가 여러 건이면 전부 보여준다', () => {
    const memos = [memo({ memoSeq: 1, memo: '조명 고장' }), memo({ memoSeq: 2, memo: '누수' })]
    render(<CheckDetailMemo row={row({ memos })} />)

    expect(screen.getByText('조명 고장')).toBeInTheDocument()
    expect(screen.getByText('누수')).toBeInTheDocument()
  })

  /**
   * 🔴 메모에는 작성자·시각이 **없다**(실측: `{memoSeq, memo, attaches}` 3필드가 전부).
   * 행의 `userName`·`checkDt` 로 대체한다.
   */
  it('🔴 작성자·시각을 행에서 가져와 패널 머리에 한 번만 적는다', () => {
    const memos = [memo({ memoSeq: 1 }), memo({ memoSeq: 2, memo: '누수' })]
    render(<CheckDetailMemo row={row({ memos })} />)

    // 메모가 2건이어도 메타는 1번만 — 메모마다 반복하면 메모별로 다른 값처럼 읽힌다
    expect(screen.getAllByText(/김순찰/)).toHaveLength(1)
    expect(screen.getByText(/10:06/)).toBeInTheDocument()
  })

  /**
   * ✅ **OQ-15 해소(2026-10-19)** — `checkDt` 는 **지점 인증 시간**이다(사용자 DB 확인).
   * 전에는 "인증이 찍힌 행만 시각을 적는다" 를 단정했는데 **그 규칙이 뒤집혔다**: 겹치던
   * 시각은 테스트 환경 탓이었다(태그가 한 책상에 모여 있어 연달아 찍힌다).
   * ⚠️ 미완료 행은 `authMethod` 가 `null` 이라 **수단만 빠지고 시각은 남는다**.
   */
  it('✅ 미완료 행도 checkDt 가 있으면 시각을 적는다 (OQ-15 해소)', () => {
    const incomplete = row({
      status: 3,
      authMethod: null,
      checkDt: '2026-05-01T10:06:00',
      memos: [memo()],
    })
    render(<CheckDetailMemo row={incomplete} />)

    expect(screen.getByText(/10:06/)).toBeInTheDocument()
  })

  it('checkDt 가 null 이면 시각이 없다 — 아예 가지 않은 행이다', () => {
    const absent = row({ status: 3, authMethod: null, checkDt: null, memos: [memo()] })
    render(<CheckDetailMemo row={absent} />)

    expect(screen.queryByText(/10:06/)).not.toBeInTheDocument()
  })

  it('순찰자가 null 이면 하이픈으로 적는다 — 빈 칸으로 두지 않는다', () => {
    const anonymous = row({ userName: null, authMethod: null, checkDt: null, memos: [memo()] })
    render(<CheckDetailMemo row={anonymous} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  /** 🔴 목업에는 있었지만 **서버에 필드가 없다**(A1). 빈 칸은 "아직 접수 안 됨" 으로 읽힌다 */
  it('🔴 "처리 상태" 칸을 만들지 않는다', () => {
    render(<CheckDetailMemo row={row({ memos: [memo()] })} />)

    expect(screen.queryByText(/처리 상태|접수/)).not.toBeInTheDocument()
  })
})

describe('CheckDetailMemo — 🔴 사진 폴백 (B-40)', () => {
  it('첨부가 있으면 썸네일을 그린다', () => {
    render(<CheckDetailMemo row={row({ memos: [memo({ attaches: [attach()] })] })} />)

    expect(screen.getByRole('img', { name: 'abc.jpg' })).toBeInTheDocument()
  })

  it('🔴 onError 가 나면 "이미지를 불러올 수 없습니다" 로 바꾼다', () => {
    render(<CheckDetailMemo row={row({ memos: [memo({ attaches: [attach()] })] })} />)

    // 실서버에서 실제로 일어나는 일이다 — URL 은 오지만 요청하면 404 다
    fireEvent.error(screen.getByRole('img', { name: 'abc.jpg' }))

    expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'abc.jpg' })).not.toBeInTheDocument()
  })

  it('🔴 폴백이 떠도 메모 텍스트와 레이아웃이 멀쩡하다 — Phase 6 독립 테스트 기준', () => {
    render(
      <CheckDetailMemo row={row({ memos: [memo({ memo: '누수 발견', attaches: [attach()] })] })} />
    )

    fireEvent.error(screen.getByRole('img', { name: 'abc.jpg' }))

    expect(screen.getByText('누수 발견')).toBeInTheDocument()
    expect(screen.getByText(/김순찰/)).toBeInTheDocument()
  })

  /** 🔴 실패 상태는 **첨부마다** 들고 있어야 한다 — 묶으면 한 장이 나머지를 가린다 */
  it('🔴 한 장이 실패해도 다른 장은 그대로 남는다', () => {
    const attaches = [
      attach({ attachSeq: 1, fileName: 'a.jpg' }),
      attach({ attachSeq: 2, fileName: 'b.jpg' }),
    ]
    render(<CheckDetailMemo row={row({ memos: [memo({ attaches })] })} />)

    fireEvent.error(screen.getByRole('img', { name: 'a.jpg' }))

    expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'b.jpg' })).toBeInTheDocument()
  })

  /** ⚠️ **`attaches` 는 nullable 이다** — 빈 배열이 아니라 `null` 이 온다 */
  it.each([
    ['null', null],
    ['빈 배열', []],
  ])('⚠️ attaches 가 %s 이면 썸네일 영역이 없다 — throw 하지 않는다', (_label, attaches) => {
    const render1 = () =>
      render(<CheckDetailMemo row={row({ memos: [memo({ attaches })] })} />)

    expect(render1).not.toThrow()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('조명 고장')).toBeInTheDocument()
  })
})

describe('CheckDetailTable — 펼침 (T520)', () => {
  it('🔴 메모 0건 행에는 토글이 걸리지 않는다', () => {
    render(<CheckDetailTable rows={[row({ memos: [] })]} />)

    // 헤더 행에도 `기록` 컬럼명이 있어 `/기록/` 만으로는 그쪽이 잡힌다 — 라벨 전체를 건다
    expect(screen.queryByRole('row', { name: /기록 펼치기/ })).not.toBeInTheDocument()
    // 🔴 토글이 아닌 행에는 `aria-expanded` 가 아예 없어야 한다
    expect(document.querySelector('tbody tr[aria-expanded]')).toBeNull()
  })

  it('메모가 있으면 행이 토글이 되고, 접힌 상태로 시작한다', () => {
    render(<CheckDetailTable rows={[row({ memos: [memo()] })]} />)

    const toggleRow = screen.getByRole('row', { name: /정문 기록 펼치기/ })
    expect(toggleRow).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('조명 고장')).not.toBeInTheDocument()
  })

  it('누르면 본문이 보이고 다시 누르면 접힌다', async () => {
    const user = userEvent.setup()
    render(<CheckDetailTable rows={[row({ memos: [memo()] })]} />)

    await user.click(screen.getByRole('row', { name: /정문 기록 펼치기/ }))
    expect(screen.getByText('조명 고장')).toBeInTheDocument()

    await user.click(screen.getByRole('row', { name: /정문 기록 접기/ }))
    expect(screen.queryByText('조명 고장')).not.toBeInTheDocument()
  })

  /**
   * 🔴 **아코디언이 아니다.** 하나만 열리게 하면 두 지점의 메모를 나란히 비교할 수 없고,
   * "닫으려 하지 않았는데 닫혔다" 가 된다.
   */
  it('🔴 두 행을 동시에 펼칠 수 있다', async () => {
    const user = userEvent.setup()
    const rows = [
      row({ detailSeq: 1, orderNo: 1, pointName: '정문', memos: [memo({ memo: '조명 고장' })] }),
      row({
        detailSeq: 2,
        orderNo: 2,
        pointSeq: 12,
        pointName: '주차장',
        memos: [memo({ memoSeq: 2, memo: '누수' })],
      }),
    ]
    render(<CheckDetailTable rows={rows} />)

    await user.click(screen.getByRole('row', { name: /정문 기록 펼치기/ }))
    await user.click(screen.getByRole('row', { name: /주차장 기록 펼치기/ }))

    expect(screen.getByText('조명 고장')).toBeInTheDocument()
    expect(screen.getByText('누수')).toBeInTheDocument()
  })

  /** 🔴 행이 여러 개라 이름이 겹치면 스크린리더에서 구분이 안 된다(030 선례) */
  it('🔴 토글 행의 접근성 이름에 지점명이 들어간다', () => {
    const rows = [
      row({ detailSeq: 1, orderNo: 1, pointName: '정문', memos: [memo()] }),
      row({ detailSeq: 2, orderNo: 2, pointName: '주차장', memos: [memo({ memoSeq: 2 })] }),
    ]
    render(<CheckDetailTable rows={rows} />)

    expect(screen.getByRole('row', { name: /정문 기록 펼치기/ })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /주차장 기록 펼치기/ })).toBeInTheDocument()
  })
})
