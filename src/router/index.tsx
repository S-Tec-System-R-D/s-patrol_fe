import LoginPage from '@/pages/auth/LoginPage'
import { createBrowserRouter } from 'react-router-dom'
import AuthGuard from './guards/AuthGuard'

import PointsPage from '@/pages/service/points/PointsPage'
import ZonesPage from '@/pages/service/zones/ZonesPage'
import LocationLayout from '@/features/auth/components/location/LocationLayout'
import PatrolLayout from '@/features/patrol-zones/components/PatrolLayout'
import PatrolZonesPage from '@/pages/service/patrol/zones/PatrolZonesPage'
import PatrolPointsPage from '@/pages/service/patrol/points/PatrolPointsPage'
import { paths } from './paths'
import { PageErrorFallback } from './PageErrorFallback'

export const router = createBrowserRouter([
  //비인증 전용
  {
    path: paths.serviceLogin,
    element: <LoginPage />,
    errorElement: <PageErrorFallback />,
  },

  //슈퍼관리자

  //일반 서비스
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
    ],
  },
])
