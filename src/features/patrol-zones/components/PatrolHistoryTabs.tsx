import { NavLink } from 'react-router-dom'
import { ListIcon, MapPinIcon, type LucideIcon } from 'lucide-react'
import { paths } from '@/router/paths'
import { cn } from '@/lib/utils'

interface Tab {
  to: string
  icon: LucideIcon
  label: string
}

const tabs: Tab[] = [
  { to: paths.service.patrolZones, icon: ListIcon, label: '코스 순찰이력' },
  { to: paths.service.patrolPoints, icon: MapPinIcon, label: '지점 순찰이력' },
]

/**
 * 순찰이력 화면 상단의 코스/지점 탭.
 * 라우트 링크 방식 — `/patrol/zones`, `/patrol/points`을 각각 오가고,
 * 현재 pathname에 해당하는 탭이 밑줄로 강조된다.
 */
const PatrolHistoryTabs = () => {
  return (
    <nav className="flex items-center gap-1 border-b border-border">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end
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

export default PatrolHistoryTabs
