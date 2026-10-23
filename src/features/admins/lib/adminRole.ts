import type { AppSelectOption } from '@/components/app/AppSelect'
import { ALL_VALUE } from '@/lib/listQuery'
import type { Role } from '@/types/enum'

/**
 * 본사 관리자 권한 (`spec 045` T816) — `codeSeq` 실측 값(`api-spec.md` §4).
 *
 * 🔴 **라벨은 `codeName` 이 아니라 `codeSeq` 로 정한다** — Master 의 `codeName` 은 `관리자` 라 목업 · 명세 용어
 * "마스터" 와 다르고, 관리자 화면에서 "관리자" 뱃지는 아무것도 구분하지 못한다.
 */
export const ADMIN_CODE = {
  SYSTEM: 2,
  MASTER: 3,
  MANAGER: 4,
} as const

const LABEL: Record<number, string> = {
  [ADMIN_CODE.SYSTEM]: '시스템관리자',
  [ADMIN_CODE.MASTER]: '마스터',
  [ADMIN_CODE.MANAGER]: '매니저',
}

/** 모르는 코드는 서버 `codeName` 그대로 */
export const adminRoleLabel = (codeSeq: number, codeName: string): string => LABEL[codeSeq] ?? codeName

/** 뱃지 — 시스템관리자 · 마스터를 강조하고 매니저는 기본(근무자 화면 `roleBadgeVariant` 와 같은 판단) */
export const adminRoleVariant = (codeSeq: number): 'point' | 'muted' =>
  codeSeq === ADMIN_CODE.MANAGER ? 'muted' : 'point'

/** 권한 필터 — 목업 세그먼트 "전체 / 마스터 / 매니저". 값은 URL `?role=`(`adminList` `filterAdminRows`) */
export const adminRoleFilterOptions: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'master', label: '마스터' },
  { value: 'manager', label: '매니저' },
]

/**
 * 로그인 권한이 만들 수 있는 권한 — 목업 `CREATABLE_ROLE`(사용자 결정 2026-10-23: 고정, 고르지 않는다).
 * 시스템관리자 → 마스터 · 마스터 → 매니저 · 매니저 → 없음([관리자 추가] 를 그리지 않는다). 🔴 서버는 검사하지 않는다(B-60).
 */
export const creatableAdminCode = (role: Role | undefined): number | null =>
  role === 'SYSTEM' ? ADMIN_CODE.MASTER : role === 'MASTER' ? ADMIN_CODE.MANAGER : null

/** 시스템 구축 시 만든 계정 — 수정 · 삭제할 수 없다(목업 잠금 안내) */
export const isSystemAdmin = (codeSeq: number): boolean => codeSeq === ADMIN_CODE.SYSTEM
