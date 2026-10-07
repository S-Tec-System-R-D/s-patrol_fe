import { useState } from 'react'
import { PlusIcon } from 'lucide-react'

import AppDialog from '@/components/app/AppDialog'
import AppIconButton from '@/components/app/AppIconButton'
import AppInput from '@/components/app/AppInput'

import AddPointForm from '../form/AddPointForm'

/**
 * 지점 목록 상단 — 검색 + 추가.
 *
 * 🔴 **추가 모달을 제어형으로 바꿨다**(022 Phase 4). 비제어면 `DialogTrigger` 가 열고
 * 사용자가 닫는 것밖에 못 해서, "성공했을 때만 닫는다" 를 표현할 수 없다. 실패했는데
 * 닫히면 입력값이 사라진다(`spec 022` §4).
 *
 * ⚠️ 검색 input 은 아직 비와이어드다 — Phase 6(T271)에서 `searchKey` 로 연결한다.
 */
const PointTopNav = () => {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="flex gap-2">
      <AppInput variant="search" placeholder="지점 이름 검색" />
      <AppDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="지점 생성"
        description="신규지점을 생성할 수 있습니다."
        trigger={
          <AppIconButton
            icon={PlusIcon}
            iconSize={14}
            aria-label="지점 생성"
            className="h-9 w-9 shrink-0 border-transparent bg-point-bg text-point-foreground hover:bg-point-bg/80"
          />
        }
      >
        <AddPointForm onSuccess={() => setAddOpen(false)} />
      </AppDialog>
    </div>
  )
}

export default PointTopNav
