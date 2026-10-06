import { LoginForm } from '@/features/auth/components/LoginForm'

/**
 * 본사 로그인 (`/admin/login`). 메뉴로 연결되지 않고 URL 직접 접근(`screens.md` §1-1).
 *
 * 현장 로그인과 **같은 폼·같은 엔드포인트**를 쓴다. 로그인 API는 `Login/W/Login` 하나뿐이고
 * 본사/현장은 응답 `code`로만 갈린다(`api-spec.md` §2-1).
 *
 * (당초 본사 로그인 실구현은 Phase 5 본사 영역 spec으로 미뤄 두었으나, 020의 JWT 전환으로
 *  임시 진입 버튼이 동작할 수 없게 되고 폼 재사용 비용이 거의 없어 `spec 020`이 흡수했다.)
 */
const AdminLoginPage = () => <LoginForm title="본사 로그인" />

export default AdminLoginPage
