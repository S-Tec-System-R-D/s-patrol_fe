import { NavLink } from 'react-router-dom'
import { RouteIcon, MapPinIcon, type LucideIcon } from 'lucide-react'
import { paths } from '@/router/paths'
import { cn } from '@/lib/utils'

interface Tab {
  to: string
  icon: LucideIcon
  label: string
}

const tabs: Tab[] = [
  { to: paths.service.zones, icon: RouteIcon, label: '코스' },
  { to: paths.service.points, icon: MapPinIcon, label: '지점' },
]

/**
 * 코스/지점 관리 화면 상단의 코스/지점 탭.
 * 라우트 링크 방식 — `/zones`, `/points`을 각각 오가고,
 * 현재 pathname에 해당하는 탭이 밑줄로 강조된다.
 *
 * 🔴 **`end` 를 쓰지 않는다**(027). `end` 는 경로가 **정확히 일치**할 때만 활성인데,
 * 상세가 라우트로 분리되면서 `/points/49` 같은 하위 경로가 생겼다. `end` 를 두면
 * **상세 페이지에서 두 탭이 모두 꺼진 상태**가 된다. `/zones` 도 `spec 023` 에서 같은
 * 구조가 되므로 둘 다 미리 맞춰 둔다.
 */
const CourseTabs = () => {
  return (
    <nav className="flex items-center gap-1 border-b border-border">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              '-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-tab font-semibold text-muted-foreground transition-colors hover:text-foreground',
              isActive && 'border-point font-bold text-foreground'
            )
          }
        >
          <Icon size={14} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default CourseTabs
