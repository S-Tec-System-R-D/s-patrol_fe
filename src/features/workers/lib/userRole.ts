import type { AppSelectOption } from '@/components/app/AppSelect'
import { ALL_VALUE } from '@/lib/listQuery'

/**
 * 권한 코드 (`spec 038` T597) — 실측 값 2종.
 *
 * 🔴 **라벨은 서버 `codeName` 을 쓴다.** 이 상수는 **필터 선택지**를 만들 때만 쓴다 — 권한 코드
 * 목록 API 가 미개발(`api-spec.md` §6-5)이라 고를 값을 받을 곳이 없다. 실측에 없는 코드를
 * 선택지에 두면 고르는 순간 0건이 온다(037 결과 필터와 같은 판단).
 */
export const USER_ROLE = {
  FIELD_MANAGER: 6,
  WORKER: 7,
} as const

export const roleFilterOptions: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: String(USER_ROLE.FIELD_MANAGER), label: '현장 관리자' },
  { value: String(USER_ROLE.WORKER), label: '현장 근무자' },
]

/** 근무 상태 선택지 — 서버 `workYn` */
export const workFilterOptions: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'true', label: '근무 중' },
  { value: 'false', label: '근무 종료' },
]

/** 권한 뱃지 — 관리자만 강조한다(근무자 화면이라 근무자가 기본값이다) */
export const roleBadgeVariant = (codeSeq: number): 'point' | 'muted' =>
  codeSeq === USER_ROLE.FIELD_MANAGER ? 'point' : 'muted'
