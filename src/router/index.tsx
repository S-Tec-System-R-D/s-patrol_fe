import LandingPage from '@/pages/auth/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import { createBrowserRouter } from 'react-router-dom'
import AuthGuard from './guards/AuthGuard'

import ServiceLayout from '@/components/layout/ServiceLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import PointsPage from '@/pages/service/points/PointsPage'
import PointDetailPage from '@/pages/service/points/PointDetailPage'
import ZonesPage from '@/pages/service/zones/ZonesPage'
import ZoneDetailPage from '@/pages/service/zones/ZoneDetailPage'
import PatrolZonesPage from '@/pages/service/patrol/zones/PatrolZonesPage'
import PatrolPointDetailPage from '@/pages/service/patrol/points/PatrolPointDetailPage'
import PatrolZoneDetailPage from '@/pages/service/patrol/zones/PatrolZoneDetailPage'
import PatrolPointsPage from '@/pages/service/patrol/points/PatrolPointsPage'
import UsersPage from '@/pages/service/users/UsersPage'
import UserDetailPage from '@/pages/service/users/UserDetailPage'
import DeploymentsPage from '@/pages/service/deployments/DeploymentsPage'
import NoticeListPage from '@/pages/service/notice/NoticeListPage'
import NoticeDetailPage from '@/pages/service/notice/NoticeDetailPage'
import AdminsPage from '@/pages/admin/admins/AdminsPage'
import LocationDetailPage from '@/pages/admin/locations/LocationDetailPage'
import LocationsPage from '@/pages/admin/locations/LocationsPage'
import { ForbiddenPage, NotFoundPage } from '@/pages/errors'
import { RequireRoute } from '@/features/auth/components/RequireRoute'
import { paths, pathPatterns } from './paths'
import { PageErrorFallback } from './PageErrorFallback'

export const router = createBrowserRouter([
  //비인증 전용
  // 랜딩 = 로그인 겸 서비스 소개(`spec 062`). `/login` 과 같이 가드 없음 — 로그인 상태여도 그대로 보인다
  {
    path: paths.landing,
    element: <LandingPage />,
    errorElement: <PageErrorFallback />,
  },
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
          // 🔴 회차 상세는 `/patrol/zones/:historySeq` — 코스 관리 상세(`/zones/:courseSeq`)와
          //    키가 다르다(회차 vs 코스)
          {
            path: pathPatterns.patrolZoneDetail,
            element: <PatrolZoneDetailPage />,
            errorElement: <PageErrorFallback />,
          },
          // 🔴 지점 인증 상세는 `/patrol/points/:detailSeq` — 지점 관리 상세
          //    (`/points/:pointSeq`)와 키가 다르다(인증 1건 vs 지점)
          {
            path: pathPatterns.patrolPointDetail,
            element: <PatrolPointDetailPage />,
            errorElement: <PageErrorFallback />,
          },
          // 코스/지점 관리 — 두 페이지가 각자 CourseTabs를 렌더링 (별도 레이아웃 wrapper 없음, patrol과 동일 패턴)
          {
            path: paths.service.points,
            element: <PointsPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: pathPatterns.pointDetail,
            element: <PointDetailPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.zones,
            element: <ZonesPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: pathPatterns.courseDetail,
            element: <ZoneDetailPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.users,
            element: <UsersPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: pathPatterns.userDetail,
            element: <UserDetailPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.deployments,
            element: <DeploymentsPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: paths.service.notice,
            element: <NoticeListPage />,
            errorElement: <PageErrorFallback />,
          },
          {
            path: pathPatterns.noticeDetail,
            element: <NoticeDetailPage />,
            errorElement: <PageErrorFallback />,
          },
        ],
      },
      // 본사 사이트 (`/admin/*`) — 현장과 같은 레일 셸(`spec 043`)
      {
        element: <AdminLayout />,
        errorElement: <PageErrorFallback />,
        children: [
          // RequireRoute 적용 (005에서 Admin 3종만 허용). 사업장 목록 본문은 044
          {
            path: paths.admin.locations,
            element: (
              <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
                <LocationsPage />
              </RequireRoute>
            ),
            errorElement: <PageErrorFallback />,
          },
          // 사업장 상세(`spec 044` US3)
          {
            path: pathPatterns.adminLocationDetail,
            element: (
              <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
                <LocationDetailPage />
              </RequireRoute>
            ),
            errorElement: <PageErrorFallback />,
          },
          // 관리자 목록 · 상세 모달(`spec 045`)
          {
            path: paths.admin.admins,
            element: (
              <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
                <AdminsPage />
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
