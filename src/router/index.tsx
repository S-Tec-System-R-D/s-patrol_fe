import LoginPage from '@/pages/auth/LoginPage'
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import { createBrowserRouter } from 'react-router-dom'
import AuthGuard from './guards/AuthGuard'

import ServiceLayout from '@/components/layout/ServiceLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import PointsPage from '@/pages/service/points/PointsPage'
import ZonesPage from '@/pages/service/zones/ZonesPage'
import PatrolZonesPage from '@/pages/service/patrol/zones/PatrolZonesPage'
import PatrolPointsPage from '@/pages/service/patrol/points/PatrolPointsPage'
import UsersPage from '@/pages/service/users/UsersPage'
import DeploymentsPage from '@/pages/service/deployments/DeploymentsPage'
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
      // 현장 사이트 (`/*`) — 리디자인(007) 셸: RailSidebar + 자연 스크롤
      {
        element: <ServiceLayout />,
        errorElement: <PageErrorFallback />,
        children: [
          // 순찰이력 — 지점/코스 두 페이지가 각자 PatrolHistoryTabs를 렌더링 (별도 레이아웃 wrapper 없음)
          {
            path: paths.service.patrolPoints,
            element: <PatrolPointsPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.patrolZones,
            element: <PatrolZonesPage />,
            errorElement: <PageErrorFallback />,
          },
          // 코스/지점 관리 — 두 페이지가 각자 CourseTabs를 렌더링 (별도 레이아웃 wrapper 없음, patrol과 동일 패턴)
          {
            path: paths.service.points,
            element: <PointsPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.zones,
            element: <ZonesPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.users,
            element: <UsersPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.deployments,
            element: <DeploymentsPage />,
            errorElement: <PageErrorFallback />,
          },
        ],
      },
      // 본사 사이트 (`/admin/*`) — 기존 셸(w-70 Sidebar + TopNav) 유지, 리디자인 미적용
      {
        element: <AdminLayout />,
        errorElement: <PageErrorFallback />,
        children: [
          // RequireRoute 적용 (005에서 Admin 3종만 허용. Phase 5에서 실 화면 교체)
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
    ],
  },

  // 404 catch-all (최하단)
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <PageErrorFallback />,
  },
])
