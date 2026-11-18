import { useLayoutEffect } from 'react'
import { SimBlockedNotice } from '@/features/simulator/components/SimBlockedNotice'
import { SimulatorConsole } from '@/features/simulator/components/SimulatorConsole'
import { getSimBlockers, getSimConfig } from '@/features/simulator/config'
import '@/features/simulator/simulator.css'

/**
 * 개발 전용 시뮬레이터 (`spec 082` · `/dev/simulator`).
 * 근무자의 앱 동작을 API로 대신 실행한다. 🔴 개발 서버에서만 라우트에 등록된다(`router/index.tsx`).
 */
export default function SimulatorPage() {
  // 테마 범위 — 팝업이 body 에 그려지므로 <html> 에 붙인다. 떠날 때 붙인 것만 뗀다.
  // 첫 화면이 밝게 번쩍이지 않도록 그리기 전에(layout effect) 붙인다
  useLayoutEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains('dark')
    root.classList.add('sim-root', 'dark')
    return () => {
      root.classList.remove('sim-root')
      if (!hadDark) root.classList.remove('dark')
    }
  }, [])

  const config = getSimConfig()
  const blockers = getSimBlockers(config, window.location.hostname)

  if (blockers.length > 0) return <SimBlockedNotice blockers={blockers} />
  return <SimulatorConsole adminId={config.adminId} />
}
