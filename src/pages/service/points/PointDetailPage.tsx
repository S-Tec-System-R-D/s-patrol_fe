import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { EllipsisIcon, MapPinIcon, Trash2Icon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import AppPageHeader from '@/components/app/AppPageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deletePoint } from '@/features/points/api/deletePoint'
import PointActivityCard from '@/features/points/components/detail/PointActivityCard'
import PointDetail from '@/features/points/components/detail/PointDetail'
import { usePointHistory } from '@/features/points/hooks/usePointHistory'
import {
  formatSinceLabel,
  summarizePatrolHistory,
  summaryFromDate,
  summaryToDate,
} from '@/features/points/lib/patrolSummary'
import { getSiteSeq } from '@/lib/auth/site'
import EditPointForm from '@/features/points/form/EditPointForm'
import { usePointDetail } from '@/features/points/hooks/usePointDetail'
import { pointKeys } from '@/features/points/queryKeys'
import { paths } from '@/router/paths'

/**
 * 순찰지점 상세 — **라우트로 분리된 페이지** (`spec 027`).
 *
 * 027 전까지 상세는 `/points` 안의 우측 패널이었고 선택 상태가 `useState` 였다 →
 * **새로고침하면 날아가고** 딥링크·뒤로가기가 없었다. 이제 `pointSeq` 가 URL 에 있다.
 *
 * 🔴 **브레드크럼 + 제목을 둘 다 둔다**(사용자 결정 2026-10-08). 질문이 둘이기 때문이다:
 * - **브레드크럼**(`코스/지점 › 지점 상세`) = "여기가 **어느 화면**인가"
 * - **제목**(지도 아이콘 + 지점명 + 사용 뱃지) = "**어느 지점**인가"
 *
 * 하나만 두면 반쪽이다 — 브레드크럼만이면 어느 지점인지 카드를 읽어야 하고, 제목만이면
 * `정문 입구` 가 **지점인지 코스인지** 알 수 없다(둘 다 이름만으로는 구분되지 않는다).
 * 브레드크럼의 첫 조각이 목록 링크라 **`← 목록으로` 를 흡수**하므로 요소는 늘지 않는다.
 *
 * 🔴 **액션(수정·삭제)은 헤더 우측**이다. `patterns.md` §11(액션 풋터)은 **우측 패널**을
 * 전제한 패턴이고, 전체 폭 페이지에서는 본문이 길면 **스크롤 아래로 밀려 보이지 않는다**.
 *
 * 🔴 **없는 `pointSeq` 를 `/404` 로 보내지 않는다**(spec §4). 서버는 400 + 래퍼
 * (`"잘못된 요청입니다."`)를 주는데, 이는 "경로가 없다" 가 아니라 **삭제됐거나 다른
 * 사업장의 지점**이라는 뜻이다. 목록으로 돌아갈 수단과 함께 안내한다.
 */

const PointDetailPage = () => {
  const { pointSeq: pointSeqParam } = useParams<{ pointSeq: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // URL 세그먼트는 문자열이다. 숫자가 아니면 조회하지 않는다(`/points/abc`).
  const parsed = Number(pointSeqParam)
  const pointSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = usePointDetail(pointSeq)
  const point = detail.data

  const siteSeq = getSiteSeq()
  // 🔴 기준일을 렌더마다 새로 만들지 않는다 — `new Date()` 가 매번 바뀌면 queryKey 가
  // 바뀌어 **무한 재조회**가 된다. 날짜 문자열로 고정해 하루 단위로만 바뀌게 한다.
  const today = useMemo(() => new Date(), [])
  const fromDt = summaryFromDate(today)
  const toDt = summaryToDate(today)

  const history = usePointHistory(siteSeq, pointSeq, fromDt, toDt)
  const historyRows = useMemo(() => history.data?.items ?? [], [history.data])
  const summary = useMemo(
    () => summarizePatrolHistory(historyRows, today),
    [historyRows, today]
  )


  const removal = useMutation({
    mutationFn: deletePoint,
    onSuccess: async () => {
      // 🔴 이동을 **무효화보다 먼저** 한다. 목록이 먼저 갱신되면 사라진 지점의 상세를
      // 다시 조회해 "찾을 수 없음" 이 한 번 깜빡인다.
      // 🔴 실패 시에는 호출되지 않으므로 **상세에 머문다** — 거부인데 화면이 바뀌면
      // 사용자는 삭제된 것으로 오해한다(spec 규칙 13).
      navigate(paths.service.points, { replace: true })
      await queryClient.invalidateQueries({ queryKey: pointKeys.lists })
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">

      {point ? (
        <>
          <AppPageHeader
            title={point.name}
            // 상태는 제목 옆, 액션은 헤더 맨 우측 — 성격이 달라 자리를 섞지 않는다
            titleSuffix={
              point.useYn ? (
                <AppBadge variant="success">사용</AppBadge>
              ) : (
                <AppBadge variant="muted">미사용</AppBadge>
              )
            }
            action={
              /* 🔄 **`spec 076`**: 머리에는 `⋯`(삭제)만 — 코스 상세(074)와 같다. 삭제는 파괴적이라
                 메뉴 안에 숨긴다. `수정` 은 속성 패널의 기본정보 제목 줄.
                 modal={false} — 메뉴 항목에서 확인 창을 열 때 body pointer-events 가 남는 Radix 문제 회피 */
              <div className="flex items-center gap-2">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <AppIconButton icon={EllipsisIcon} iconSize={16} aria-label="지점 메뉴" variant="soft" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-auto">
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      disabled={removal.isPending}
                      onSelect={() => setDeleteOpen(true)}
                    >
                      <Trash2Icon />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* 삭제 확인 모달은 확인 즉시 닫는다: 잃을 입력이 없고 거부 사유는 전역 토스트가 전달한다 */}
                <AppAlertDialog
                  open={deleteOpen}
                  onOpenChange={setDeleteOpen}
                  size="sm"
                  icon={Trash2Icon}
                  variant="destructive"
                  title="지점을 삭제하시겠습니까?"
                  actionLabel="삭제"
                  onAction={() => removal.mutate(point.pointSeq)}
                />
              </div>
            }
          />

          {/* 🔄 **`spec 084`(사용자 결정 2026-11-20 — 목업 `07-지점-상세` 배치로)**: 왼쪽 **인증 기록**(넓게) / 오른쪽 **속성 단**
              340px(위치 · 기본정보) — 코스 상세와 같은 틀이다. `spec 076` 의 "속성 왼쪽" 을 뒤집었다. `xl` 미만 1단은 DOM 순서(기록 먼저) */}
          <div className="grid grid-cols-1 gap-y-7 pt-2 xl:grid-cols-[minmax(0,1fr)_340px] xl:[&>section:first-child]:pr-8 xl:[&>section:nth-child(2)]:border-l xl:[&>section:nth-child(2)]:border-border xl:[&>section:nth-child(2)]:pl-7">
            <PointActivityCard
              summary={summary}
              sinceLabel={formatSinceLabel(point.lastPatrolDt, today)}
              rows={historyRows}
              today={today}
              isPending={history.isPending && pointSeq !== null}
            />

            <PointDetail point={point} onEdit={() => setEditOpen(true)} />

            {/* 🔴 모달은 페이지가 들고 있다 — 카드는 **열어 달라고 요청만** 한다
                (코스 상세 `CourseInfo` 와 같은 조립). 성공해야 닫는다 — 먼저 닫으면
                실패 시 입력값이 사라진다 */}
            <AppDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              title="지점 편집"
              description="지점 정보를 수정합니다."
              contentClassName="sm:max-w-[520px]"
            >
              <EditPointForm point={point} onSuccess={() => setEditOpen(false)} />
            </AppDialog>
          </div>
        </>
      ) : detail.isPending && pointSeq !== null ? (
        <AppPageHeader title="지점 정보를 불러오는 중" subtitle="잠시만 기다려주세요" />
      ) : (
        <AppEmpty
          icon={MapPinIcon}
          title="지점을 찾을 수 없습니다"
          description={
            pointSeq === null
              ? '주소가 올바르지 않습니다. 목록에서 다시 선택해주세요.'
              : (detail.error?.message ?? '삭제되었거나 접근할 수 없는 지점입니다.')
          }
        />
      )}
    </div>
  )
}

export default PointDetailPage
