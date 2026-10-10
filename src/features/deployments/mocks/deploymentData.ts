import type { DeploymentHistoryItem, DeploymentRequestSummary } from '../types/deployment'

// 배치 요청/이력 데모 데이터 — docs/ui-mock/현장/배치관리/배치관리-신규.png 참고.
// 🔴 로그인 사업장명을 "강동 테크노타워"(siteSeq 7)로 맞춘다 — **2026-10-10 교정**.
//
// 나간/온 판정이 `useMe().locationName` 과 **문자열 비교**라 로그인 사업장명과 이 데이터가
// 어긋나면 KPI·이력 탭이 전부 0건이 된다. 원래는 `/api/auth/me` mock 의 "강동 테크노타워"에
// 맞춰 뒀는데, 그 사이 ① `spec 020` 이 `/api/auth/me` 를 제거하고 ② `spec 021` 이
// `locationName` 을 **선택한 사업장**에서 가져오게 바꿨다. dev·캡쳐 기본 seed 는
// `siteSeq 7 · 강동 테크노타워`(`mocks/handlers/auth.ts` `DEV_SITES`)이므로 그쪽에 맞춘다.
//
// ⚠️ **드러나는 데 오래 걸렸다** — 021·022 가 `npm run capture` 를 미뤄 `spec 027` 의
// baseline 재촬영에서야 "배치관리가 빈 화면" 으로 잡혔다(0명/0명/이력 0건).
//
// 🔴 **근본 원인은 문자열 비교다.** `locationName` 이 아니라 `siteSeq` 로 비교해야 사업장명이
// 바뀌어도 안 깨진다. 그 수정은 배치관리 spec 몫이라 여기서는 데이터만 맞춘다(A3).
export const initialPendingRequests: DeploymentRequestSummary[] = [
  {
    id: 'dep-req-1',
    direction: 'DEPLOY',
    workerName: '최범수',
    fromLocationName: '해운대 마린시티',
    toLocationName: '강동 테크노타워',
    reason: '야간 인력 부족 지원',
    status: 'PENDING',
    requestedAt: '2026-05-30',
  },
  {
    id: 'dep-req-2',
    direction: 'DEPLOY',
    workerName: '배수진',
    fromLocationName: '송도 비즈니스타워',
    toLocationName: '강동 테크노타워',
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
    fromLocationName: '강동 테크노타워',
    toLocationName: '강서 스퀘어타워',
    reason: '인력 지원',
    startedAt: '2026-03-01',
  },
  {
    id: 'dep-hist-2',
    workerName: '최수아',
    fromLocationName: '송파 그린타워',
    toLocationName: '강동 테크노타워',
    reason: '인력 지원',
    startedAt: '2026-02-01',
  },
  {
    id: 'dep-hist-3',
    workerName: '한지민',
    fromLocationName: '노원 파크뷰',
    toLocationName: '강동 테크노타워',
    reason: '단기 지원',
    startedAt: '2026-04-15',
  },
]
