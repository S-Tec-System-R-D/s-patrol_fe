import { describe, expect, it } from 'vitest'
import { getSimBlockers, type SimConfig } from '../config'

const ready: SimConfig = {
  appApiBaseUrl: 'http://app.test',
  webApiBaseUrl: '',
  adminId: '000000',
  adminPw: 'pw',
  workerPw: 'pw',
  mockMode: false,
}

describe('getSimBlockers', () => {
  it('설정이 다 있고 IP 로 열었으면 막지 않는다', () => {
    expect(getSimBlockers(ready, '123.2.156.229')).toEqual([])
  })

  it('mock 모드에서는 막는다', () => {
    expect(getSimBlockers({ ...ready, mockMode: true }, '123.2.156.229')).toContain('mock')
  })

  it('localhost 로 열면 막는다 — 앱 서버가 IP 출처만 허용한다', () => {
    expect(getSimBlockers(ready, 'localhost')).toEqual(['localhost'])
    expect(getSimBlockers(ready, '127.0.0.1')).toEqual(['localhost'])
  })

  it('계정 셋 중 하나라도 없으면 막는다', () => {
    expect(getSimBlockers({ ...ready, workerPw: '' }, '123.2.156.229')).toEqual(['no-account'])
    expect(getSimBlockers({ ...ready, adminPw: '' }, '123.2.156.229')).toEqual(['no-account'])
  })

  it('앱 서버 주소가 없으면 막는다', () => {
    expect(getSimBlockers({ ...ready, appApiBaseUrl: '' }, '123.2.156.229')).toEqual(['no-app-url'])
  })
})
