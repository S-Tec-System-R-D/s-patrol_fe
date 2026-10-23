import { SquarePenIcon } from 'lucide-react'
import { useState } from 'react'

import AppIconButton from '@/components/app/AppIconButton'
import { useMe } from '@/features/auth/hooks/useMe'
import { GroupEditDialog } from './GroupEditDialog'

/**
 * 트리 머리의 편집 버튼 + 관리그룹 편집 모달 (`spec 043` T757, 목업 `GroupEditTrigger`).
 *
 * 버튼은 현장 화면의 수정 버튼과 같은 `AppIconButton` + `SquarePenIcon`(코스 상세 `CourseInfo` — 사용자 지시 2026-10-22).
 * 🔴 **시스템관리자 · Master 에게만** 그린다(목업: 매니저는 편집 불가). 허용 목록으로 건다 — 미실측 role 이 새로
 * 매핑돼도 기본이 "숨김" 이다. 서버 권한은 현장관리자 403 만 실측했다(OQ-043-A).
 */
export const GroupEditTrigger = () => {
  const { data: me } = useMe()
  const [open, setOpen] = useState(false)

  if (me?.role !== 'SYSTEM' && me?.role !== 'MASTER') return null

  return (
    <>
      <AppIconButton
        icon={SquarePenIcon}
        aria-label="관리그룹 편집"
        title="편집"
        onClick={() => setOpen(true)}
      />
      <GroupEditDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
