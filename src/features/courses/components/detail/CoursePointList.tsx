import { MapPinIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppEmpty from '@/components/app/AppEmpty'
import { toAuthMethodLabel } from '@/features/points/lib/authMethod'
import { paths } from '@/router/paths'

import type { CourseDetailPoint } from '../../types'

/**
 * 지점 순서 카드 — **읽기 전용**(`spec 023` Phase 3, T358).
 *
 * 🔴 **편집 수단을 두지 않는다.** 추가·제거·드래그 정렬·구간시간 변경은 Phase 4 다.
 * 동작하지 않는 버튼을 미리 두면 027 이 걷어낸 "죽은 컨트롤" 과 같은 것이 된다.
 *
 * 🔴 **지점별 사용여부는 표시만 한다 — 바꿀 수단이 서버에 없다**(B-29).
 * `GetCourseDetail` 은 `points[].useYn` 을 주는데 `UpdateCoursePointDto` 에는 그 필드가
 * **없다.** 토글을 만들면 저장해도 값이 안 바뀐다. Phase 4 에서도 **표시만** 한다.
 *
 * 🔴 **구간 메모를 보여주지 않는다** — 서버가 돌려주지 않는다(B-30, 실측). 보낼 수는
 * 있지만 읽을 수 없는 **쓰기 전용** 필드다.
 *
 * ⚠️ **지점명 → 지점 상세 링크를 걸지 않았다.** `pointSeq` 가 있어 기술적으로는 가능하지만
 * 이 카드는 **순서**를 읽는 자리고, 행마다 링크가 생기면 Phase 4 의 드래그 핸들·제거
 * 버튼과 클릭 영역을 다툰다. 지점으로 가는 길은 지점 상세의 **"소속 코스"** 가 이미
 * 양방향으로 열어 둔다(T372).
 */

interface CoursePointListProps {
  points: CourseDetailPoint[]
}

const CoursePointList = ({ points }: CoursePointListProps) => {
  const sorted = [...points].sort((a, b) => a.orderNo - b.orderNo)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-panel-title font-semibold">지점 순서</span>
        <span className="text-caption text-muted-foreground">
          {/* 🔴 0개도 그대로 적는다 — 경고로 바꾸지 않는다(규칙 12) */}
          총 {points.length}개
        </span>
      </div>

      {sorted.length === 0 ? (
        /* 🔴 **빈 상태다. "준비 중" 이 아니다** — 기능은 있고 데이터가 없다(027 규약) */
        <AppEmpty
          icon={PlusIcon}
          title="편성된 지점이 없습니다"
          description="코스에 지점을 추가하면 순서대로 표시됩니다."
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {sorted.map((point) => {
            const method = toAuthMethodLabel(point.authMethod)
            return (
              <li
                key={point.coursePointSeq}
                // 미사용 지점은 행 전체를 톤다운한다 — 셀 글자만 흐리면 눈에 안 띈다(027)
                className={`flex items-center gap-3 rounded-md border border-border px-3 py-2 ${
                  point.useYn ? 'bg-card' : 'bg-muted/40'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-label font-bold ${
                    point.useYn
                      ? 'bg-point-bg text-point-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {point.orderNo}
                </span>

                <MapPinIcon
                  size={14}
                  strokeWidth={1.75}
                  className="shrink-0 text-muted-foreground"
                />
                <span
                  className={`flex-1 truncate text-body font-semibold ${
                    point.useYn ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {point.pointName}
                </span>

                {method && (
                  <AppBadge variant={!point.useYn ? 'muted' : method === 'QR' ? 'point' : 'success'}>
                    {method}
                  </AppBadge>
                )}

                <span className="w-16 shrink-0 text-right tabular-nums text-caption text-muted-foreground">
                  {point.courseMin}분
                </span>

                {/* 🔴 사용여부는 뱃지로 글자를 준다 — 색·명도만으로 전달하지 않는다 */}
                {!point.useYn && <AppBadge variant="muted">미사용</AppBadge>}
              </li>
            )
          })}
        </ol>
      )}

      <p className="text-caption text-muted-foreground">
        지점 편성(추가·순서 변경·구간시간)은 준비 중입니다. 지점 자체는{' '}
        <Link to={paths.service.points} className="underline hover:text-foreground">
          순찰지점
        </Link>{' '}
        에서 관리합니다.
      </p>
    </div>
  )
}

export default CoursePointList
