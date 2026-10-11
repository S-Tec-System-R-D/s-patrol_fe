import { useState } from 'react'

import AppInput from '@/components/app/AppInput'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'

/**
 * 코스 목록 상단 — 검색 + 필터 슬롯 (`spec 023` Phase 2).
 *
 * 🔴 **생성 버튼이 아직 없다.** 생성 모달은 Phase 4 몫이고, 동작하지 않는 버튼을 먼저
 * 두지 않는다 — 027 이 걷어낸 "죽은 컨트롤" 과 같은 것이 된다(행 수 셀렉트가 그렇게
 * 한 번 들어왔고 캡쳐에서 잡혔다). Phase 4 에서 `PointTopNav` 와 같은 모양으로 붙인다.
 *
 * 🔴 **검색은 300ms 디바운스**(027 승계). 없으면 **글자 수만큼 요청이 나가고** URL
 * 히스토리도 그만큼 쌓인다.
 *
 * 🔴 **입력값은 로컬 state 로 들고 URL 은 디바운스 뒤에 쓴다.** URL 을 바로 쓰면 글자마다
 * 리렌더+내비게이션이 걸려 입력이 끊긴다. 대신 **URL 이 밖에서 바뀌면**(뒤로가기·필터
 * 초기화) 로컬 값을 맞춰 준다.
 */
const SEARCH_DEBOUNCE_MS = 300

interface CourseTopNavProps {
  /** URL 의 현재 검색어 */
  search?: string
  onSearchChange: (value: string | undefined) => void
  /** 필터 바 — 페이지가 넣는다 */
  filters?: React.ReactNode
}

const CourseTopNav = ({ search, onSearchChange, filters }: CourseTopNavProps) => {
  const [draft, setDraft] = useState(search ?? '')

  /**
   * URL 이 **밖에서** 바뀌면 입력창을 맞춘다.
   *
   * 🔴 **effect 가 아니라 렌더 중에 조정한다.** effect 로 하면 한 박자 늦고
   * `react-hooks/set-state-in-effect` 가 막는다(027 에서 lint 가 옳았다).
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
        placeholder="코스 이름 검색"
        className="w-[260px]"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          pushSearch(event.target.value)
        }}
      />
      {filters}
      <div className="flex-1" />
    </div>
  )
}

export default CourseTopNav
