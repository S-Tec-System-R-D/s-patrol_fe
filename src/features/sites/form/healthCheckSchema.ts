import z from 'zod'

import { isHealthCheckEmpty, toExceptionRequest, toHHmm, toHHmmss } from '../lib/healthCheck'
import type { SiteDetail, UpdateSiteRequest } from '../types/site'

/**
 * 헬스체크 설정 (`spec 044` T806).
 *
 * - 시각은 `<input type="time">` 값(`'HH:mm'`)으로만 받는다 — 서버는 `"25:00:00"` 을 25일로 저장한다(B-53).
 * - 🔴 **시작 = 종료만 막는다**(서버 400 과 같은 규칙). 시작 > 종료는 자정 넘김으로 허용한다(서버도 받는다).
 * - 예외 시간도 시작 ≠ 종료만 — 사용 시간대 밖 · 겹침 규칙은 미정(OQ-044-C, B-53).
 * - 숫자 칸은 입력 문자열로 들고 요청을 만들 때 숫자로 바꾼다(빈 칸을 0 으로 바꾸지 않으려고).
 */

const SAME_TIME = '시작과 종료가 같을 수 없습니다.'

const time = z.string().min(1, '시각을 입력해주세요.')
const integerAtLeast = (min: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${min} 이상의 정수를 입력해주세요.`)
    .refine((value) => Number(value) >= min, `${min} 이상의 정수를 입력해주세요.`)

const exceptionRow = z
  .object({ detailSeq: z.number().optional(), start: time, end: time })
  .refine((row) => row.start !== row.end, { message: SAME_TIME, path: ['end'] })

export const healthCheckSchema = z
  .object({
    startTime: time,
    endTime: time,
    interval: integerAtLeast(1),
    timeout: integerAtLeast(1),
    retry: integerAtLeast(0),
    exceptions: z.array(exceptionRow),
  })
  .refine((data) => data.startTime !== data.endTime, { message: SAME_TIME, path: ['endTime'] })

export type HealthCheckFormData = z.infer<typeof healthCheckSchema>

/** 상세 → 폼 초기값. 🔴 값이 빈 사업장(최소 생성 — `Interval 0` 등)은 0 을 채우지 않고 빈 칸으로 둔다 */
export const toHealthCheckFormValues = (detail: SiteDetail): HealthCheckFormData => {
  const empty = isHealthCheckEmpty(detail)
  return {
    startTime: toHHmm(detail.healthCheckStartTime),
    endTime: toHHmm(detail.healthCheckEndTime),
    interval: empty && detail.healthCheckInterval <= 0 ? '' : String(detail.healthCheckInterval),
    timeout: empty && detail.healthCheckTimeout <= 0 ? '' : String(detail.healthCheckTimeout),
    retry: detail.healthCheckRetry === null ? '' : String(detail.healthCheckRetry),
    exceptions: detail.exceptionTime.map((row) => ({
      detailSeq: row.detailSeq,
      start: toHHmm(row.exceptionStartTime),
      end: toHHmm(row.exceptionEndTime),
    })),
  }
}

/**
 * 저장 바디 — 🔴 저장이 곧 켜기다(`healthCheckYn: true`). 예외 시간은 **매번 전체**를 보낸다(통째 교체):
 * 기존 행은 자기 `detailSeq`, 새 행은 `0`, 전부 지우면 `[]`.
 */
export const toHealthCheckRequest = (
  siteSeq: number,
  data: HealthCheckFormData
): UpdateSiteRequest => ({
  siteSeq,
  healthCheckYn: true,
  healthCheckInterval: Number(data.interval),
  healthCheckTimeout: Number(data.timeout),
  healthCheckRetry: Number(data.retry),
  healthCheckStartTime: toHHmmss(data.startTime),
  healthCheckEndTime: toHHmmss(data.endTime),
  exceptionTime: toExceptionRequest(data.exceptions),
})
