import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ChevronRightIcon, EllipsisIcon, RouteIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

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
import { deleteCourse } from '@/features/courses/api/deleteCourse'
import CourseInfo from '@/features/courses/components/detail/CourseInfo'
import CoursePointEditor from '@/features/courses/components/detail/CoursePointEditor'
import CourseKpiRow from '@/features/courses/components/detail/CourseKpiRow'
import CoursePatrolLog from '@/features/courses/components/detail/CoursePatrolLog'
import CourseRouteCard from '@/features/courses/components/detail/CourseRouteCard'
import CourseRunDialog from '@/features/courses/components/detail/CourseRunDialog'
import { CourseHourlyCard, CourseWorkerCard } from '@/features/courses/components/detail/CourseRunStatCards'
import EditCourseForm from '@/features/courses/form/EditCourseForm'
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail'
import { useCourseHistory } from '@/features/course-history/hooks/useCourseHistory'
import { usableCoords } from '@/features/courses/lib/courseCoords'
import { courseHistoryStats } from '@/features/course-history/lib/courseHistoryStats'
import { recentRange } from '@/features/course-history/lib/historyRange'
import { courseKeys } from '@/features/courses/queryKeys'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

/**
 * 순찰코스 상세 — **라우트로 분리된 페이지** (`spec 023`).
 *
 * **Phase 4 에서 변경계가 들어왔다**: 기본정보 수정 모달 · 삭제 · 토글 2종 확인 모달 ·
 * 지점 편성 편집 모드. 조회 섹션(다이어그램 · 지점 순서 · 기본정보)은 Phase 3 그대로다.
 *
 * 🔄 **`spec 074` 개편**(시안 `개선 · 코스 상세`, 사용자 결정 2026-11-12) — 머리 `수정` + `⋯`(삭제) · 순찰 경로 카드
 * 하나(지도 + 지점 목록) · 기본정보 글자만 · 오른쪽 시간대별 · 근무자별 · 기록 10건 + 회차 상세 모달.
 * 이상 이력 카드 · 미인증 조회 · 토글 확인 모달은 걷었다.
 *
 * 🔴 **액션(수정·삭제)은 헤더 우측**이다(027 `PointDetailPage` 와 같은 조립).
 * `patterns.md` §11(액션 풋터)은 **우측 패널**을 전제한 패턴이고, 전체 폭 페이지에서는
 * 본문이 길면 스크롤 아래로 밀려 보이지 않는다.
 *
 * 🔴🔴 **토글·수정·편성이 모두 같은 엔드포인트(`UpdateCourse`)를 쓴다.** `points` 는
 * **전체 교체**라(B-25) 바디를 손으로 만들면 한 자리만 빠뜨려도 **코스의 지점이 전부
 * 사라지고 200 이 온다.** 그래서 바디는 전부 `toUpdateCourseBody()` 를 거친다 —
 * 기본값이 "현재 편성 전량" 이다.
 *
 * 🔴 **`siteSeq` 는 상세 응답에 없다**(OQ-9) → `getSiteSeq()`(spec 021 저장값)로 보충한다.
 * 즉 **상세만 보고 수정 요청을 만들 수 없다.**
 *
 * 🔴 **상태 뱃지를 `useYn` 으로만 만든다.** 목록(`CourseRow`)에는 `courseStatusCode`·
 * `courseStatusName` 이 있지만 **상세 응답에는 없다**(실측). 목록에서도 상태 컬럼을
 * 뺐으므로(사용자 결정 2026-10-12) 이제 양쪽이 같은 말을 한다.
 *
 * 🔴 **브레드크럼 + 제목을 둘 다 둔다**(027 승계 — 질문이 둘이다): 브레드크럼은 "어느
 * 화면인가", 제목은 "어느 코스인가". 코스를 **찾은** 화면에서는 브레드크럼의 첫 조각이
 * 목록 링크를 겸해 `← 목록으로` 를 흡수한다 — 🔴 **못 찾은 화면은 예외다**(아래
 * `AppEmpty` 의 `action`): 할 수 있는 일이 하나도 없는 상태에서는 브레드크럼이
 * 빠져나갈 길로 읽히지 않는다(브라우저 확인 2026-10-12).
 *
 * 🔴 **없는 `courseSeq` 를 `/404` 로 보내지 않는다**(spec §4). 서버는 400 + 래퍼
 * (`"잘못된 요청입니다."`)를 주는데, 이는 "경로가 없다" 가 아니라 **삭제됐거나 다른
 * 사업장의 코스**라는 뜻이다. 목록으로 돌아갈 수단과 함께 안내한다.
 */

/** `코스/지점 › 코스 상세` — 첫 조각이 목록 링크를 겸한다 */
const Breadcrumb = () => (
  <nav aria-label="현재 위치" className="flex items-center gap-1 text-caption">
    <Link to={paths.service.zones} className="text-muted-foreground hover:text-foreground">
      코스/지점
    </Link>
    <ChevronRightIcon size={13} className="text-muted-foreground/60" />
    <span className="font-medium text-foreground">코스 상세</span>
  </nav>
)

const ZoneDetailPage = () => {
  const { courseSeq: courseSeqParam } = useParams<{ courseSeq: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const siteSeq = getSiteSeq()

  const [editOpen, setEditOpen] = useState(false)
  const [editingPoints, setEditingPoints] = useState(false)
  /** 편성 편집 모달 — 초안이 바뀌었는지 · 바깥 클릭 / Esc 로 닫을 때 버릴지 묻는 창 */
  const [pointsDirty, setPointsDirty] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  /** 회차 상세 모달 — 받은 회차 목록 안의 위치. `null` 이면 닫혀 있다 */
  const [runIndex, setRunIndex] = useState<number | null>(null)

  // URL 세그먼트는 문자열이다. 숫자가 아니면 조회하지 않는다(`/zones/abc`).
  const parsed = Number(courseSeqParam)
  const courseSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = useCourseDetail(courseSeq)
  const course = detail.data

  /**
   * 순찰 기록·KPI (B단).
   *
   * 🔴 **기간을 `useMemo` 로 고정한다.** `recentRange()` 는 매 렌더 새 객체를 만들고 그
   * 객체가 **queryKey 에 들어간다** — 고정하지 않으면 렌더마다 키가 바뀌어 **조회가
   * 멈추지 않는다.** 날짜 문자열은 같아도 참조가 달라서 생기는 문제다.
   * ⚠️ 자정을 넘겨도 갱신되지 않는다 — 코스 상세를 하루 넘게 열어 두는 화면이 아니고,
   * 매 렌더 재계산의 비용이 그 정확성보다 크다.
   */
  const range = useMemo(() => recentRange(), [])
  const history = useCourseHistory(siteSeq, courseSeq, range)

  const rows = history.data?.items ?? []
  const stats = courseHistoryStats(rows, history.data?.totalCount ?? 0)
  /**
   * 지도에 찍을 좌표 (`spec 032`). 🔴 **조회가 늘지 않는다** — 상세 응답을 다시 셀 뿐이다.
   * `useMemo` 인 이유: `CourseMapCard` 가 `pins` 참조로 지도를 다시 그린다(렌더마다 새
   * 배열이면 **지도가 매번 파괴·재생성**된다).
   */
  const coords = useMemo(() => usableCoords(course?.points ?? []), [course?.points])

  const removal = useMutation({
    mutationFn: deleteCourse,
    onSuccess: async () => {
      // 🔴 이동을 **무효화보다 먼저** 한다. 목록이 먼저 갱신되면 사라진 코스의 상세를
      // 다시 조회해 "찾을 수 없음" 이 한 번 깜빡인다(027 승계).
      // 🔴 실패 시에는 호출되지 않으므로 **상세에 머문다** — 거부인데 화면이 바뀌면
      // 사용자는 삭제된 것으로 오해한다.
      navigate(paths.service.zones, { replace: true })
      await queryClient.invalidateQueries({ queryKey: courseKeys.lists })
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">
      <Breadcrumb />

      {course ? (
        <>
          <AppPageHeader
            title={course.courseName}
            icon={RouteIcon}
            // 🔴 설명(`memo`)을 여기 넣지 않는다 — 기본정보 카드에 이미 있고, 같은 문장이
            // 한 화면에 두 번 나오면 사용자는 둘이 다른 값인지 확인하려 눈을 왕복한다
            titleSuffix={
              <>
                {course.useYn ? (
                  <AppBadge variant="success">사용</AppBadge>
                ) : (
                  <AppBadge variant="muted">미사용</AppBadge>
                )}
                {/* 🔴 **요약 뱃지**(목업 `코스상세-신규.html`) — 코스 상세를 여는 두 번째
                    질문이 "얼마나 큰 코스인가" 다. 두 값이 아래 두 카드에 흩어져 있어
                    제목 줄에서 한 번에 읽히게 한다. ⚠️ `pointCount` 는 상세 응답에 없어
                    (목록 전용) **편성 배열의 길이**로 센다 — 같은 값이다 */}
                {/* 🔄 뱃지 → 글자(`spec 074` 시안) · `기준` 을 붙여 실제 소요와 구분한다 */}
                <span className="text-caption text-muted-foreground tabular-nums">
                  지점 {course.points.length}개 · 기준 {course.totalMin}분
                </span>
              </>
            }
            action={
              <div className="flex items-center gap-2">
                {/* 🔄 **`spec 074`**: 머리에는 `⋯`(삭제)만. 삭제는 파괴적이라 메뉴 안에 숨긴다(시안).
                    `수정` 은 기본정보 카드 · `편성 편집` 은 순찰 경로 카드 — 고치는 값이 있는 카드에 둔다(2026-11-13) */}
                {/* modal={false} — 메뉴 항목에서 확인 창을 열 때 body pointer-events 가 남는 Radix 문제 회피(GroupEditDialog 와 같음) */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <AppIconButton icon={EllipsisIcon} iconSize={16} aria-label="코스 메뉴" />
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
                {/* 🔴 편성된 지점이 있어도 선제 차단하지 않는다 — 서버가 거부하지 않는다(실측, A1) */}
                <AppAlertDialog
                  open={deleteOpen}
                  onOpenChange={setDeleteOpen}
                  size="sm"
                  icon={Trash2Icon}
                  variant="destructive"
                  title="코스를 삭제하시겠습니까?"
                  description="삭제된 코스와 지점 편성은 복구할 수 없습니다. 지점 자체는 삭제되지 않습니다."
                  actionLabel="삭제"
                  // 🔴 인자 이름이 `courseId` 다 — `courseSeq` 로 보내면 400 ProblemDetails(B-12)
                  onAction={() => removal.mutate(course.courseSeq)}
                />
              </div>
            }
          />

          {/* 🔴 **KPI 는 전체 폭, 헤더 바로 아래** — 평균 · 인증률은 프론트가 더한 값(서버 집계 없음) */}
          <CourseKpiRow stats={stats} />

          {/* 2열 골격 — 왼쪽 2/3 = 경로 · 기록, 오른쪽 1/3 = 기본정보 · 시간대별 · 근무자별(`spec 074`). `xl` 미만 1단 */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
              <CourseRouteCard
                points={course.points}
                pins={coords.pins}
                missing={coords.missing}
                runs={rows.length}
                onEdit={() => setEditingPoints(true)}
              />

              <CoursePatrolLog
                courseSeq={course.courseSeq}
                rows={rows}
                totalCount={history.data?.totalCount ?? 0}
                isPending={history.isPending}
                onSelect={(row) => setRunIndex(rows.indexOf(row))}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <CourseInfo course={course} onEdit={() => setEditOpen(true)} />
              <CourseHourlyCard rows={rows} isPending={history.isPending} />
              <CourseWorkerCard rows={rows} isPending={history.isPending} />
            </div>
          </div>

          <CourseRunDialog rows={rows} index={runIndex} totalMin={course.totalMin} onIndexChange={setRunIndex} />

          {/* 🔄 **편성 편집은 모달**(사용자 결정 2026-11-13) — 카드 자리를 바꿔 그리면 지도가 사라지고 페이지가 출렁인다.
              🔴 편집기는 열 때마다 새로 붙는다(초안이 서버 편성에서 시작). 🔴 바뀐 내용이 있으면 바깥 클릭 · Esc 로
              바로 닫지 않고 묻는다 — 드래그하다 바깥을 눌러 작업이 사라지지 않게. `취소` 버튼은 묻지 않는다(명시적 원복) */}
          <AppDialog
            open={editingPoints}
            onOpenChange={(open) => {
              if (open) return
              if (pointsDirty) setDiscardOpen(true)
              else setEditingPoints(false)
            }}
            title="지점 순서 편집"
            description="드래그로 순서를 바꾸고 구간시간을 입력합니다. 저장하면 코스 편성 전체가 바뀝니다."
            contentClassName="sm:max-w-[640px]"
          >
            {editingPoints && (
              <CoursePointEditor
                course={course}
                onDirtyChange={setPointsDirty}
                onClose={() => {
                  setPointsDirty(false)
                  setEditingPoints(false)
                }}
              />
            )}
          </AppDialog>
          <AppAlertDialog
            open={discardOpen}
            onOpenChange={setDiscardOpen}
            size="sm"
            title="변경 내용을 버리시겠습니까?"
            description="저장하지 않은 지점 순서 · 구간시간 변경이 사라집니다."
            cancelLabel="계속 편집"
            actionLabel="버리기"
            onAction={() => {
              setPointsDirty(false)
              setEditingPoints(false)
            }}
          />

          {/* 🔴 **trigger 없는 제어형 모달**이다. 버튼은 기본정보 카드가 들고 있고(074 에서 다시 카드로)
              (`CourseInfo.onEdit`) 모달·폼은 페이지가 들고 있다 — 카드가 mutation 을 들면
              전량 전송 규약(B-25)이 카드 안으로 새어 들어온다 */}
          <AppDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            title="코스 수정"
            description="코스명 · 설명 · 교대 허용 · 사용 여부를 수정합니다."
            contentClassName="sm:max-w-[520px]"
          >
            {/* 🔴 성공해야 닫는다 — 먼저 닫으면 실패 시 입력값이 사라진다 */}
            <EditCourseForm course={course} onSuccess={() => setEditOpen(false)} />
          </AppDialog>

        </>
      ) : detail.isPending && courseSeq !== null ? (
        <AppPageHeader title="코스 정보를 불러오는 중" subtitle="잠시만 기다려주세요" />
      ) : (
        <AppEmpty
          icon={RouteIcon}
          title="코스를 찾을 수 없습니다"
          description={
            courseSeq === null
              ? '주소가 올바르지 않습니다. 목록에서 다시 선택해주세요.'
              : (detail.error?.message ?? '삭제되었거나 접근할 수 없는 코스입니다.')
          }
          // 🔴 **명시적인 복귀 수단을 둔다.** 브레드크럼의 첫 조각이 목록 링크를 겸하지만,
          // 못 찾은 화면에서는 그것이 **빠져나갈 길로 읽히지 않는다**(브라우저 확인
          // 2026-10-12). 여기가 유일하게 "할 수 있는 일이 하나도 없는" 상태라 안내와
          // 수단이 같은 자리에 있어야 한다
          action={
            <Link
              to={paths.service.zones}
              className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon size={14} />
              코스 목록으로
            </Link>
          }
        />
      )}
    </div>
  )
}

export default ZoneDetailPage
