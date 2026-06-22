import LoginPage from '@/pages/auth/LoginPage'
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import { createBrowserRouter } from 'react-router-dom'
import AuthGuard from './guards/AuthGuard'

import PointsPage from '@/pages/service/points/PointsPage'
import ZonesPage from '@/pages/service/zones/ZonesPage'
import LocationLayout from '@/features/auth/components/location/LocationLayout'
import PatrolLayout from '@/features/patrol-zones/components/PatrolLayout'
import PatrolZonesPage from '@/pages/service/patrol/zones/PatrolZonesPage'
import PatrolPointsPage from '@/pages/service/patrol/points/PatrolPointsPage'
import AdminPlaceholderPage from '@/pages/admin/AdminPlaceholderPage'
import { ForbiddenPage, NotFoundPage } from '@/pages/errors'
import { RequireRoute } from '@/features/auth/components/RequireRoute'
import { paths } from './paths'
import { PageErrorFallback } from './PageErrorFallback'

export const router = createBrowserRouter([
  //비인증 전용
  {
    path: paths.serviceLogin,
    element: <LoginPage />,
    errorElement: <PageErrorFallback />,
  },
  {
    path: paths.adminLogin,
    element: <AdminLoginPage />,
    errorElement: <PageErrorFallback />,
  },

  // 에러 페이지 (직접 진입 가능 — 가드 미적용)
  {
    path: paths.forbidden,
    element: <ForbiddenPage />,
    errorElement: <PageErrorFallback />,
  },

  //일반 서비스 (가드 적용)
  {
    element: <AuthGuard />,
    errorElement: <PageErrorFallback />,
    children: [
      //순찰 관리
      {
        path: '/patrol',
        element: <PatrolLayout />,
        errorElement: <PageErrorFallback />,
        children: [
          //지점 관리
          {
            path: paths.service.patrolPoints,
            element: <PatrolPointsPage />,
            errorElement: <PageErrorFallback />,
          },
          //구역관리
          {
            path: paths.service.patrolZones,
            element: <PatrolZonesPage />,
            errorElement: <PageErrorFallback />,
          },
        ],
      },
      {
        element: <LocationLayout />,
        errorElement: <PageErrorFallback />,
        children: [
          //지점 관리
          {
            path: paths.service.points,
            element: <PointsPage />,
            errorElement: <PageErrorFallback />,
          },
          //구역관리
          {
            path: paths.service.zones,
            element: <ZonesPage />,
            errorElement: <PageErrorFallback />,
          },
        ],
      },
      // 본사 영역 — RequireRoute 적용 (005에서 Admin 3종만 허용. Phase 5에서 실 화면 교체)
      {
        path: paths.admin.locations,
        element: (
          <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
            <AdminPlaceholderPage />
          </RequireRoute>
        ),
        errorElement: <PageErrorFallback />,
      },
    ],
  },

  // 404 catch-all (최하단)
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <PageErrorFallback />,
  },
])
