import { PowerIcon, RefreshCwIcon } from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'

/**
 * 코스 활성화 · 교대 허용 **확인 모달** (`spec 023` Phase 4, T364).
 *
 * 🔴 **둘 다 모달을 거친다. 단, 문구가 다르다**(사용자 결정, 규칙 11). 하나만 모달로
 * 두면 "어느 토글이 위험한지" 를 사용자가 기억해야 하고, 둘을 같은 문구로 두면 모달이
 * **읽지 않고 누르는 관문**이 된다 — 그러면 경고가 없는 것과 같다.
 *
 * 🔴🔴 **옵티미스틱을 쓰지 않는다.** `patterns.md` §10 은 토글류에 옵티미스틱을
 * 지정하지만, **확인 모달과 양립할 수 없다**: 모달에서 이미 의도를 확인했는데 화면을
 * 먼저 바꿔 놓고 실패 시 되돌리면, 사용자는 **자기가 확인한 변경이 조용히 취소된 것**을
 * 토스트 한 줄로만 알게 된다. 스위치는 **서버 응답(재조회) 뒤에** 움직인다 — 그래서
 * 확인 직후 잠깐 이전 상태로 남아 있는 것이 **정상**이다(T374 에서 §10 을 갱신한다).
 *
 * 🔴 **확인 즉시 닫는다.** 입력 폼과 달리 잃을 값이 없고, 거부 사유는 전역
 * `MutationCache.onError` 토스트가 전달한다(삭제 모달과 같은 처리).
 *
 * ✅ **OQ-023-F 해소(2026-10-12, 사용자 업무 확인)**: 코스는 **관리자가 근무자에게
 * 배정하는 것이 아니라, 근무자가 앱에서 본인이 돌 코스를 직접 고른다.** 그래서
 * 비활성화의 효과는 "배정되지 않는다" 가 아니라 **"앱 코스 목록에서 숨겨져 고를 수
 * 없다"** 다 — 처음 문구는 틀린 경고였다. 효과를 단정하는 문장은 활성화·비활성화
 * 두 줄뿐이고, 교대 허용 쪽은 여전히 효과를 말하지 않는다(A1 — 미확인).
 */

export type CourseToggleKind = 'useYn' | 'switchYn'

interface CourseToggleDialogProps {
  kind: CourseToggleKind
  /** 확인 시 적용될 값. 켜는지 끄는지에 따라 문구가 갈린다 */
  nextValue: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** 🔴 문구를 **한 자리에** 모아 둔다 — 네 경우가 각각 다른 말을 해야 한다 */
const copy = (kind: CourseToggleKind, nextValue: boolean) => {
  if (kind === 'useYn') {
    return nextValue
      ? {
          icon: PowerIcon,
          variant: 'default' as const,
          title: '코스를 활성화하시겠습니까?',
          description: '활성화하면 근무자 앱의 코스 목록에 다시 노출됩니다.',
          actionLabel: '활성화',
        }
      : {
          icon: PowerIcon,
          variant: 'destructive' as const,
          title: '코스를 비활성화하시겠습니까?',
          // ✅ OQ-023-F 해소 — 근무자가 **직접 고르는** 방식이다(위 블록 주석)
          description:
            '비활성화하면 근무자 앱의 코스 목록에서 숨겨져, 더 이상 이 코스로 순찰을 시작할 수 없습니다.',
          actionLabel: '비활성화',
        }
  }

  /**
   * 교대 허용 — **담백한 확인**이다(사용자 결정).
   *
   * 🔴 효과를 설명하지 않는다. "여러 근무자가 나눠 돈다" 같은 문장은 그럴듯하지만
   * **실측·업무 확인이 없다**(A1). 대신 "바로 저장된다" 는 사실만 말한다 — 이 모달이
   * 막으려는 것은 **오클릭**이고, 그 목적에는 이 한 줄로 충분하다.
   */
  return {
    icon: RefreshCwIcon,
    variant: 'default' as const,
    title: nextValue ? '교대를 허용하시겠습니까?' : '교대 허용을 끄시겠습니까?',
    description: '변경하면 코스 설정에 바로 저장됩니다.',
    actionLabel: nextValue ? '허용' : '끄기',
  }
}

const CourseToggleDialog = ({
  kind,
  nextValue,
  open,
  onOpenChange,
  onConfirm,
}: CourseToggleDialogProps) => {
  const { icon, variant, title, description, actionLabel } = copy(kind, nextValue)

  return (
    <AppAlertDialog
      size="sm"
      icon={icon}
      variant={variant}
      title={title}
      description={description}
      actionLabel={actionLabel}
      open={open}
      onOpenChange={onOpenChange}
      onAction={onConfirm}
    />
  )
}

export default CourseToggleDialog
