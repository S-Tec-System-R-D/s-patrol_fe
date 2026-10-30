import { LoginPanel } from '@/features/auth/components/LoginPanel'
import type { LoginArea } from '@/features/auth/lib/loginResult'
import { LandingSlider } from './LandingSlider'

interface LoginLandingProps {
  /** 로그인 화면 — 현장(`/`) · 본사(`/admin/login`). 다른 사이트 계정은 막는다(`spec 063`) */
  area: LoginArea
  /** 제목 아래 안내 — 현장(`/`) · 본사(`/admin/login`)가 다르다 */
  description: string
  /** 제목 옆 배지 — 본사만 `관리자`(사용자 결정 2026-10-30) */
  titleBadge?: string
}

/**
 * 로그인 겸 서비스 소개 틀(`spec 062` → `063` 에서 본사 로그인과 공용). 목업 `docs/ui-mock/login-landing-mock.webp`(배치 · 비율만).
 *
 * - xl 이상: 회색 배경 가운데 큰 카드를 좌우 반으로 — 왼쪽 로그인(`LoginPanel` · 실제 로그인 · 사업장 선택 단계 포함),
 *   오른쪽 소개 슬라이드(카드 안쪽 여백 `p-2` 를 두고 들어간 어두운 패널). 본사도 같은 슬라이드(사용자 결정 2026-10-30).
 * - xl 미만: 슬라이드를 숨기고 **xl 카드의 왼쪽 반 그대로**(폭 550 · 높이 640) — 폭마다 카드 모양이 같다
 *   (사용자 결정 2026-10-30). 화면이 좁으면 폭은 화면에 맞추고, 높이는 최소 640(가로 눕힌 휴대폰에서 잘리지 않게).
 * - 착지는 응답 `code` 가 정하되, 화면(`area`)과 계정 사이트가 다르면 막는다(`spec 063`).
 */
export const LoginLanding = ({ area, description, titleBadge }: LoginLandingProps) => (
  <div className="flex min-h-svh items-center justify-center bg-muted p-6">
    <div className="flex w-full max-w-[550px] min-h-[640px] rounded-2xl border border-border bg-card p-2 shadow-sm xl:grid xl:h-[640px] xl:max-w-[1100px] xl:grid-cols-2">
      <div className="flex flex-1 items-center justify-center px-6 sm:px-16">
        <div className="w-full max-w-sm space-y-6">
          <LoginPanel area={area} title="S-Patrol" titleBadge={titleBadge} description={description} />
        </div>
      </div>
      <div className="hidden xl:block">
        <LandingSlider />
      </div>
    </div>
  </div>
)
