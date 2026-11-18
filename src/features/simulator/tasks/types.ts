import type { TaskContext } from '../engine/runStore'
import type { SimCourse, SimPoint, SimSite, SimSiteUser } from '../types'

/**
 * 작업 정의 (`spec 082`) — **작업 하나 = 파일 하나**.
 * 이름 · 묶음 · 입력 항목 · 실행 함수로 이뤄진다. 입력 창은 `fields` 를 보고 공용으로 그린다
 * (순찰 실행처럼 표가 필요한 작업만 전용 창을 쓴다).
 */

/** 작업이 실행될 때의 사업장 상태 — 입력 창을 열 때 읽은 값 */
export interface SiteData {
  site: SimSite
  /** 본사 계정이 보는 사업장 전체 — 배치 요청의 "받는 사업장" */
  sites: SimSite[]
  users: SimSiteUser[]
  points: SimPoint[]
  courses: SimCourse[]
  /** 앱 서버에 로그인된(상태를 읽은) 근무자의 아이디 — 로그인 불가 계정은 작업 대상에서 뺀다 */
  readyLoginIds: string[]
}

export type FieldValue = string | number | boolean | number[]
export type TaskValues = Record<string, FieldValue>

interface FieldBase {
  name: string
  label: string
  /** 입력 칸 아래 도움말 */
  hint?: string
}

export type TaskField =
  | (FieldBase & { type: 'text'; default: string })
  | (FieldBase & { type: 'number'; default: number; min?: number; max?: number })
  | (FieldBase & { type: 'select'; default: string; options: { value: string; label: string }[] })
  | (FieldBase & { type: 'checkbox'; default: boolean })
  /** 여러 개 고르기 — **고른 순서**가 값의 순서다(코스의 지점 순서) */
  | (FieldBase & {
      type: 'checks'
      default: number[]
      options: { value: number; label: string; note?: string }[]
    })

export type TaskGroup = '구축' | '순찰' | '배치' | '근무' | '정리'

export interface SimTask {
  id: string
  group: TaskGroup
  name: string
  fields(data: SiteData): TaskField[]
  /** 실행 전에 막을 이유가 있으면 문구를 돌려준다 */
  validate?(values: TaskValues, data: SiteData): string | null
  /** 실행 목록에 보일 한 줄 — `3명 · 600104~` */
  summary(values: TaskValues, data: SiteData): string
  run(ctx: TaskContext, values: TaskValues, data: SiteData): Promise<void>
}

/** 값 꺼내기 — 입력 창이 `fields` 의 타입대로 채우므로 여기서는 좁히기만 한다 */
export const text = (values: TaskValues, name: string): string => String(values[name] ?? '').trim()
export const number = (values: TaskValues, name: string): number => Number(values[name])
export const flag = (values: TaskValues, name: string): boolean => values[name] === true
export const list = (values: TaskValues, name: string): number[] => {
  const value = values[name]
  return Array.isArray(value) ? value : []
}
