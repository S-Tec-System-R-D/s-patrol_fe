import type { GroupNode } from '@/features/auth/types/site'
import { useQueryParams } from '@/hooks/useQueryParams'
import { findGroup } from '../lib/groupTree'

/**
 * 선택한 관리그룹 = URL `?group={groupSeq}` (`spec 043` T751).
 *
 * 🔴 **없거나 숫자가 아니거나 트리에 없는 값은 루트로 본다**(목업 "유효하지 않으면 scope 로"). URL 은 고치지 않는다 —
 * 다음 선택 때 덮인다. 그룹을 지워서 선택이 사라진 경우도 여기서 루트로 떨어진다.
 * 트리가 아직 없으면 `selected` 는 `null`.
 */
export const useGroupParam = (root: GroupNode | undefined) => {
  const [params, setParams] = useQueryParams<'group'>()
  const raw = Number(params.group)
  const found = root && Number.isInteger(raw) ? findGroup(root, raw) : null
  const selected = found ?? root ?? null

  const selectGroup = (groupSeq: number) => setParams({ group: String(groupSeq) })
  /** 그룹 삭제 후 정리용 — 지운 값이 URL 에 남지 않게(`spec 043` T756) */
  const clearGroup = () => setParams({ group: undefined })

  return { selected, selectGroup, clearGroup }
}
