import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { paths } from '@/router/paths'

import { resolveAuthMethodLabel } from '../../lib/authMethod'
import type { PointRow } from '../../types'

/**
 * 같은 사업장의 다른 지점 (`spec 027` Phase 3).
 *
 * `GetPointList(siteSeq)` 를 그대로 재사용한다 — 전용 API 가 필요 없다. 목록에서 쓰는
 * 훅을 그대로 쓰므로 **react-query 캐시를 공유**한다(목록에서 들어왔으면 재요청 없음).
 *
 * 🔴 **현재 보고 있는 지점은 링크를 걸지 않는다** — 자기 자신으로 가는 링크는 누르면
 * 아무 일도 안 일어나 고장으로 보인다. `현재` 뱃지로 위치만 알린다.
 */
const SiblingPoints = ({ points, currentSeq }: { points: PointRow[]; currentSeq: number }) => (
  <section className="rounded-lg border border-border bg-card p-6">
    <span className="text-muted-foreground text-xs">같은 사업장의 다른 지점</span>

    {points.length <= 1 ? (
      <p className="mt-4 text-caption text-muted-foreground">다른 지점이 없습니다.</p>
    ) : (
      <ul className="mt-4 flex flex-col">
        {points.map((point) => {
          const isCurrent = point.pointSeq === currentSeq
          const label = resolveAuthMethodLabel(point.authMethod, point.authMethodName)

          const body = (
            <>
              <span
                className={`min-w-0 flex-1 truncate ${isCurrent ? 'font-semibold' : ''} ${
                  point.useYn ? '' : 'text-muted-foreground'
                }`}
              >
                {point.pointName}
              </span>
              {isCurrent ? (
                <AppBadge variant="point">현재</AppBadge>
              ) : (
                label && <AppBadge variant="muted">{label}</AppBadge>
              )}
              <span className="shrink-0 text-caption text-muted-foreground">
                {point.usedCount === 0 ? '미배정' : `코스 ${point.usedCount}`}
              </span>
            </>
          )

          return (
            <li key={point.pointSeq} className="not-last:border-b border-border/50">
              {isCurrent ? (
                <div className="flex items-center gap-2 py-2.5 text-body">{body}</div>
              ) : (
                <Link
                  to={paths.service.pointDetail(point.pointSeq)}
                  className="flex items-center gap-2 py-2.5 text-body transition-colors hover:text-point"
                >
                  {body}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    )}
  </section>
)

export default SiblingPoints
