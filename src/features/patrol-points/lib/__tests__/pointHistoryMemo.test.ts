import { describe, expect, it } from 'vitest'

import type { PointHistoryDetail } from '@/features/course-history/types'
import { toCheckDetailRow } from '../pointHistoryMemo'

/**
 * 지점 상세 → 코스 쪽 모양 어댑터 (`spec 037` T556).
 *
 * 🔴 **이 어댑터가 하는 일은 이름 옮기기 하나다**(B-35). 그래서 테스트도 **이름이 제대로
 * 옮겨졌는지**만 본다 — 표시 로직이 들어가면 `CheckDetailMemo` 와 판단이 두 벌이 된다.
 */

const detail = (over: Partial<PointHistoryDetail> = {}): PointHistoryDetail => ({
  detailSeq: 418,
  pointSeq: 12,
  pointName: '정문 입구',
  overtimeYn: false,
  hasMemo: true,
  status: 4,
  statusName: '완료',
  gpsLat: 37.4936,
  gpsLng: 127.0286,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  userSeq: 21,
  userName: '김근무',
  pauseTime: '00:07:00',
  checkDt: '2026-05-01T09:07:00',
  authMethod: 9,
  authMethodName: 'QR',
  memoList: [
    {
      memoSeq: 50,
      memo: '3층 비상등 점멸',
      attachList: [{ attachSeq: 46, attachPath: 'http://x/a.jpg', fileName: 'a.jpg' }],
    },
  ],
  ...over,
})

describe('toCheckDetailRow', () => {
  it('🔴 memoList → memos · attachList → attaches · attachPath → imagePath (B-35)', () => {
    const row = toCheckDetailRow(detail())

    expect(row.memos).toHaveLength(1)
    expect(row.memos[0].memoSeq).toBe(50)
    expect(row.memos[0].memo).toBe('3층 비상등 점멸')
    expect(row.memos[0].attaches).toEqual([
      { attachSeq: 46, imagePath: 'http://x/a.jpg', fileName: 'a.jpg', fileExt: '' },
    ])
  })

  it('🔴 fileExt 를 파일명에서 추측해 채우지 않는다 — 서버 값과 우리 추측이 섞인다', () => {
    const row = toCheckDetailRow(detail())

    // `CheckDetailMemo` 는 fileExt 를 쓰지 않는다. 필요해지면 백엔드에 요청한다(A1)
    expect(row.memos[0].attaches?.[0].fileExt).toBe('')
  })

  it('userSeq → checkUserSeq 로 옮긴다 — 코스 쪽 이름이 다르다', () => {
    const row = toCheckDetailRow(detail())

    expect(row.checkUserSeq).toBe(21)
    expect(row.userName).toBe('김근무')
  })

  it('⚠️ overtimeYn 철자 차이를 흡수한다 (상세는 소문자 t, B-4)', () => {
    expect(toCheckDetailRow(detail({ overtimeYn: true })).overtimeYn).toBe(true)
  })

  it('좌표는 그대로 옮긴다 — 상세 응답에 있다', () => {
    const row = toCheckDetailRow(detail())

    expect(row.gpsLat).toBe(37.4936)
    expect(row.gpsLng).toBe(127.0286)
  })

  it('🔴 orderNo 는 알 수 없다 — historySeq 가 없어 회차 안의 순번을 모른다', () => {
    // 뜻이 있는 것처럼 채우면 나중에 누가 "코스 내 순서" 로 읽는다(US4 가 막혀 있는 자리)
    expect(toCheckDetailRow(detail()).orderNo).toBe(0)
  })

  it('메모가 없으면 빈 배열이다', () => {
    expect(toCheckDetailRow(detail({ hasMemo: false, memoList: [] })).memos).toEqual([])
  })

  it('첨부가 여러 장인 메모를 전부 옮긴다 (실측: historySeq 16 에 2장)', () => {
    const row = toCheckDetailRow(
      detail({
        memoList: [
          {
            memoSeq: 51,
            memo: '누수',
            attachList: [
              { attachSeq: 29, attachPath: 'http://x/1.jpg', fileName: '1.jpg' },
              { attachSeq: 30, attachPath: 'http://x/2.jpg', fileName: '2.jpg' },
            ],
          },
        ],
      })
    )

    expect(row.memos[0].attaches).toHaveLength(2)
  })

  it('🔴 attachList 가 null 로 와도 터지지 않는다 — 코스 쪽에서 실제로 null 이 온다', () => {
    const row = toCheckDetailRow(
      detail({
        memoList: [
          {
            memoSeq: 52,
            memo: '첨부 없음',
            attachList: null as unknown as PointHistoryDetail['memoList'][number]['attachList'],
          },
        ],
      })
    )

    expect(row.memos[0].attaches).toEqual([])
  })
})
