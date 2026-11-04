import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

import { dashboardKeys } from '@/features/dashboard/queryKeys'
import {
  createDashboardEventHandler,
  DASHBOARD_EVENT_BATCH_MS,
} from '@/features/dashboard/realtime/handleDashboardEvent'
import type { SseMessage } from '@/lib/sse/parseSse'

const SITE = 6

const message = (event: string, data: Record<string, unknown> = {}): SseMessage => ({
  event,
  data: JSON.stringify({ link: 'Patrol', siteSeq: SITE, courseSeq: 74, historySeq: 92, userSeq: 13, ...data }),
  id: null,
})
const connected: SseMessage = { event: 'connected', data: 'conn-1', id: null }

const COURSES = JSON.stringify(dashboardKeys.courses(SITE))
const SUMMARY = JSON.stringify(dashboardKeys.summary(SITE))
const HISTORIES = JSON.stringify(dashboardKeys.pointHistories(SITE))
const FINISHED = JSON.stringify(dashboardKeys.finishedCourses(SITE))

let invalidate: MockInstance<QueryClient['invalidateQueries']>

const setup = () => {
  const queryClient = new QueryClient()
  invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
  return createDashboardEventHandler(queryClient, SITE)
}

/** 다시 받은 키 목록(문자열) */
const invalidated = () =>
  invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey))

const flush = () => vi.advanceTimersByTime(DASHBOARD_EVENT_BATCH_MS)

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('createDashboardEventHandler — 다시 받는 영역', () => {
  it.each(['course-started', 'course-paused', 'course-handover'])('%s = 진행 중 목록만', (event) => {
    const { handle } = setup()
    handle(message(event))
    flush()
    expect(invalidated()).toEqual([COURSES])
  })

  it.each(['point-checked', 'course-ended'])('%s = 목록 + 오늘 숫자 · 최근 기록 · 최근 종료', (event) => {
    const { handle } = setup()
    handle(message(event))
    flush()
    expect(invalidated()).toEqual([COURSES, SUMMARY, HISTORIES, FINISHED])
  })

  it('첫 연결 = 목록만 · 재연결 = 셋 다', () => {
    const { handle } = setup()
    handle(connected)
    flush()
    expect(invalidated()).toEqual([COURSES])

    invalidate.mockClear()
    handle(connected)
    flush()
    expect(invalidated()).toEqual([COURSES, SUMMARY, HISTORIES, FINISHED])
  })
})

describe('createDashboardEventHandler — 버리는 알림', () => {
  it('다른 사업장', () => {
    const { handle } = setup()
    handle(message('point-checked', { siteSeq: 7 }))
    flush()
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('`link` 가 Patrol 이 아님', () => {
    const { handle } = setup()
    handle(message('course-started', { link: 'Notice' }))
    flush()
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('JSON 이 아닌 data', () => {
    const { handle } = setup()
    handle({ event: 'course-ended', data: 'not-json', id: null })
    flush()
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('모르는 이벤트 이름 · 이름 없는 메시지', () => {
    const { handle } = setup()
    handle(message('course-resumed'))
    handle(message('message'))
    flush()
    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe('createDashboardEventHandler — 묶기', () => {
  it('0.5초 안에 몰린 알림은 영역마다 1번 — 건너뛰기 3 + 인증 + 자동 종료', () => {
    const { handle } = setup()
    handle(message('point-checked', { detailSeq: 1, detailStatus: 3 }))
    handle(message('point-checked', { detailSeq: 2, detailStatus: 3 }))
    handle(message('point-checked', { detailSeq: 3, detailStatus: 3 }))
    handle(message('course-ended', { endType: 'completed' }))
    handle(message('point-checked', { detailSeq: 4, detailStatus: 4 }))
    flush()
    expect(invalidated()).toEqual([COURSES, SUMMARY, HISTORIES, FINISHED])
  })

  it('마지막 알림부터 다시 0.5초를 센다', () => {
    const { handle } = setup()
    handle(message('course-started'))
    vi.advanceTimersByTime(DASHBOARD_EVENT_BATCH_MS - 100)
    handle(message('course-paused'))
    vi.advanceTimersByTime(DASHBOARD_EVENT_BATCH_MS - 100)
    expect(invalidate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(invalidated()).toEqual([COURSES])
  })

  it('목록만 알림 뒤 결과 알림이 섞이면 셋 다', () => {
    const { handle } = setup()
    handle(message('course-handover'))
    handle(message('course-ended'))
    flush()
    expect(invalidated()).toEqual([COURSES, SUMMARY, HISTORIES, FINISHED])
  })

  it('한 번 다시 받은 뒤엔 새로 센다 — 앞 묶음의 결과 영역이 남지 않는다', () => {
    const { handle } = setup()
    handle(message('course-ended'))
    flush()
    invalidate.mockClear()
    handle(message('course-started'))
    flush()
    expect(invalidated()).toEqual([COURSES])
  })

  it('dispose 하면 묶어 둔 다시 받기를 버린다', () => {
    const { handle, dispose } = setup()
    handle(message('course-ended'))
    dispose()
    flush()
    expect(invalidate).not.toHaveBeenCalled()
  })
})
