import AppEmpty from '@/components/app/AppEmpty'
import { Building2 } from 'lucide-react'

/**
 * 본사 사이트 placeholder.
 * - 005에서 `<RequireRoute>` 동작 검증용 라우트로 1건 등록.
 * - 실 화면은 Phase 5 본사 영역 spec에서 구현.
 */
const AdminPlaceholderPage = () => (
  <div className="flex flex-1 items-center justify-center">
    <AppEmpty
      icon={Building2}
      title="본사 관리 사이트 준비 중"
      description="Phase 5에서 사업장/관리자 관리 화면이 구현됩니다."
    />
  </div>
)

export default AdminPlaceholderPage
