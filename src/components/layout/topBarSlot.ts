import { createContext } from 'react'

/**
 * 위 줄(`TopBar`) 오른쪽 자리의 DOM 요소 — 틀이 잡아 두고 화면이 `TopBarRight` 로 그 안에 그린다(`spec 084`).
 * 틀 없이 화면만 그릴 때(단위 테스트)는 `null` 이고, 그때 `TopBarRight` 는 제자리에 그린다.
 */
export const TopBarSlotContext = createContext<HTMLElement | null>(null)
