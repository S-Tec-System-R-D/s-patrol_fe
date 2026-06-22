import { AppLayout } from '@/components/layout'
import { Navigate } from 'react-router-dom'

// 일반 서비스 페이지 로그인 가드
const AuthGuard = () => {
  // 나중에 상태를 가져올 예정
  const isAuthentication = true

  if (!isAuthentication) return <Navigate to={'/login'} replace />

  return <AppLayout />
}

export default AuthGuard
