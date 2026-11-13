import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CheckDetailRow } from '@/features/course-history/types'

import CheckDetailMemo from '../components/detail/CheckDetailMemo'


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
   * 행의 `userName` 으로 대체한다.
   */
  it('🔴 작성자를 행에서 가져와 패널 머리에 한 번만 적는다 · 인증 시각은 다른 곳이 적어 뺐다', () => {
    render(
      <CheckDetailMemo
        row={row({
          memos: [
            { memoSeq: 1, memo: '첫째', attaches: null },
            { memoSeq: 2, memo: '둘째', attaches: null },
          ],
        })}
      />
    )
    expect(screen.getAllByText(row().userName as string)).toHaveLength(1)
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
describe('CheckDetailMemo — 사진 캡션 (2026-10-20)', () => {
  /**
   * 🔴 **파일명을 썸네일 아래 적는다** — 전에는 `alt`·`title` 에만 있어 **마우스를 올려야**
   * 보였고, 사진이 여러 장이면 어느 것이 무엇인지 화면에서 구분이 안 됐다.
   */
  it('썸네일 아래에 파일명을 적는다', () => {
    render(<CheckDetailMemo row={row({ memos: [memo({ attaches: [attach()] })] })} />)

    expect(screen.getByText('abc.jpg')).toBeInTheDocument()
  })

  /**
   * 🔴 **촬영 시각을 적지 않는다**(A1). 목업에는 `10:24` 가 있지만 **첨부에 시각 필드가
   * 없다** — `attachSeq`·`imagePath`·`fileName`·`fileExt` 가 전부다.
   */
  it('🔴 캡션에 시각을 지어내지 않는다', () => {
    render(<CheckDetailMemo row={row({ memos: [memo({ attaches: [attach()] })] })} />)

    const caption = screen.getByText('abc.jpg')
    expect(caption.textContent).toBe('abc.jpg')
  })

  /** 폴백으로 떨어져도 어느 파일이 실패했는지는 남아야 백엔드에 전달된다(B-40) */
  it('폴백 상태에서도 파일명이 남는다', () => {
    render(<CheckDetailMemo row={row({ memos: [memo({ attaches: [attach()] })] })} />)

    fireEvent.error(screen.getByRole('img', { name: 'abc.jpg' }))

    expect(screen.getByText('abc.jpg')).toBeInTheDocument()
    expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument()
  })
})

describe('CheckDetailMemo — 사진 +N (spec 077)', () => {
  it('photoLimit 을 넘는 사진은 +N 으로 접고, 누르면 전부 보인다', () => {
    const attaches = [1, 2, 3, 4, 5].map((n) => attach({ attachSeq: n, fileName: `p${n}.jpg` }))
    render(<CheckDetailMemo row={row({ memos: [memo({ attaches })] })} photoLimit={3} />)

    expect(screen.getAllByRole('img')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: '사진 2장 더 보기' }))
    expect(screen.getAllByRole('img')).toHaveLength(5)
  })
})
