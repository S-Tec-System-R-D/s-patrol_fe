import { LoginPanel } from '@/features/auth/components/LoginForm'
import { LandingSlider } from '@/features/landing/components/LandingSlider'

/**
 * 랜딩 (`/`, `spec 062`) — 로그인 겸 서비스 소개. 목업 `docs/ui-mock/login-landing-mock.webp`(배치 · 비율만 참고).
 *
 * - xl 이상: 회색 배경 가운데 큰 카드를 좌우 반으로 — 왼쪽 로그인(`LoginPanel` · 실제 로그인 · 사업장 선택 단계 포함),
 *   오른쪽 소개 슬라이드(카드 안쪽 여백 `p-2` 를 두고 들어간 어두운 패널).
 * - xl 미만: 슬라이드를 숨기고 **xl 카드의 왼쪽 반 그대로**(폭 550 · 높이 640) — 폭마다 카드 모양이 같다
 *   (사용자 결정 2026-10-30). 화면이 좁으면 폭은 화면에 맞추고, 높이는 최소 640(가로 눕힌 휴대폰에서 잘리지 않게).
 * - 로그인 처리 · 착지는 `/login` 과 같다(현장 `/zones` · 본사 `/admin/locations`). 본사 로그인 링크는 두지 않는다(`flow.md` §0).
 */
const LandingPage = () => (
  <div className="flex min-h-svh items-center justify-center bg-muted p-6">
    <div className="flex w-full max-w-[550px] min-h-[640px] rounded-2xl border border-border bg-card p-2 shadow-sm xl:grid xl:h-[640px] xl:max-w-[1100px] xl:grid-cols-2">
      <div className="flex flex-1 items-center justify-center px-6 sm:px-16">
        <div className="w-full max-w-sm space-y-6">
          <LoginPanel
            title="S-Patrol"
            titleClassName="font-bold"
            description="사업장 순찰 업무를 한곳에서 관리하세요"
          />
        </div>
      </div>
      <div className="hidden xl:block">
        <LandingSlider />
      </div>
    </div>
  </div>
)

export default LandingPage
