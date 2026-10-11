import { ChevronRightIcon, RouteIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail'
import { paths } from '@/router/paths'

/**
 * 순찰코스 상세 — **라우트로 분리된 페이지** (`spec 023`).
 *
 * ⚠️ **Phase 2 의 최소 골격이다.** 경로 다이어그램·지점 순서 카드·기본정보 섹션은
 * Phase 3, 변경계(수정·삭제·편성·토글)는 Phase 4 다. 🔴 **동작하지 않는 버튼을 미리
 * 두지 않는다** — 027 이 걷어낸 "죽은 컨트롤" 과 같은 것이 된다.
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

  // URL 세그먼트는 문자열이다. 숫자가 아니면 조회하지 않는다(`/zones/abc`).
  const parsed = Number(courseSeqParam)
  const courseSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = useCourseDetail(courseSeq)
  const course = detail.data

  return (
    <div className="flex flex-col gap-4 p-8">
      <Breadcrumb />

      {course ? (
        <AppPageHeader
          title={course.courseName}
          icon={RouteIcon}
          subtitle={course.memo ?? undefined}
          titleSuffix={
            course.useYn ? (
              <AppBadge variant="success">사용</AppBadge>
            ) : (
              <AppBadge variant="muted">미사용</AppBadge>
            )
          }
        />
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
