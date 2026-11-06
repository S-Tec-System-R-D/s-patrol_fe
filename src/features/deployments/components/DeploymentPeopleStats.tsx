import { getSiteSeq } from '@/lib/auth/site'
import { useDeploymentHistory } from '../hooks/useDeploymentHistory'
import { ASSIGNMENT_STATUS } from '../types/deployment'

/**
 * 제목 줄 오른쪽의 **전출 · 전입 인원** — 탭과 겹치지 않는 값만 남긴 자리다(사용자 결정 2026-11-06).
 *
 * 🔴 **요약 API 의 `outCount` · `inCount` 를 쓰지 않는다** — 시작 전 배치(`배치예정`)까지 센다(실측, OQ-042-C).
 * 사용자 결정으로 **`배치중` 만** 세므로 이력 API 를 상태로 걸러 `totalCount` 만 읽는다(요청 +2).
 * 1인 1건이라 건수가 곧 인원이다. 이력 탭에서 `배치중` 으로 거른 행 수와 같은 값이다.
 * 🔴 **실패는 `-` 다, 0 이 아니다.** 이 값만 실패해도 아래 목록은 따로 뜬다(독립 쿼리).
 */

const Stat = ({
  label,
  query,
}: {
  label: string
  query: ReturnType<typeof useDeploymentHistory>
}) => (
  <div className="flex items-baseline gap-1.5">
    <dt className="text-caption text-muted-foreground">{label}</dt>
    <dd className="text-xl font-bold text-foreground tabular-nums">
      {query.isPending && (
        <span className="inline-block h-7 w-8 animate-pulse rounded-sm bg-muted align-middle" />
      )}
      {query.isError && !query.data && '-'}
      {query.data && (
        <>
          {query.data.totalCount}
          <span className="ml-0.5 text-caption font-medium text-muted-foreground">명</span>
        </>
      )}
    </dd>
  </div>
)

const DeploymentPeopleStats = () => {
  const siteSeq = getSiteSeq()
  const params =
    siteSeq === null
      ? null
      : { siteSeq, status: ASSIGNMENT_STATUS.ACTIVE, pageNumber: 1, pageSize: 1 }
  const out = useDeploymentHistory('out', params)
  const incoming = useDeploymentHistory('in', params)

  return (
    <dl className="flex shrink-0 items-baseline gap-4">
      <Stat label="전출 인원" query={out} />
      <span aria-hidden className="h-4 w-px self-center bg-border" />
      <Stat label="전입 인원" query={incoming} />
    </dl>
  )
}

export default DeploymentPeopleStats
