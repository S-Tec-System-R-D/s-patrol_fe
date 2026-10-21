import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetNoticeStore } from '@/mocks/handlers/notices'
import { makeAccessToken } from '@/test/jwt'

import { addNotice } from '../addNotice'
import { deleteNotice } from '../deleteNotice'
import { fetchNoticeDetail } from '../getNoticeDetail'
import { fetchNoticeList } from '../getNoticeList'
import { upsertNotice } from '../upsertNotice'

/**
 * 공지 쓰기 API 3종 + 상태 보유 MSW (`spec 040` Phase 1 게이트).
 *
 * multipart 본문이 jsdom → MSW 까지 **실제로 읽히는지** 본다 — 빌더 단위 테스트만으로는
 * 전송 경로(axios 가 boundary 를 붙이는지)를 확인할 수 없다.
 */

const file = (name: string) => new File(['x'], name)
const list = () => fetchNoticeList({ siteSeq: 7, pageNumber: 1, pageSize: 100 })

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetNoticeStore()
})

describe('addNotice', () => {
  it('작성하면 목록에 나오고 첨부가 확장자로 나뉜다', async () => {
    await addNotice({
      siteSeq: 7,
      title: '새 공지',
      description: '본문',
      isPin: true,
      file: [file('a.png'), file('b.pdf')],
    })
    const { items } = await list()
    // 고정 먼저, 그 안에서 최신순 → 맨 앞
    expect(items[0]).toMatchObject({ title: '새 공지', isPin: true, attachCount: 2 })

    const detail = await fetchNoticeDetail(items[0].noticeSeq)
    expect(detail.imageList.map((a) => a.attachName)).toEqual(['a.png'])
    expect(detail.fileList.map((a) => a.attachName)).toEqual(['b.pdf'])
  })

  it('제목이 없으면 400 이다', async () => {
    await expect(
      addNotice({ siteSeq: 7, title: '', description: '본문', isPin: false, file: [] })
    ).rejects.toBeTruthy()
  })
})

describe('upsertNotice', () => {
  it('필드를 바꾸고 첨부를 지우고 붙인다(한 요청)', async () => {
    await upsertNotice({
      noticeSeq: 4,
      title: '바뀐 제목',
      description: '바뀐 본문',
      isPin: true,
      removeAttachSeqs: [41, 43],
      newFiles: [file('n1.webp'), file('n2.xlsx')],
    })
    const detail = await fetchNoticeDetail(4)
    expect(detail).toMatchObject({ title: '바뀐 제목', description: '바뀐 본문', isPin: true })
    expect(detail.imageList.map((a) => a.attachName)).toEqual(['NFC_태그_위치.png', 'n1.webp'])
    expect(detail.fileList.map((a) => a.attachName)).toEqual(['점검표_양식.xlsx', 'n2.xlsx'])
  })

  it('없는 공지는 400 이다', async () => {
    await expect(
      upsertNotice({
        noticeSeq: 999,
        title: 't',
        description: 'd',
        isPin: false,
        removeAttachSeqs: [],
        newFiles: [],
      })
    ).rejects.toBeTruthy()
  })
})

describe('deleteNotice', () => {
  it('삭제하면 목록에서 사라지고 상세는 400, 이중 삭제도 400', async () => {
    await deleteNotice(3)
    const { items } = await list()
    expect(items.map((n) => n.noticeSeq)).not.toContain(3)
    await expect(fetchNoticeDetail(3)).rejects.toBeTruthy()
    await expect(deleteNotice(3)).rejects.toBeTruthy()
  })
})
