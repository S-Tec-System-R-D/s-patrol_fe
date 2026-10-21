import {
  ArrowLeftRightIcon,
  Building2Icon,
  ClockAlertIcon,
  MapPinIcon,
  MegaphoneIcon,
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
}

export interface MenuGroupType {
  title: string
  groups: MenuItemType[]
}

/**
 * 현장 사이드바(RailSidebar) 메뉴 — flat 5개, 그룹 헤더 없음.
 * 순서 고정: 순찰이력 → 코스/지점 → 근무자 → 배치관리 → 공지사항 (리디자인 결정 2026-07-23).
 */
export const ServiceMenus: MenuItemType[] = [
  {
    icon: ClockAlertIcon,
    title: '순찰이력',
    url: paths.service.patrolZones,
    activeUrl: [paths.service.patrolZones, paths.service.patrolPoints],
  },
  {
    icon: MapPinIcon,
    title: '코스/지점',
    url: paths.service.zones,
    activeUrl: [paths.service.zones, paths.service.points],
  },
  {
    icon: UsersIcon,
    title: '근무자',
    url: paths.service.users,
  },
  {
    icon: ArrowLeftRightIcon,
    title: '배치관리',
    url: paths.service.deployments,
    badge: 'deploymentPending',
  },
  {
    icon: MegaphoneIcon,
    title: '공지사항',
    url: paths.service.notice,
  },
]

/**
 * 본사 사이트 메뉴 (`/admin/*`).
 * 라우트 인벤토리 출처: docs/screens.md §4
 * - `/admin/locations` — 사업장 관리
 * - `/admin/admins` — 관리자 관리
 */
export const AdminMenus: MenuGroupType[] = [
  {
    title: '본사 관리',
    groups: [
      {
        icon: Building2Icon,
        title: '사업장 관리',
        url: paths.admin.locations,
        activeUrl: [paths.admin.locations],
      },
      {
        icon: UsersIcon,
        title: '관리자 관리',
        url: paths.admin.admins,
        activeUrl: [paths.admin.admins],
      },
    ],
  },
]
