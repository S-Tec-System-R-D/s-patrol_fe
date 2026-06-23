import {
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
}

export interface MenuGroupType {
  title: string
  groups: MenuItemType[]
}

export const ServiceMenus: MenuGroupType[] = [
  {
    title: '관리',
    groups: [
      {
        icon: ClockAlertIcon,
        title: '순찰이력',
        url: paths.service.patrolZones,
        activeUrl: [paths.service.patrolZones, paths.service.patrolPoints],
      },
      {
        icon: MapPinIcon,
        title: '구역/지점',
        url: paths.service.zones,
        activeUrl: [paths.service.zones, paths.service.points],
      },
    ],
  },
  {
    title: '알림',
    groups: [
      {
        icon: MegaphoneIcon,
        title: '공지사항',
        url: paths.service.notice,
      },
    ],
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
