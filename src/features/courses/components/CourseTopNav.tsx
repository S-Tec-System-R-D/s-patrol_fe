import { useState } from 'react'
import { PlusIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppInput from '@/components/app/AppInput'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'

import AddCourseForm from '../form/AddCourseForm'

/**
 * 코스 목록 상단 — 검색 + 필터 슬롯 (`spec 023` Phase 2).
 *
 * 🔴 **생성 모달은 제어형이다**(`PointTopNav` 와 같은 모양, Phase 4). 제어가 아니면
 * `DialogTrigger` 가 여는 것과 사용자가 닫는 것밖에 못 해서 **"성공했을 때만 닫는다"** 를
 * 표현할 수 없다 — 실패했는데 닫히면 입력값이 사라진다.
 *
 * 🔴 **생성 후 상세로 보내지 않는다** — `AddCourse` 가 생성된 `courseSeq` 를 주지
 * 않아(`data: true` 만) 갈 수가 없다. 목록을 무효화해 다시 읽는다(`AddCourseForm` 주석).
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
  const [addOpen, setAddOpen] = useState(false)
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
      {/* 🔴 **필터 영역에 이름을 붙인다**(`spec 030`). 좁은 폭 카드가 `button` 이라
          접근성 이름에 행 내용이 전부 들어가고, 그중 "교대 허용" 같은 글자가 **필터 버튼과
          이름이 겹친다.** 스크린리더 사용자에게도 "여기부터 필터" 라는 경계가 생긴다 */}
      {filters && (
        <div role="group" aria-label="목록 필터" className="contents">
          {filters}
        </div>
      )}
      <div className="flex-1" />
      <AppDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="코스 생성"
        description="새 순찰코스를 생성합니다."
        trigger={
          /**
           * 🔴 **아이콘 + 라벨. `xl` 미만에서는 아이콘만**(지점 목록 승계).
           * `aria-label` 은 라벨이 숨는 폭에서도 **이름을 유지**하기 위해 남긴다.
           */
          <AppButton
            icon={PlusIcon}
            iconSize={14}
            aria-label="코스 생성"
            className="h-9 px-3 xl:px-4 border-transparent bg-point-bg text-point-foreground hover:bg-point/20"
          >
            <span className="hidden xl:inline">코스 생성</span>
          </AppButton>
        }
      >
        {/* 🔴 성공해야 닫는다 — 먼저 닫으면 실패 시 입력값이 사라진다 */}
        <AddCourseForm onSuccess={() => setAddOpen(false)} />
      </AppDialog>
    </div>
  )
}

export default CourseTopNav
