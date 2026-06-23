import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import AppEmpty from '@/components/app/AppEmpty'
import AppButton from '@/components/app/AppButton'
import { useMe } from '@/features/auth/hooks/useMe'
import { homePath } from '@/features/auth/lib/homePath'
import { paths } from '@/router/paths'

/**
 * 404 — 페이지 없음.
 * - 인증 영역 안/밖 모두 같은 컴포넌트로 처리.
 * - 본인 영역 홈으로 복귀. 비인증이면 `/login`.
 * - 액션 버튼은 임시 `<button>` 스타일 — 006 AppButton 마이그 후 동시 교체.
 */
const NotFoundPage = () => {
  const { data } = useMe()
  const navigate = useNavigate()
  const home = data ? homePath(data.role) : paths.serviceLogin

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-contents-background">
      <AppEmpty
        icon={Compass}
        title="페이지를 찾을 수 없습니다"
        description="주소가 잘못되었거나 페이지가 이동했을 수 있습니다."
        action={<AppButton onClick={() => navigate(home)}>홈으로 이동</AppButton>}
      />
    </div>
  )
}

export default NotFoundPage
