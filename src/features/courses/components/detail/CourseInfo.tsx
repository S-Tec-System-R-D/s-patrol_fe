import AppBadge from '@/components/app/AppBadge'
import { getSiteName } from '@/lib/auth/site'

import type { CourseDetail } from '../../types'

/**
 * 코스 기본정보 (`spec 023` Phase 3, T359).
 *
 * 🔴 **`siteSeq`·사업장명이 응답에 없다**(OQ-9). 사업장명은 `spec 021` 이 저장해 둔
 * 선택값(`getSiteName()`)으로 채운다. 🔴 **Phase 4 가 더 아프다** — `UpdateCourse` 는
 * `siteSeq` 를 **요구**하는데 상세 응답에 없으므로 `getSiteSeq()` 로 보충해야 한다.
 * 즉 **상세만 보고 수정 요청을 구성할 수 없다.**
 *
 * ⚠️ **목록에만 있는 값은 여기 없다**: `courseStatusCode`/`courseStatusName`(상태 뱃지)·
 * `pointCount`·`history`(최근 순찰). 상태는 **상세 응답에 없어** 제목 옆 뱃지를
 * `useYn` 으로만 만든다 — 목록의 상태를 들고 오려면 목록을 한 번 더 조회해야 하고,
 * 그건 상세 한 건을 그리기 위한 비용으로 과하다(필요해지면 백엔드에 요청한다).
 *
 * 🔴 **`memo` 는 비어 있을 수 있다**(`null`). 지점과 달리 코스는 `UpdateCourse` 로
 * **실제로 비울 수 있다**(B-15 와 반대, 규칙 6) — 즉 빈 값은 정상 상태다.
 */

/**
 * 라벨 고정폭 + 값 — 027 이 지점 상세에서 `justify-between` 을 버린 것과 같은 이유다.
 * 전체 폭 페이지에서 양끝 정렬을 하면 라벨과 값 사이가 수백 px 벌어져 눈이 못 따라간다.
 *
 * ⚠️ **공용(`components/app/AppDetailRow`)을 쓰지 않았다** — 그쪽이 바로 그
 * `justify-between` 판이다. `features/points` 의 `DetailRow` 와 모양이 같지만 **남의
 * feature 내부를 가져다 쓰지 않고** 3줄을 복제했다(A6). 🔴 이제 **같은 행이 두 feature
 * 에 생겼다** — T373(공용 셸 승격 판단)의 1번 증거다.
 */
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-4 border-b py-2">
    <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
    <span className="min-w-0 flex-1 break-words">{value}</span>
  </div>
)

const CourseInfo = ({ course }: { course: CourseDetail }) => {
  const siteName = getSiteName()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <span className="text-panel-title font-semibold">기본정보</span>

      <div className="grid grid-cols-1 gap-x-8 text-body xl:grid-cols-2">
        {/* 🔴 **코스명 행을 두지 않는다** — 페이지 제목이 이미 코스명이다. 같은 값이 한
            화면에 두 번 있으면 사용자는 둘이 다른 값인지 확인하려 눈을 왕복한다(설명도
            같은 이유로 제목 아래에서 뺐다). 수정 모달에는 당연히 들어간다(Phase 4) */}
        <InfoRow label="사업장" value={siteName ?? '—'} />
        <InfoRow
          label="설명"
          value={
            course.memo?.trim() ? (
              course.memo
            ) : (
              // 🔴 "준비 중" 이 아니다 — 비울 수 있는 값이고 비어 있는 것이 정상이다
              <span className="text-muted-foreground">—</span>
            )
          }
        />
        <InfoRow label="총 소요시간" value={<span className="tabular-nums">{course.totalMin}분</span>} />
        <InfoRow
          label="교대 허용"
          value={
            course.switchYn ? (
              <AppBadge variant="success">허용</AppBadge>
            ) : (
              <span className="text-muted-foreground">허용 안 함</span>
            )
          }
        />
        <InfoRow
          label="코스 활성화"
          value={
            course.useYn ? (
              <AppBadge variant="success">사용</AppBadge>
            ) : (
              <AppBadge variant="muted">미사용</AppBadge>
            )
          }
        />
      </div>
    </div>
  )
}

export default CourseInfo
