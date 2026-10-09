import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isValid, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { ChevronRightIcon, HistoryIcon, MapPinIcon, QrCodeIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import { deletePoint } from '@/features/points/api/deletePoint'
import PointDetail, { PointAuthCard } from '@/features/points/components/detail/PointDetail'
import { PendingSection } from '@/features/points/components/detail/PendingBlock'
import PointPatrolLog from '@/features/points/components/detail/PointPatrolLog'
import PointStats from '@/features/points/components/detail/PointStats'
import SiblingPoints from '@/features/points/components/detail/SiblingPoints'
import { usePointHistory } from '@/features/points/hooks/usePointHistory'
import { usePointList } from '@/features/points/hooks/usePointList'
import {
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

/**
 * 통계 칸의 "최근 순찰" 문구. 기록이 없으면 `null` 을 돌려 호출부가 `—` 로 그린다.
 * 🔴 상세 본문(`PointDetail`)과 같은 포맷을 쓰되 **이름은 뺀다** — 통계 칸이 좁다.
 */
const lastPatrolLabel = (point: { lastPatrolDt: string | null }): string | null => {
  if (!point.lastPatrolDt) return null
  const parsed = parseISO(point.lastPatrolDt)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : null
}

/** `코스/지점 › 지점 상세` — 첫 조각이 목록 링크를 겸한다 */
const Breadcrumb = () => (
  <nav aria-label="현재 위치" className="flex items-center gap-1 text-caption">
    <Link to={paths.service.points} className="text-muted-foreground hover:text-foreground">
      코스/지점
    </Link>
    <ChevronRightIcon size={13} className="text-muted-foreground/60" />
    <span className="font-medium text-foreground">지점 상세</span>
  </nav>
)

const PointDetailPage = () => {
  const { pointSeq: pointSeqParam } = useParams<{ pointSeq: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

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

  // 같은 사업장의 다른 지점 — 목록 훅을 그대로 재사용해 캐시를 공유한다
  const siblings = usePointList(siteSeq, {})

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
    <div className="flex flex-col gap-4 p-8">
      <Breadcrumb />

      {point ? (
        <>
          <AppPageHeader
            title={point.name}
            icon={MapPinIcon}
            // 상태는 제목 옆, 액션은 헤더 맨 우측 — 성격이 달라 자리를 섞지 않는다
            titleSuffix={
              point.useYn ? (
                <AppBadge variant="success">사용</AppBadge>
              ) : (
                <AppBadge variant="muted">미사용</AppBadge>
              )
            }
            action={
              <div className="flex items-center gap-2">
                <AppDialog
                  open={editOpen}
                  onOpenChange={setEditOpen}
                  title="지점 수정"
                  description="지점 정보를 수정할 수 있습니다."
                  trigger={
                    <AppButton icon={SquarePenIcon} variant="sub" className="bg-card">
                      수정
                    </AppButton>
                  }
                >
                  {/* 🔴 성공해야 닫는다 — 먼저 닫으면 실패 시 입력값이 사라진다(§4) */}
                  <EditPointForm point={point} onSuccess={() => setEditOpen(false)} />
                </AppDialog>

                {/* 삭제 확인 모달은 확인 즉시 닫는다: 잃을 입력이 없고 거부 사유는
                    전역 토스트가 전달한다. 닫기 제어는 계약만 늘린다(A6) */}
                <AppAlertDialog
                  size="sm"
                  icon={Trash2Icon}
                  variant="destructive"
                  title="지점을 삭제하시겠습니까?"
                  onAction={() => removal.mutate(point.pointSeq)}
                >
                  <AppButton
                    icon={Trash2Icon}
                    variant="destructive"
                    className="bg-card"
                    disabled={removal.isPending}
                  >
                    삭제
                  </AppButton>
                </AppAlertDialog>
              </div>
            }
          />

          <PointStats
            patrolCount={summary.total}
            lastPatrol={lastPatrolLabel(point)}
            courseCount={point.courseList.length}
          />

          {/* 좌 2/3 (정보·코스·기록) / 우 1/3 (인증수단·변경이력·형제지점) — xl 미만 1단 */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="flex flex-col gap-4 xl:col-span-2">
              <PointDetail point={point} />
              <PointPatrolLog
                summary={summary}
                rows={historyRows}
                isPending={history.isPending && pointSeq !== null}
              />
            </div>

            <div className="flex flex-col gap-4">
              <PointAuthCard point={point} />

              {/* 🔴 지우지 않고 자리를 비워 둔다(OQ-027-E) */}
              <PendingSection
                title="QR 코드"
                icon={QrCodeIcon}
                reason="QR 이미지·식별자·발행 정보(발행일·버전)와 다운로드·인쇄는 아직 없습니다. 서버에 발행 메타가 없고(B-23) QR 생성은 별도 작업입니다(OQ-022-D)."
              />
              <PendingSection
                title="변경 이력"
                icon={HistoryIcon}
                reason="누가 무엇을 언제 바꿨는지 보여주려면 변경 이력 API가 필요합니다. 서버에 아직 없습니다(B-22)."
              />

              <SiblingPoints
                points={siblings.data?.items ?? []}
                currentSeq={point.pointSeq}
              />
            </div>
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
