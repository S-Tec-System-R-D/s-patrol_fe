import { describe, expect, it } from 'vitest'
import type { AppUserDetail, UserAffiliation } from '../../types'
import { assignmentStateOf } from '../assignmentState'

const HOME = 35
const AWAY = 34

const detail = (affiliation: Partial<UserAffiliation> | null): AppUserDetail => ({
  userSeq: 179275,
  codeSeq: 7,
  codeName: '현장 근무자',
  siteSeq: HOME,
  siteName: 'WEB 테스트 사업장2',
  loginId: '600203',
  userName: '근무자3',
  phoneNumber: '01000600203',
  image: null,
  imageName: null,
  workYn: false,
  affiliation: affiliation && {
    assignmentSeq: 55,
    affiliationSiteSeq: AWAY,
    affiliationSiteName: 'WEB 테스트 사업장',
    assignmentType: 'SUBSTITUTE',
    assignApprovalStatus: 1,
    reason: null,
    startDt: '2026-11-18T00:00:00',
    endDt: null,
    returnApprovalStatus: 0,
    ...affiliation,
  },
})

describe('assignmentStateOf', () => {
  it('배치 정보가 없으면 원 소속 — 배치 요청만 할 수 있다', () => {
    expect(assignmentStateOf(detail(null), HOME)).toEqual({
      kind: 'home',
      label: null,
      action: 'assign',
      assignmentSeq: null,
    })
  })

  it('승인을 기다리는 동안은 할 수 있는 동작이 없다', () => {
    expect(assignmentStateOf(detail({ assignApprovalStatus: 0 }), HOME)).toMatchObject({
      kind: 'assign-pending',
      action: null,
      label: '배치 승인 대기 → WEB 테스트 사업장',
    })
    expect(assignmentStateOf(detail({ returnApprovalStatus: 1 }), AWAY)).toMatchObject({
      kind: 'return-pending',
      action: null,
    })
  })

  it('배치 중이면 복귀 요청을 할 수 있고 배치 번호를 준다', () => {
    expect(assignmentStateOf(detail({}), AWAY)).toMatchObject({
      kind: 'assigned',
      action: 'return',
      assignmentSeq: 55,
    })
  })

  it('거절된 뒤에는 다시 요청할 수 있다', () => {
    expect(assignmentStateOf(detail({ assignApprovalStatus: 2 }), HOME)).toMatchObject({
      kind: 'assign-rejected',
      action: 'assign',
    })
    expect(assignmentStateOf(detail({ returnApprovalStatus: 3 }), AWAY)).toMatchObject({
      kind: 'return-rejected',
      action: 'return',
    })
  })

  it('받는 사업장에서 보면 원 소속을, 그 밖에서는 가는 곳을 적는다', () => {
    expect(assignmentStateOf(detail({}), AWAY).label).toBe('배치 중 · 원 소속 WEB 테스트 사업장2')
    expect(assignmentStateOf(detail({}), HOME).label).toBe('배치 중 · → WEB 테스트 사업장')
  })
})
