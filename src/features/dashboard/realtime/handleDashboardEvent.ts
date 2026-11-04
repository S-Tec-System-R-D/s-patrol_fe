import type { QueryClient } from '@tanstack/react-query'

import type { SseMessage } from '@/lib/sse/parseSse'

import { dashboardKeys } from '../queryKeys'
import type { SseEventBase } from '../types'

/**
 * 대시보드 실시간 알림 처리 — `spec 069` T1148.
 *
 * 🔴 **알림은 "무엇이 바뀌었다" 신호로만 쓰고, 화면 값은 전부 다시 받는다**(사용자 결정 2026-11-03 · OQ-069-A · B).
 * 캐시를 고치지 않는다 — 지점 인증 알림엔 "다음 지점"이 없고, 캐시를 고치면 경과 시간의 기준(받은 시각)이 틀어진다.
 * 그래서 이벤트 순서(B-64) · 시작 없이 다시 열린 회차(B-65)에도 기대는 것이 없다.
 *
 * 🔴 **몰리면 묶는다** — 건너뛰기는 지점마다 알림이 한꺼번에 오고, 마지막 인증과 자동 종료도 같은 순간에 온다.
 * 마지막 알림 뒤 0.5초 기다렸다 영역마다 한 번 다시 받는다.
 */

export const DASHBOARD_EVENT_BATCH_MS = 500

/** 진행 중 목록만 */
const COURSE_EVENTS = new Set(['course-started', 'course-paused', 'course-handover'])
/** 진행 중 목록 + 오늘 숫자 · 최근 기록 · 최근 종료 */
const RESULT_EVENTS = new Set(['point-checked', 'course-ended'])

const parseEvent = (data: string): SseEventBase | null => {
  try {
    const parsed: unknown = JSON.parse(data)
    return typeof parsed === 'object' && parsed !== null ? (parsed as SseEventBase) : null
  } catch {
    return null
  }
}

export const createDashboardEventHandler = (queryClient: QueryClient, siteSeq: number) => {
  let connectedCount = 0
  let refetchCourses = false
  let refetchResults = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    timer = null
    if (refetchCourses) void queryClient.invalidateQueries({ queryKey: dashboardKeys.courses(siteSeq) })
    if (refetchResults) {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary(siteSeq) })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.pointHistories(siteSeq) })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.finishedCourses(siteSeq) })
    }
    refetchCourses = false
    refetchResults = false
  }

  const schedule = (results: boolean) => {
    refetchCourses = true
    refetchResults ||= results
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(flush, DASHBOARD_EVENT_BATCH_MS)
  }

  const handle = ({ event, data }: SseMessage) => {
    // 연결 · 재연결 — 놓친 알림은 서버가 다시 주지 않아(§5-1-D) 다시 받기로 메운다.
    // 첫 연결은 화면을 연 직후라 오늘 숫자 · 최근 기록 · 최근 종료는 방금 받았다.
    if (event === 'connected') {
      connectedCount += 1
      schedule(connectedCount > 1)
      return
    }

    const isCourseEvent = COURSE_EVENTS.has(event)
    if (!isCourseEvent && !RESULT_EVENTS.has(event)) return

    const payload = parseEvent(data)
    if (!payload || payload.link !== 'Patrol' || payload.siteSeq !== siteSeq) return

    schedule(!isCourseEvent)
  }

  /** 화면을 떠날 때 — 묶어 둔 다시 받기를 버린다 */
  const dispose = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  return { handle, dispose }
}
