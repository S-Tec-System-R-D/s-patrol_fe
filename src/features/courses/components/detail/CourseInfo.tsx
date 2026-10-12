import { Switch } from '@/components/ui/switch'
import { getSiteName } from '@/lib/auth/site'

import type { CourseDetail } from '../../types'
import type { CourseToggleKind } from './CourseToggleDialog'

/**
 * 코스 기본정보 (`spec 023` Phase 3 T359 → **Phase 4 에서 토글 2종 추가**).
 *
 * 🔴 **`siteSeq`·사업장명이 응답에 없다**(OQ-9). 사업장명은 `spec 021` 이 저장해 둔
 * 선택값(`getSiteName()`)으로 채운다. `UpdateCourse` 가 요구하는 `siteSeq` 도 같은
 * 출처다 — **상세만 보고 수정 요청을 구성할 수 없다.**
 *
 * ⚠️ **목록에만 있는 값은 여기 없다**: `courseStatusCode`/`courseStatusName`(상태 뱃지)·
 * `pointCount`·`history`(최근 순찰). 상태는 **상세 응답에 없어** 제목 옆 뱃지를
 * `useYn` 으로만 만든다.
 *
 * 🔴 **`memo` 는 비어 있을 수 있다**(`null`). 지점과 달리 코스는 `UpdateCourse` 로
 * **실제로 비울 수 있다**(B-15 와 반대, 규칙 6) — 즉 빈 값은 정상 상태다.
 *
 * 🔴 **총 소요시간은 입력값이 아니라 파생 값이다**(실측 B-31): 저장 시 `totalMin: null`
 * 을 보내면 서버가 **구간시간 합**으로 채운다. 그래서 여기도, 수정 모달에도 입력란이
 * 없다 — 구간시간을 고치면 따라 바뀐다.
 *
 * 🔴 **토글은 확인 모달을 거친다**(규칙 11). 이 컴포넌트는 **요청만** 하고(`onRequestToggle`)
 * 모달·mutation 은 페이지가 들고 있다 — 기본정보 카드가 서버 상태를 직접 바꾸면
 * `UpdateCourse` 전량 전송 규약(B-25)이 카드 안으로 새어 들어온다.
 * 🔴 **옵티미스틱이 아니다** — 스위치는 `course` 값만 따르므로 재조회 전까지 **이전
 * 위치에 남아 있는 것이 정상**이다(`CourseToggleDialog` 주석).
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

/**
 * 토글 행. 🔴 **글자를 함께 둔다** — 스위치 위치(색·좌우)만으로 상태를 전달하지 않는다
 * (design-system 접근성 규약: 색·명도만으로 의미를 전하지 않는다).
 */
const ToggleValue = ({
  id,
  checked,
  onLabel,
  offLabel,
  disabled,
  onRequest,
}: {
  id: string
  checked: boolean
  onLabel: string
  offLabel: string
  disabled?: boolean
  onRequest: (nextValue: boolean) => void
}) => (
  <span className="flex items-center gap-2">
    <Switch
      id={id}
      checked={checked}
      disabled={disabled}
      // 🔴 여기서 값을 바꾸지 않는다 — 확인 모달을 **요청**만 한다
      onCheckedChange={(next) => onRequest(next)}
    />
    <label htmlFor={id} className={checked ? 'text-foreground' : 'text-muted-foreground'}>
      {checked ? onLabel : offLabel}
    </label>
  </span>
)

interface CourseInfoProps {
  course: CourseDetail
  /** 확인 모달을 열어 달라는 요청. 실제 저장은 페이지가 한다 */
  onRequestToggle: (kind: CourseToggleKind, nextValue: boolean) => void
  /** 저장 중에는 스위치를 잠근다 — 연타가 전량 전송을 중복으로 만들지 않게 */
  isSaving?: boolean
}

const CourseInfo = ({ course, onRequestToggle, isSaving }: CourseInfoProps) => {
  const siteName = getSiteName()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <span className="text-panel-title font-semibold">기본정보</span>

      <div className="grid grid-cols-1 gap-x-8 text-body xl:grid-cols-2">
        {/* 🔴 **코스명 행을 두지 않는다** — 페이지 제목이 이미 코스명이다. 같은 값이 한
            화면에 두 번 있으면 사용자는 둘이 다른 값인지 확인하려 눈을 왕복한다(설명도
            같은 이유로 제목 아래에서 뺐다). 수정 모달에는 당연히 들어간다 */}
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
        <InfoRow
          label="총 소요시간"
          value={<span className="tabular-nums">{course.totalMin}분</span>}
        />
        <InfoRow
          label="교대 허용"
          value={
            <ToggleValue
              id="course-switch-yn"
              checked={course.switchYn}
              onLabel="허용"
              offLabel="허용 안 함"
              disabled={isSaving}
              onRequest={(next) => onRequestToggle('switchYn', next)}
            />
          }
        />
        <InfoRow
          label="코스 활성화"
          value={
            <ToggleValue
              id="course-use-yn"
              checked={course.useYn}
              onLabel="사용"
              offLabel="미사용"
              disabled={isSaving}
              onRequest={(next) => onRequestToggle('useYn', next)}
            />
          }
        />
      </div>
    </div>
  )
}

export default CourseInfo
