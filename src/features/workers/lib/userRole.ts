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
  { value: String(USER_ROLE.FIELD_MANAGER), label: '관리자' },
  { value: String(USER_ROLE.WORKER), label: '근무자' },
]

/**
 * 화면에 적는 권한 이름 — 서버 `codeName`(`현장 관리자` · `현장 근무자`)에서 **`현장` 을 뗀다**(사용자 결정 2026-11-20).
 * 현장 사이트 안에서는 모두 현장 소속이라 접두어가 뜻을 더하지 않고 칸만 차지한다. 서버 값과 설계 문서의 이름은 그대로다 —
 * 표시할 때만 줄인다. 모르는 이름은 그대로 돌려준다.
 */
export const roleDisplayName = (codeName: string | null | undefined): string =>
  (codeName ?? '').replace(/^현장\s*/, '')

/** 근무 상태 선택지 — 서버 `workYn` */
export const workFilterOptions: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'true', label: '근무 중' },
  { value: 'false', label: '근무 종료' },
]

/** 권한 뱃지 — 관리자만 강조한다(근무자 화면이라 근무자가 기본값이다) */
export const roleBadgeVariant = (codeSeq: number): 'chip' | 'plain' =>
  codeSeq === USER_ROLE.FIELD_MANAGER ? 'chip' : 'plain'
