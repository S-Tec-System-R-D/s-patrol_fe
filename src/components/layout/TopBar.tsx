import type { ReactNode } from 'react'
import { Link, matchPath, useLocation } from 'react-router-dom'
import { ChevronRightIcon } from 'lucide-react'
import { pathPatterns, paths } from '@/router/paths'

interface Crumb {
  /** 주소 패턴 — `matchPath` 로 끝까지 맞춘다 */
  pattern: string
  /** 부모 조각 — 있으면 `부모 › 지금` 이고 부모는 `to` 로 가는 링크다 */
  parent?: { label: string; to: string }
  label: string
}

/**
 * 주소 → 지금 위치(`spec 083`). 상세 화면이 각자 그리던 `코스/지점 › 코스 상세` 를 여기로 모았다 — 문구와 링크는 그대로다.
 *
 * 🔴 본사 사업장 상세는 부모 조각이 없다 — 그 화면은 "이 사업장의 지사를 고른 목록"으로 돌아가는 링크를
 * 자기 안에 그리고 있어서(목록 조회 결과가 필요하다) 여기서 같은 글자를 한 번 더 쓰지 않는다. `spec 085` 에서 옮긴다.
 */
const CRUMBS: Crumb[] = [
  { pattern: paths.service.dashboard, label: '대시보드' },
  { pattern: paths.service.patrolZones, parent: { label: '순찰이력', to: paths.service.patrolZones }, label: '코스 순찰이력' },
  { pattern: paths.service.patrolPoints, parent: { label: '순찰이력', to: paths.service.patrolZones }, label: '지점 순찰이력' },
  { pattern: pathPatterns.patrolZoneDetail, parent: { label: '순찰이력', to: paths.service.patrolZones }, label: '순찰 상세' },
  { pattern: pathPatterns.patrolPointDetail, parent: { label: '순찰이력', to: paths.service.patrolPoints }, label: '지점 인증 상세' },
  { pattern: paths.service.zones, label: '코스/지점' },
  { pattern: paths.service.points, label: '코스/지점' },
  { pattern: pathPatterns.courseDetail, parent: { label: '코스/지점', to: paths.service.zones }, label: '코스 상세' },
  { pattern: pathPatterns.pointDetail, parent: { label: '코스/지점', to: paths.service.points }, label: '지점 상세' },
  { pattern: paths.service.users, label: '근무자' },
  { pattern: pathPatterns.userDetail, parent: { label: '근무자', to: paths.service.users }, label: '근무자 상세' },
  { pattern: paths.service.deployments, label: '배치관리' },
  { pattern: paths.service.notice, label: '공지사항' },
  { pattern: pathPatterns.noticeDetail, parent: { label: '공지사항', to: paths.service.notice }, label: '공지 상세' },
  { pattern: paths.admin.locations, label: '사업장' },
  { pattern: pathPatterns.adminLocationDetail, label: '사업장' },
  { pattern: paths.admin.admins, label: '관리자' },
]

interface TopBarProps {
  /** 오른쪽 끝에 바로 그릴 것 */
  right?: ReactNode
  /**
   * 오른쪽 자리의 DOM 요소를 틀에 넘긴다 — 화면이 `TopBarRight` 로 그 안에 그린다(`spec 084` — 대시보드의 실시간 표시).
   * 🔴 `useState` 의 setter 를 그대로 넘긴다(ref 콜백) — 요소가 붙은 뒤 틀이 다시 그려져 화면이 자리를 받는다.
   */
  slotRef?: (element: HTMLDivElement | null) => void
}

/**
 * 본문 카드 맨 위의 가는 띠 — 지금 위치를 적는다(`spec 083`). 현장 · 본사 공용.
 * 맞는 주소가 없으면(찾을 수 없는 주소 등) 글자 없이 띠만 그린다.
 */
export const TopBar = ({ right, slotRef }: TopBarProps) => {
  const { pathname } = useLocation()
  const crumb = CRUMBS.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname))

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-4 xl:px-5">
      {crumb && (
        <nav aria-label="현재 위치" className="flex min-w-0 items-center gap-1 text-body">
          {crumb.parent && (
            <>
              <Link to={crumb.parent.to} className="shrink-0 text-muted-foreground hover:text-foreground">
                {crumb.parent.label}
              </Link>
              <ChevronRightIcon size={13} className="shrink-0 text-muted-foreground/60" aria-hidden />
            </>
          )}
          <span aria-current="page" className="truncate font-medium text-foreground">
            {crumb.label}
          </span>
        </nav>
      )}
      <div ref={slotRef} className="ml-auto flex shrink-0 items-center gap-3">
        {right}
      </div>
    </div>
  )
}
