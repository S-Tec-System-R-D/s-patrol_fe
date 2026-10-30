import { LoginLanding } from '@/features/landing/components/LoginLanding'

/**
 * 랜딩 (`/`, `spec 062`) = **현장 로그인**(`spec 063` — `/login` 을 없애고 합쳤다). 본사 로그인 링크는 두지 않는다(`flow.md` §0).
 */
const LandingPage = () => <LoginLanding area="service" description="사업장 순찰 업무를 한곳에서 관리하세요" />

export default LandingPage
