import { SquarePenIcon } from 'lucide-react'

import AppDetailRow from '@/components/app/AppDetailRow'
import AppLinkButton from '@/components/app/AppLinkButton'
import { getSiteName } from '@/lib/auth/site'

import type { CourseDetail } from '../../types'

/**
 * 코스 기본정보 (`spec 023` → **`spec 074` 에서 읽기 전용 글자로**).
 *
 * 🔴 **스위치를 뺐다**(사용자 결정 2026-11-12) — 교대 · 사용 여부는 자주 바꾸는 값이 아니라 `수정` 모달
 * (`EditCourseForm`)에서 함께 바꾼다. 여기서는 지금 값만 읽는다.
 * 🔄 `수정` 버튼은 머리 → **이 카드 제목 줄**(사용자 결정 2026-11-13) — 고치는 값이 이 카드에 있다. 순찰 경로
 * 카드의 `편성 편집` 과 같은 자리 · 같은 모양이다. 모달 · 폼은 페이지가 들고 있다(`onEdit`).
 *
 * 🔴 **`siteSeq`·사업장명이 응답에 없다**(OQ-9) — 사업장명은 `spec 021` 저장값(`getSiteName()`).
 * 🔴 **`memo` 는 비어 있을 수 있다**(`null`, 규칙 6) — 빈 값은 정상 상태라 `-`.
 * 🔴 **기준 소요시간은 파생 값이다**(B-31) — 구간시간 합. 입력란이 없다.
 */

const CourseInfo = ({ course, onEdit }: { course: CourseDetail; onEdit: () => void }) => {
  const siteName = getSiteName()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-panel-title font-semibold">기본정보</span>
        <AppLinkButton icon={SquarePenIcon} onClick={onEdit}>
          수정
        </AppLinkButton>
      </div>

      <div className="flex flex-col text-body">
        <AppDetailRow label="사업장" value={siteName ?? '-'} />
        <AppDetailRow
          label="설명"
          value={course.memo?.trim() ? course.memo : <span className="text-muted-foreground">-</span>}
        />
        <AppDetailRow label="기준 소요시간" value={<span className="tabular-nums">{course.totalMin}분</span>} />
        <AppDetailRow label="교대" value={course.switchYn ? '허용' : '허용 안 함'} />
        <AppDetailRow
          label="상태"
          value={course.useYn ? '사용' : <span className="text-muted-foreground">미사용</span>}
        />
      </div>
    </div>
  )
}

export default CourseInfo
