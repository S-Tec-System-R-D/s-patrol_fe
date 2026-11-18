import { getSimConfig } from '../config'
import { webRequest } from './webClient'

/**
 * 구축 쓰기 (`spec 082`) — **본사 토큰 + 웹 API**.
 * 본사 토큰으로 사업장 안 쓰기가 된다(실측 2026-11-18). 현장관리자가 없는 사업장도 구축할 수 있다.
 *
 * 🔴 셋 다 성공 응답이 `data: true` 뿐이다 — **만든 것의 번호가 없다.** 번호가 필요하면 목록을 다시 읽는다.
 */

/** `codeSeq` 7 = 현장 근무자 */
const FIELD_WORKER = 7

export interface NewWorker {
  loginId: string
  name: string
  phone: string
}

/** 비밀번호는 공통 비밀번호(`VITE_SIM_WORKER_PW`)로 만든다 — 그래야 시뮬레이터가 그 근무자로 로그인한다 */
export const addWorker = (siteSeq: number, worker: NewWorker): Promise<boolean> => {
  const form = new FormData()
  form.append('siteSeq', String(siteSeq))
  form.append('codeSeq', String(FIELD_WORKER))
  form.append('loginId', worker.loginId)
  form.append('loginPw', getSimConfig().workerPw)
  form.append('name', worker.name)
  form.append('phone', worker.phone)
  return webRequest<boolean>({ method: 'POST', url: '/api/v1/User/W/sign/AddUser', data: form })
}

export interface NewPoint {
  name: string
  /** 9 QR · 10 NFC */
  authMethod: 9 | 10
  /** NFC 만 — QR 코드는 서버가 만든다 */
  nfcTagId?: string
  gpsLat: number
  gpsLng: number
}

export const addPoint = (siteSeq: number, point: NewPoint): Promise<boolean> =>
  webRequest<boolean>({
    method: 'POST',
    url: '/api/v1/Point/W/sign/AddPoint',
    data: { siteSeq, memo: null, useYn: true, ...point },
  })

export interface NewCourse {
  courseName: string
  /** 교대 허용 */
  switchYn: boolean
  /** 지점당 제한 시간(분) */
  courseMin: number
  /** 순서대로 */
  pointSeqs: number[]
}

const courseBody = (siteSeq: number, course: NewCourse) => ({
  siteSeq,
  courseName: course.courseName,
  memo: null,
  useYn: true,
  switchYn: course.switchYn,
  totalMin: course.courseMin * course.pointSeqs.length,
  points: course.pointSeqs.map((pointSeq, index) => ({
    pointSeq,
    orderNo: index + 1,
    courseMin: course.courseMin,
  })),
})

/**
 * 🔴 **웹 `AddCourse` 는 `points` 를 무시한다**(`api-spec.md` B-27 — 200 인데 지점 0개로 만들어진다).
 * 지점은 만든 뒤 `assignCoursePoints` 로 한 번 더 넣어야 한다.
 */
export const addCourse = (siteSeq: number, course: NewCourse): Promise<boolean> =>
  webRequest<boolean>({
    method: 'POST',
    url: '/api/v1/Course/W/sign/AddCourse',
    data: courseBody(siteSeq, course),
  })

/** 방금 만든 코스에 지점을 넣는다 — 새 지점이라 `coursePointSeq` 없이 보낸다 */
export const assignCoursePoints = (
  siteSeq: number,
  courseSeq: number,
  course: NewCourse
): Promise<boolean> =>
  webRequest<boolean>({
    method: 'PUT',
    url: '/api/v1/Course/W/sign/UpdateCourse',
    data: { ...courseBody(siteSeq, course), courseSeq },
  })
