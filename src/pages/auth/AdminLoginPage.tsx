import { LoginLanding } from '@/features/landing/components/LoginLanding'

/**
 * 본사 로그인 (`/admin/login`). 메뉴로 연결되지 않고 URL 직접 접근(`screens.md` §1-1).
 *
 * 현장 로그인(`/`)과 **같은 틀·같은 폼·같은 엔드포인트**를 쓴다(`spec 063` — 랜딩과 같은 분할 디자인).
 * 로그인 API는 `Login/W/Login` 하나뿐이고 본사/현장은 응답 `code`로만 갈린다(`api-spec.md` §2-1).
 * 🔴 현장관리자(`2xx`)는 여기서 막고 현장 로그인 링크를 준다(`spec 063`).
 * 차이는 제목 옆 `관리자` 배지 · 안내 문구다(문구 ⚠️ 임시 — OQ-062-B 와 함께 확정).
 */
const AdminLoginPage = () => (
  <LoginLanding area="admin" titleBadge="관리자" description="본사 관리자 전용 로그인입니다" />
)

export default AdminLoginPage
