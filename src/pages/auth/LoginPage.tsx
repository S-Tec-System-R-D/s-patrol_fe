import { LoginForm } from '@/features/auth/components/LoginForm'

/**
 * 현장 로그인 (`/login`).
 * 현장관리자와 Admin 3종이 모두 사용한다(`screens.md` §1-1) — 로그인 엔드포인트는 하나이고,
 * 응답 `code`가 본사/현장 중 어디로 보낼지 결정한다.
 */
const LoginPage = () => <LoginForm title="현장 로그인" />

export default LoginPage
