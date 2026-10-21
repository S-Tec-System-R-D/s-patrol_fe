import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetUserStore } from '@/mocks/handlers/users'
import { makeAccessToken } from '@/test/jwt'

import { addUser } from '../addUser'
import { fetchUserDetail } from '../getUserDetail'
import { fetchUserList } from '../getUserList'
import { removeUser } from '../removeUser'
import { updateUser } from '../updateUser'

/**
 * 근무자 쓰기 API 3종 + 상태 보유 MSW (`spec 041` Phase 1 게이트).
 *
 * multipart 본문이 MSW 까지 실제로 읽히는지, 실측 규칙(사번 중복 400 · `codeSeq` 누락 500 ·
 * 삭제 후 상세 404)을 mock 이 지키는지 본다.
 */

const list = () => fetchUserList({ siteId: 7, pageNumber: 1, pageSize: 100 })
const NEW_USER = {
  siteSeq: 7,
  codeSeq: 7,
  loginId: '990001',
  loginPw: 'Abcd123!',
  name: '새근무자',
  phone: '01012341234',
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetUserStore()
})

describe('addUser', () => {
  it('추가하면 목록에 근무자로 나온다', async () => {
    await addUser(NEW_USER)
    const { items } = await list()
    expect(items.find((u) => u.loginId === '990001')).toMatchObject({
      userName: '새근무자',
      codeSeq: 7,
      codeName: '현장 근무자',
    })
  })

  it('사번이 겹치면 400 + 서버 문구', async () => {
    await addUser(NEW_USER)
    await expect(addUser({ ...NEW_USER, name: '다른사람' })).rejects.toMatchObject({
      message: '이미 사용중인 아이디입니다.',
    })
  })
})

describe('updateUser', () => {
  it('보낸 필드만 바뀐다 — 부분 갱신', async () => {
    await updateUser({ userSeq: 101, name: '김민준2' })
    expect(await fetchUserDetail(101)).toMatchObject({ userName: '김민준2', phone: '01023456789' })
  })

  it('없는 근무자는 400 이다', async () => {
    await expect(updateUser({ userSeq: 999, name: 'x' })).rejects.toBeTruthy()
  })
})

describe('removeUser', () => {
  it('삭제하면 목록에서 사라지고 상세는 실패, 이중 삭제도 실패', async () => {
    await removeUser(102)
    const { items } = await list()
    expect(items.map((u) => u.userSeq)).not.toContain(102)
    await expect(fetchUserDetail(102)).rejects.toBeTruthy()
    await expect(removeUser(102)).rejects.toBeTruthy()
  })
})
