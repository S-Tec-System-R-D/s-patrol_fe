import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRightIcon, RouteIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import { deleteCourse } from '@/features/courses/api/deleteCourse'
import { updateCourse } from '@/features/courses/api/updateCourse'
import CourseDiagramCard from '@/features/courses/components/detail/CourseDiagramCard'
import CourseInfo from '@/features/courses/components/detail/CourseInfo'
import CoursePointEditor from '@/features/courses/components/detail/CoursePointEditor'
import CoursePointList from '@/features/courses/components/detail/CoursePointList'
import CourseToggleDialog, {
  type CourseToggleKind,
} from '@/features/courses/components/detail/CourseToggleDialog'
import EditCourseForm from '@/features/courses/form/EditCourseForm'
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail'
import { toUpdateCourseBody } from '@/features/courses/lib/updateCourseBody'
import { courseKeys } from '@/features/courses/queryKeys'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

/**
 * 순찰코스 상세 — **라우트로 분리된 페이지** (`spec 023`).
 *
 * **Phase 4 에서 변경계가 들어왔다**: 기본정보 수정 모달 · 삭제 · 토글 2종 확인 모달 ·
 * 지점 편성 편집 모드. 조회 섹션(다이어그램 · 지점 순서 · 기본정보)은 Phase 3 그대로다.
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
 * `courseStatusName` 이 있지만 **상세 응답에는 없다**(실측).
 *
 * 🔴 **브레드크럼 + 제목을 둘 다 둔다**(027 승계 — 질문이 둘이다): 브레드크럼은 "어느
 * 화면인가", 제목은 "어느 코스인가". 브레드크럼의 첫 조각이 목록 링크를 겸해 **`← 목록
 * 으로` 를 흡수**한다.
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
  /** 열려 있는 토글 확인 모달. `null` 이면 닫혀 있다 */
  const [toggle, setToggle] = useState<{ kind: CourseToggleKind; nextValue: boolean } | null>(null)

  // URL 세그먼트는 문자열이다. 숫자가 아니면 조회하지 않는다(`/zones/abc`).
  const parsed = Number(courseSeqParam)
  const courseSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = useCourseDetail(courseSeq)
  const course = detail.data

  /**
   * 토글 저장.
   *
   * 🔴 **옵티미스틱이 아니다** — 모달에서 의도를 확인했으므로 응답을 기다린다. 스위치는
   * 재조회 뒤에 움직이고, 그래서 확인 직후 잠깐 이전 위치에 남아 있는 것이 정상이다
   * (`CourseToggleDialog` 주석 — `patterns.md` §10 과 어긋나는 부분은 T374 에서 갱신).
   */
  const toggleMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.lists }),
        queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseSeq ?? 0) }),
      ])
    },
  })

  const confirmToggle = () => {
    if (!course || siteSeq === null || !toggle) return
    // 🔴 계산된 키(`{ [kind]: value }`)로 만들지 않는다 — 타입이 `{ [x: string]: boolean }`
    // 로 넓어져 **필드명 오타를 타입이 못 잡는다**. 두 갈래를 그대로 적는다
    const overrides =
      toggle.kind === 'useYn' ? { useYn: toggle.nextValue } : { switchYn: toggle.nextValue }

    toggleMutation.mutate(
      // 🔴 `points` 를 넘기지 않는다 = 현재 편성 전량이 실린다(B-25). 토글 한 번에
      // 지점이 사라지는 사고가 여기서 막힌다
      toUpdateCourseBody(course, siteSeq, overrides)
    )
    setToggle(null)
  }

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
    <div className="flex flex-col gap-4 p-8">
      <Breadcrumb />

      {course ? (
        <>
          <AppPageHeader
            title={course.courseName}
            icon={RouteIcon}
            // 🔴 설명(`memo`)을 여기 넣지 않는다 — 기본정보 카드에 이미 있고, 같은 문장이
            // 한 화면에 두 번 나오면 사용자는 둘이 다른 값인지 확인하려 눈을 왕복한다
            titleSuffix={
              course.useYn ? (
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
                  title="코스 수정"
                  description="코스명과 설명을 수정할 수 있습니다."
                  trigger={
                    <AppButton icon={SquarePenIcon} variant="sub" className="bg-card">
                      수정
                    </AppButton>
                  }
                >
                  {/* 🔴 성공해야 닫는다 — 먼저 닫으면 실패 시 입력값이 사라진다 */}
                  <EditCourseForm course={course} onSuccess={() => setEditOpen(false)} />
                </AppDialog>

                {/* 🔴 **편성된 지점이 있어도 선제 차단하지 않는다** — 서버가 거부하지
                    않는다(실측). 없는 규칙을 프론트가 만들지 않는다(A1) */}
                <AppAlertDialog
                  size="sm"
                  icon={Trash2Icon}
                  variant="destructive"
                  title="코스를 삭제하시겠습니까?"
                  description="삭제된 코스와 지점 편성은 복구할 수 없습니다. 지점 자체는 삭제되지 않습니다."
                  actionLabel="삭제"
                  // 🔴 인자 이름이 `courseId` 다 — `courseSeq` 로 보내면 400
                  // ProblemDetails 가 온다(B-12). api 함수의 인자명이 그것을 지킨다
                  onAction={() => removal.mutate(course.courseSeq)}
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

          {/* 🔴 다이어그램을 **맨 위**에 둔다 — 코스 상세를 여는 첫 질문이
              "이 코스가 어디를 어떤 순서로 도는가" 다. 목업 `코스관리-신규.png` 와 같다.
              ⚠️ 편집 중에는 **저장된 순서**를 그린다 — 초안을 반영하면 "저장 전인데 반영된
              것처럼" 보인다(옵티미스틱을 안 쓰는 것과 같은 이유) */}
          <CourseDiagramCard points={course.points} />

          {/* 좌 2/3 (지점 순서) / 우 1/3 (기본정보) — `xl` 미만 1단.
              🔴 순서 목록이 길어지는 쪽이라 넓은 칸을 준다(기본정보는 5행 고정) */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              {editingPoints ? (
                <CoursePointEditor course={course} onClose={() => setEditingPoints(false)} />
              ) : (
                <CoursePointList points={course.points} onEdit={() => setEditingPoints(true)} />
              )}
            </div>
            <CourseInfo
              course={course}
              onRequestToggle={(kind, nextValue) => setToggle({ kind, nextValue })}
              isSaving={toggleMutation.isPending}
            />
          </div>

          {/* 🔴 토글 2종이 **같은 컴포넌트를 쓰고 문구만 다르다**(규칙 11) */}
          {toggle && (
            <CourseToggleDialog
              kind={toggle.kind}
              nextValue={toggle.nextValue}
              open
              onOpenChange={(open) => !open && setToggle(null)}
              onConfirm={confirmToggle}
            />
          )}
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
        />
      )}
    </div>
  )
}

export default ZoneDetailPage
