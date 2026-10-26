import { MapPinIcon, PlusIcon, SquarePenIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppLinkButton from '@/components/app/AppLinkButton'
import AppEmpty from '@/components/app/AppEmpty'
import { toAuthMethodLabel } from '@/features/points/lib/authMethod'
import { paths } from '@/router/paths'

import type { CourseDetailPoint } from '../../types'

/**
 * 지점 순서 카드 — **읽기 전용**(`spec 023` Phase 3, T358).
 *
 * 🔴 **이 카드 자체는 읽기 전용이다.** 추가·제거·드래그 정렬·구간시간 변경은 **편집
 * 모드**(`CoursePointEditor`)가 맡고, 여기 있는 것은 그 모드로 들어가는 버튼 하나뿐이다
 * (`onEdit` 을 받을 때만 그린다). 🔴 **드래그를 상시로 열어 두지 않는 이유**는
 * `UpdateCourse` 가 **전량 전송**이라(B-25) 드래그마다 코스 전체를 교체하게 되기
 * 때문이다 — 자세한 근거는 `CoursePointEditor` 상단 주석.
 *
 * 🔴 **지점별 사용여부를 여기서 바꾸지 않는다 — 근거가 바뀌었다**(`spec 028`, 실측
 * 2026-10-13). 이전 주석은 "서버에 수단이 없어서" 라고 적었지만, 사실은 **"코스 안에서
 * 이 지점만 미사용" 이라는 개념 자체가 없다**(사용자 확인). 사용여부는 지점 상세에서만
 * 바꾼다 → **B-29 철회.**
 *
 * ⚠️ **아래 `useYn` 분기는 현재 발동하지 않는다** — `GetCourseDetail.points[].useYn` 이
 * **항상 `true`** 이고 지점의 실제 값을 따라오지 않는다(실측: 지점을 꺼도 코스 3개에서
 * 모두 `true`). 🔴 **그래도 지우지 않는다**(OQ-028-B) — 백엔드가 응답 값을 지점 실제
 * 값으로 채우면 **그대로 살아나는 코드**이고, 그때 미사용 지점이 편성된 채 남아 있는
 * 코스를 바로 알릴 수 있다.
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
  /**
   * 편집 모드 진입.
   *
   * 🔴 **버튼이 이 카드로 돌아왔다**(사용자 결정 2026-10-12). A단에서 페이지 헤더로
   * 올렸다가 되돌린 것인데, **헤더에서 빼면서 돌아왔다**는 점이 중요하다 — 두 곳에 두면
   * "어느 쪽이 정식인지" 를 묻게 되지만, **카드마다 자기 편집 수단 하나**면 그 질문이
   * 생기지 않는다(기본정보는 `수정`, 지점 순서는 `편성 편집`). 헤더에는 코스 전체에
   * 대한 `삭제` 만 남는다.
   */
  onEdit?: () => void
}

const CoursePointList = ({ points, onEdit }: CoursePointListProps) => {
  const sorted = [...points].sort((a, b) => a.orderNo - b.orderNo)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        {/* 🔴 **건수는 제목 옆이다**(사용자 결정 2026-10-12). 우측에 두면 아이콘 버튼과
            한 덩어리로 보여 "총 3개" 가 버튼의 라벨처럼 읽혔다 — 건수는 제목을 **수식하는
            말**이므로 제목 옆이 맞다. 상세의 세 카드(지점 순서·순찰 기록·이상 이력)가
            **같은 모양**을 쓴다 */}
        <span className="flex items-baseline gap-2">
          <span className="text-panel-title font-semibold">지점 순서</span>
          <span className="text-caption text-muted-foreground">
            {/* 🔴 0개도 그대로 적는다 — 경고로 바꾸지 않는다(규칙 12) */}
            총 {points.length}개
          </span>
        </span>

        <div className="flex items-center gap-3">
          {onEdit && (
            /* 🔄 **링크형 + 글자**(`048`, 사용자 결정 2026-10-26 — 카드 안 버튼 = `AppLinkButton`).
               10-12 에는 테두리 글자 버튼이 제목·건수와 무게를 다퉈 아이콘만 뒀는데, 링크형은
               테두리가 없어 그 문제가 없고 아이콘만 두면 버튼으로 안 읽힌다.
               기본정보 카드와 **같은 `SquarePen`** — 두 버튼의 뜻이 "이 카드를 편집한다" 로 같다.
               `aria-label` 은 보이는 글자를 포함해 둔다(같은 화면의 다른 [수정] 과 구분) */
            <AppLinkButton icon={SquarePenIcon} aria-label="지점 편성 편집" onClick={onEdit}>
              편성 편집
            </AppLinkButton>
          )}
        </div>
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
                  className={`truncate text-body font-semibold ${
                    point.useYn ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {point.pointName}
                </span>

                {/* 🔴 사용여부는 뱃지로 글자를 준다 — 색·명도만으로 전달하지 않는다.
                    🔴 **이름 바로 옆이다**(사용자 결정 2026-10-13) — 행 끝에 두면 인증수단·
                    구간시간을 지나야 보여서 "무엇이 미사용인지" 가 늦게 읽힌다 */}
                {!point.useYn && <AppBadge variant="muted">미사용</AppBadge>}

                <span className="flex-1" />

                {method && (
                  <AppBadge variant={!point.useYn ? 'muted' : method === 'QR' ? 'point' : 'success'}>
                    {method}
                  </AppBadge>
                )}

                <span className="w-16 shrink-0 text-right tabular-nums text-caption text-muted-foreground">
                  {point.courseMin}분
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {/* 🔴 "준비 중" 이 아니다 — 편성은 이제 **편성 편집**에서 한다. 남겨 둘 안내는
          **지점 자체의 관리 위치**뿐이다(코스에서 제거해도 지점은 지워지지 않는다) */}
      <p className="text-caption text-muted-foreground">
        순서·구간시간은 <strong className="font-medium">편성 편집</strong>에서 바꿉니다. 지점
        자체는{' '}
        <Link to={paths.service.points} className="underline hover:text-foreground">
          순찰지점
        </Link>{' '}
        에서 관리합니다.
      </p>
    </div>
  )
}

export default CoursePointList
