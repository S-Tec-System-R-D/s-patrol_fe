import {
  ArrowLeftRightIcon,
  ClockAlertIcon,
  MapPinIcon,
  MegaphoneIcon,
  type LucideIcon,
} from 'lucide-react'

/**
 * 랜딩 소개 슬라이드(`spec 062`). 아이콘은 레일 메뉴(`sidebar.config.ts`)와 같은 것 — 로그인 뒤 같은 아이콘을 만난다.
 * ⚠️ **문구는 임시다**(OQ-062-B). 확정 문구 · 화면 캡쳐가 오면 여기만 바꾼다(캡쳐는 필드를 더한다).
 */
export interface LandingSlide {
  icon: LucideIcon
  title: string
  description: string
}

export const LANDING_SLIDES: LandingSlide[] = [
  {
    icon: ClockAlertIcon,
    title: '순찰이력',
    description: '코스와 지점별 순찰 결과를 한눈에 확인합니다.',
  },
  {
    icon: MapPinIcon,
    title: '코스 · 지점 관리',
    description: '사업장에 맞는 순찰 코스와 지점을 직접 구성합니다.',
  },
  {
    icon: ArrowLeftRightIcon,
    title: '배치관리',
    description: '근무자 배치 요청을 확인하고 바로 승인합니다.',
  },
  {
    icon: MegaphoneIcon,
    title: '공지사항',
    description: '현장 근무자에게 공지를 전달합니다.',
  },
]
