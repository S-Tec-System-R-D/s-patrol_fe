import { fireEvent, render, screen, within } from '@testing-library/react'
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

/** 표(`xl` 이상)만 본다 — jsdom 은 미디어쿼리가 없어 타임라인(`xl` 미만)도 함께 그려진다 */
const inTable = () => within(screen.getByRole('table'))
const inTimeline = () => within(screen.getByRole('list', { name: '지점 인증 내역' }))

describe('CheckDetailTable — 기록 칸 건수 (2026-10-20)', () => {
  /**
   * 🔴 **아이콘이 아니라 건수다**(목업 `코스상세 - 지점인증내역 수정안`). 메시지 아이콘은
   * "뭔가 있다" 까지만 말해서, 어느 행을 펼쳐 볼지 고를 수가 없었다.
   *
   * ⚠️ **목록(`ZoneColumn`)은 그대로 아이콘이다** — 거기는 응답에 `hasMemo` boolean 뿐이라
   * 셀 수가 없다(세려면 행마다 `CheckDetails` 조회 = N+1). 같은 화면이 아니다.
   */
  it('사진과 메모 건수를 함께 적는다', () => {
    const memos = [memo({ attaches: [attach({ attachSeq: 1 }), attach({ attachSeq: 2 })] })]
    render(<CheckDetailTable rows={[row({ memos })]} />)

    expect(inTable().getByText(/사진 2 · 메모 1/)).toBeInTheDocument()
  })

  /** 🔴 **`사진 0` 을 적지 않는다** — 첨부 없는 메모가 흔하고, `0` 은 빈 값이지 사실이 아니다 */
  it('🔴 사진이 없으면 메모 건수만 적는다', () => {
    render(<CheckDetailTable rows={[row({ memos: [memo({ attaches: null })] })]} />)

    expect(inTable().getByText(/메모 1/)).toBeInTheDocument()
    expect(screen.queryByText(/사진 0/)).not.toBeInTheDocument()
  })

  /** ⚠️ `attaches` 는 **nullable** 이다 — 섞여 와도 합이 깨지지 않아야 한다 */
  it('메모가 여러 건이면 첨부를 합쳐 센다', () => {
    const memos = [
      memo({ memoSeq: 1, attaches: [attach({ attachSeq: 1 })] }),
      memo({ memoSeq: 2, attaches: null }),
    ]
    render(<CheckDetailTable rows={[row({ memos })]} />)

    expect(inTable().getByText(/사진 1 · 메모 2/)).toBeInTheDocument()
  })
})

describe('CheckDetailTimeline — xl 미만 (spec 055)', () => {
  it('orderNo 순서로 그리고 구간을 노드에 적는다', () => {
    render(
      <CheckDetailTable
        rows={[
          row({ detailSeq: 2, orderNo: 2, pointName: '로비', checkDt: '2026-05-01T10:18:00' }),
          row({ detailSeq: 1, orderNo: 1, pointName: '정문', checkDt: '2026-05-01T10:06:00' }),
        ]}
      />
    )

    const items = inTimeline().getAllByRole('listitem')
    expect(items.map((item) => within(item).getByText(/정문|로비/).textContent)).toEqual(['정문', '로비'])
    expect(within(items[1]).getByText(/구간 \+/)).toBeInTheDocument()
    expect(within(items[0]).queryByText(/구간/)).not.toBeInTheDocument()
  })

  it('기록 버튼으로 메모를 펼치고 접는다 — 행 전체가 아니라 버튼이다', async () => {
    render(<CheckDetailTable rows={[row({ memos: [memo({ memo: '누수 발견' })] })]} />)
    const user = userEvent.setup()

    await user.click(inTimeline().getByRole('button', { name: '정문 기록 펼치기' }))
    expect(inTimeline().getByText('누수 발견')).toBeInTheDocument()

    await user.click(inTimeline().getByRole('button', { name: '정문 기록 접기' }))
    expect(inTimeline().queryByText('누수 발견')).not.toBeInTheDocument()
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
