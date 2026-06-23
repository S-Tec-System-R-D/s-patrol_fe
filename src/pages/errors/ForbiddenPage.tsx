import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import AppEmpty from '@/components/app/AppEmpty'
import AppButton from '@/components/app/AppButton'
import { useMe } from '@/features/auth/hooks/useMe'
import { homePath } from '@/features/auth/lib/homePath'
import { paths } from '@/router/paths'

/**
 * 403 — 권한 없음 페이지.
 * - 005 spec §3 D1: 자동 리다이렉트 X. 명시 표시 + 본인 영역 홈 복귀 액션.
 * - 액션 버튼은 임시 `<button>` 스타일 — 006 AppButton 마이그 후 동시 교체.
 */
const ForbiddenPage = () => {
  const { data } = useMe()
  const navigate = useNavigate()
  const home = data ? homePath(data.role) : paths.serviceLogin

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-contents-background">
      <AppEmpty
        icon={ShieldOff}
        title="접근 권한이 없습니다"
        description="이 페이지를 볼 수 있는 권한이 없습니다. 본인 영역으로 돌아가 작업을 이어가세요."
        action={<AppButton onClick={() => navigate(home)}>홈으로 이동</AppButton>}
      />
    </div>
  )
}

export default ForbiddenPage
