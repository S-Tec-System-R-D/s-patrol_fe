import type { ActivePatrol, AppPointDetail, SimCourseDetail } from '../types'
import { appRequest } from './appClient'
import { webRequest } from './webClient'

/**
 * 순찰 API (`spec 082` US3) — 호출 순서와 규칙은 `docs/app-api-spec.md` §3-1 ~ §3-3.
 * 전부 **근무자 토큰 + 앱 API** 다. 첫 인자가 "누구로 부를지"(아이디)다.
 *
 * 엔진(`runPatrol`)은 이 모양(`PatrolApi`)만 안다 — 테스트는 가짜를 넣어 호출 순서를 본다.
 */
export interface CertifyInput {
  historySeq: number
  detailSeq: number
  /** 건너뛰기 — 인증값 없이 보낸다 */
  skip: boolean
  authMethod?: number
  authValue?: string
  gpsLat?: number | null
  gpsLng?: number | null
  /** 🔴 없으면 필드를 아예 보내지 않는다(빈 문자열은 400) */
  memo?: string
}

export interface PatrolApi {
  /** 돌려주는 값이 회차 번호(`historySeq`)다 */
  startPatrol(loginId: string, courseSeq: number, siteSeq: number): Promise<number>
  getActivePatrol(loginId: string): Promise<ActivePatrol | null>
  /** 끝난 회차도 읽힌다 */
  getPatrolInfo(loginId: string, historySeq: number): Promise<ActivePatrol | null>
  getPointDetail(loginId: string, pointSeq: number): Promise<AppPointDetail>
  certify(loginId: string, input: CertifyInput): Promise<boolean>
  endPatrol(loginId: string, historySeq: number): Promise<boolean>
  requestHandOver(loginId: string, historySeq: number): Promise<boolean>
  cancelHandOver(loginId: string, historySeq: number, pauseSeconds: number): Promise<boolean>
  /** `pauseSeconds` — 멈춰 있던 시간. 🔴 서버가 재지 않고 보낸 값을 그대로 더한다 */
  acceptHandOver(loginId: string, historySeq: number, pauseSeconds: number): Promise<boolean>
}

const PATROL = '/api/v1/UserPatrol/M/sign'

export const patrolApi: PatrolApi = {
  startPatrol: (loginId, courseSeq, siteSeq) =>
    appRequest<number>(loginId, {
      method: 'PUT',
      url: `${PATROL}/StartPatrol`,
      data: { courseSeq, siteSeq },
    }),

  getActivePatrol: (loginId) =>
    appRequest<ActivePatrol | null>(loginId, { url: `${PATROL}/GetMyActivePatrol` }),

  getPatrolInfo: (loginId, historySeq) =>
    appRequest<ActivePatrol | null>(loginId, {
      url: `${PATROL}/GetStartPatrolInfo`,
      params: { historySeq },
    }),

  getPointDetail: (loginId, pointSeq) =>
    appRequest<AppPointDetail>(loginId, {
      url: '/api/v1/Point/M/sign/DetailPoint',
      params: { pointSeq },
    }),

  certify: (loginId, input) => {
    const form = new FormData()
    form.append('historySeq', String(input.historySeq))
    form.append('detailSeq', String(input.detailSeq))
    form.append('skipYn', String(input.skip))
    if (!input.skip) {
      form.append('authMethod', String(input.authMethod))
      form.append('authValue', input.authValue ?? '')
      if (input.gpsLat != null) form.append('gpsLat', String(input.gpsLat))
      if (input.gpsLng != null) form.append('gpsLng', String(input.gpsLng))
    }
    if (input.memo) form.append('memoInfo.memo', input.memo)
    return appRequest<boolean>(loginId, {
      method: 'POST',
      url: `${PATROL}/CertificationPatrol`,
      data: form,
    })
  },

  endPatrol: (loginId, historySeq) =>
    appRequest<boolean>(loginId, { method: 'PUT', url: `${PATROL}/EndPatrol`, params: { historySeq } }),

  requestHandOver: (loginId, historySeq) =>
    appRequest<boolean>(loginId, {
      method: 'PUT',
      url: `${PATROL}/RequestHandOver`,
      params: { historySeq },
    }),

  cancelHandOver: (loginId, historySeq, pauseSeconds) =>
    appRequest<boolean>(loginId, {
      method: 'PUT',
      url: `${PATROL}/CancelHandOver`,
      params: { historySeq, pauseTime: pauseSeconds },
    }),

  acceptHandOver: (loginId, historySeq, pauseSeconds) =>
    appRequest<boolean>(loginId, {
      method: 'POST',
      url: `${PATROL}/AcceptHandOver`,
      data: { historySeq, pauseTime: pauseSeconds },
    }),
}

/** 코스의 지점 편성(순서 · 지점당 제한 시간) — 본사 토큰 + 웹 API */
export const fetchCourseDetail = (courseSeq: number): Promise<SimCourseDetail> =>
  webRequest<SimCourseDetail>({ url: '/api/v1/Course/W/sign/GetCourseDetail', params: { courseSeq } })
