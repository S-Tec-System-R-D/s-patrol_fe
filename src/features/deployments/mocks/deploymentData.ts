import type { DeploymentHistoryItem, DeploymentRequestSummary } from '../types/deployment'

// 배치 요청/이력 데모 데이터 — docs/ui-mock/현장/배치관리/배치관리-신규.png 참고.
// 로그인 사업장명은 MSW `/api/auth/me` mock(src/mocks/handlers/auth.ts)의 "강동 그랜드타워"로 통일
// (목업 텍스트는 "강동 테크노타워"이나, 나간/온 판정이 `useMe().locationName`과 문자열 비교로 이뤄지므로
// 실제 로그인 사업장명과 mock 데이터를 일치시켜야 KPI·이력 탭 필터링이 정상 동작한다).
export const initialPendingRequests: DeploymentRequestSummary[] = [
  {
    id: 'dep-req-1',
    direction: 'DEPLOY',
    workerName: '최범수',
    fromLocationName: '해운대 마린시티',
    toLocationName: '강동 그랜드타워',
    reason: '야간 인력 부족 지원',
    status: 'PENDING',
    requestedAt: '2026-05-30',
  },
  {
    id: 'dep-req-2',
    direction: 'DEPLOY',
    workerName: '배수진',
    fromLocationName: '송도 비즈니스타워',
    toLocationName: '강동 그랜드타워',
    reason: '휴가 대체',
    status: 'PENDING',
    requestedAt: '2026-05-28',
  },
]

// 나간 1건(오준혁, 목업 그대로) + 온 2건(목업 미노출 — KPI "배치 온 인원 2명" 정합용 자체 구성, spec.md §참고).
export const initialHistoryItems: DeploymentHistoryItem[] = [
  {
    id: 'dep-hist-1',
    workerName: '오준혁',
    fromLocationName: '강동 그랜드타워',
    toLocationName: '강서 스퀘어타워',
    reason: '인력 지원',
    startedAt: '2026-03-01',
  },
  {
    id: 'dep-hist-2',
    workerName: '최수아',
    fromLocationName: '송파 그린타워',
    toLocationName: '강동 그랜드타워',
    reason: '인력 지원',
    startedAt: '2026-02-01',
  },
  {
    id: 'dep-hist-3',
    workerName: '한지민',
    fromLocationName: '노원 파크뷰',
    toLocationName: '강동 그랜드타워',
    reason: '단기 지원',
    startedAt: '2026-04-15',
  },
]
