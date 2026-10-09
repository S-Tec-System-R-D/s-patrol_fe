import { useState } from 'react'
import { PlusIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppInput from '@/components/app/AppInput'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'

import AddPointForm from '../form/AddPointForm'

/**
 * 지점 목록 상단 — 검색 + 필터 슬롯 + 추가.
 *
 * 🔴 **추가 모달은 제어형이다**(022 Phase 4). 비제어면 `DialogTrigger` 가 열고 사용자가
 * 닫는 것밖에 못 해서 "성공했을 때만 닫는다" 를 표현할 수 없다 — 실패했는데 닫히면
 * 입력값이 사라진다(`spec 022` §4).
 *
 * 🔴 **검색은 300ms 디바운스**(027 T320). 없으면 **글자 수만큼 요청이 나가고** URL
 * 히스토리도 그만큼 쌓인다.
 *
 * 🔴 **입력값은 로컬 state 로 들고 URL 은 디바운스 뒤에 쓴다.** URL 을 바로 쓰면 글자마다
 * 리렌더+내비게이션이 걸려 입력이 끊긴다. 대신 **URL 이 밖에서 바뀌면**(뒤로가기 등)
 * 로컬 값을 맞춰 준다 — 안 하면 주소는 바뀌었는데 입력창만 옛 값으로 남는다.
 */
const SEARCH_DEBOUNCE_MS = 300

interface PointTopNavProps {
  /** URL 의 현재 검색어 */
  search?: string
  onSearchChange: (value: string | undefined) => void
  /** 필터 바 — 페이지가 넣는다 */
  filters?: React.ReactNode
}

const PointTopNav = ({ search, onSearchChange, filters }: PointTopNavProps) => {
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState(search ?? '')

  /**
   * URL 이 **밖에서** 바뀌면(뒤로가기·필터 초기화) 입력창을 맞춘다.
   *
   * 🔴 **effect 가 아니라 렌더 중에 조정한다.** effect 로 하면 "렌더 → 커밋 → setState →
   * 재렌더" 가 되어 한 박자 늦고, `react-hooks/set-state-in-effect` 가 막는다. 렌더 중
   * 조정은 React 가 커밋 전에 흡수한다(공식 "prop 이 바뀔 때 state 조정" 패턴).
   */
  const [lastSearch, setLastSearch] = useState(search)
  if (search !== lastSearch) {
    setLastSearch(search)
    setDraft(search ?? '')
  }

  const pushSearch = useDebouncedCallback(
    (value: string) => onSearchChange(value.trim() || undefined),
    SEARCH_DEBOUNCE_MS
  )

  return (
    <div className="flex items-center gap-2">
      <AppInput
        variant="search"
        placeholder="지점 이름 검색"
        className="w-[260px]"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          pushSearch(event.target.value)
        }}
      />
      {filters}
      <div className="flex-1" />
      <AppDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="지점 생성"
        description="신규지점을 생성할 수 있습니다."
        trigger={
          /**
           * 🔴 **아이콘 + 라벨. `xl` 미만에서는 아이콘만**(사용자 결정 2026-10-08).
           * `aria-label` 은 라벨이 숨겨지는 폭에서도 **접근 가능한 이름을 유지**하기 위해
           * 남겨 둔다 — 아이콘만 남으면 버튼에 이름이 없어진다.
           */
          <AppButton
            icon={PlusIcon}
            iconSize={14}
            aria-label="지점 생성"
            className="h-9 px-3 xl:px-4 border-transparent bg-point-bg text-point-foreground hover:bg-point/20"
          >
            <span className="hidden xl:inline">지점 생성</span>
          </AppButton>
        }
      >
        <AddPointForm onSuccess={() => setAddOpen(false)} />
      </AppDialog>
    </div>
  )
}

export default PointTopNav
