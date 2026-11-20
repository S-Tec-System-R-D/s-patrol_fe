import {
  ArrowLeftRightIcon,
  Building2Icon,
  ClockAlertIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  MegaphoneIcon,
  ShieldUserIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { paths } from '@/router/paths'

// 서비스 메뉴, 타입
export interface MenuItemType {
  icon: LucideIcon
  title: string
  url: string
  activeUrl?: string[]
  /** 대기 요청 수 등 동적 뱃지 (현장 레일 전용). 미지정 시 뱃지 숨김 */
  /**
   * 뱃지 **종류**. 값은 `RailSidebar` 가 훅으로 읽는다(`spec 039` T637).
   *
   * 🔴 **함수가 아니라 키다** — 전에는 `() => store.getState()...` 였는데, 숫자가 서버 쿼리로 옮겨가면서
   * config(모듈 상수)에서는 **훅을 부를 수 없다**. 무엇을 셀지만 적고, 세는 일은 컴포넌트가 한다.
   */
  badge?: 'deploymentPending'
  /**
   * 사이드바 묶음 제목(`spec 083`) — 같은 값이 이어지는 메뉴끼리 한 묶음이고, 묶음이 바뀌는 자리에 제목을 그린다.
   * 없으면 제목 없이 그린다(본사). 아래 메뉴(`FloatingNav`)는 쓰지 않는다.
   */
  group?: string
}

/**
 * 현장 사이드바(RailSidebar) 메뉴 — 6개. 묶음 제목 `현황`(대시보드 · 순찰이력) · `관리`(나머지)는 `spec 083`.
 * 순서 고정: 순찰이력 → 코스/지점 → 근무자 → 배치관리 → 공지사항 (리디자인 결정 2026-07-23).
 * 맨 앞에 대시보드(현장 홈, `spec 066` 2026-10-30).
 */
export const ServiceMenus: MenuItemType[] = [
  {
    icon: LayoutDashboardIcon,
    title: '대시보드',
    group: '현황',
    url: paths.service.dashboard,
  },
  {
    icon: ClockAlertIcon,
    title: '순찰이력',
    group: '현황',
    url: paths.service.patrolZones,
    activeUrl: [paths.service.patrolZones, paths.service.patrolPoints],
  },
  {
    icon: MapPinIcon,
    title: '코스/지점',
    group: '관리',
    url: paths.service.zones,
    activeUrl: [paths.service.zones, paths.service.points],
  },
  {
    icon: UsersIcon,
    title: '근무자',
    group: '관리',
    url: paths.service.users,
  },
  {
    icon: ArrowLeftRightIcon,
    title: '배치관리',
    group: '관리',
    url: paths.service.deployments,
    badge: 'deploymentPending',
  },
  {
    icon: MegaphoneIcon,
    title: '공지사항',
    group: '관리',
    url: paths.service.notice,
  },
]

/**
 * 본사 레일 메뉴 (`/admin/*`) — flat 2개, 현장 `ServiceMenus` 와 같은 모양(`spec 043` T742).
 * 순서·아이콘은 목업 v2(`docs/ui-mock/본사관리자/S-Patrol-Admin v2 (standalone).html`) 그대로.
 */
export const AdminMenus: MenuItemType[] = [
  {
    icon: Building2Icon,
    title: '사업장',
    url: paths.admin.locations,
  },
  {
    icon: ShieldUserIcon,
    title: '관리자',
    url: paths.admin.admins,
  },
]
