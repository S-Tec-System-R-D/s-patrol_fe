import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { TopBarSlotContext } from './topBarSlot'

/**
 * 화면이 위 줄(`TopBar`) 오른쪽 자리에 그릴 것을 넘기는 통로(`spec 084` — 대시보드의 실시간 표시 · 새로고침).
 * 위 줄은 틀이 그리고 화면은 그 아래(`Outlet`)에 있어서, 화면의 상태를 쓰는 요소를 위 줄에 두려면 이렇게 건너보낸다.
 *
 * 🔴 틀이 없으면(화면만 그리는 단위 테스트) **제자리에 그린다** — 요소가 사라지지 않는다.
 */
export const TopBarRight = ({ children }: { children: ReactNode }) => {
  const slot = useContext(TopBarSlotContext)
  return slot ? createPortal(children, slot) : <>{children}</>
}
