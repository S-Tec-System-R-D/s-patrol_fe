import type { LucideIcon } from 'lucide-react'

/**
 * **"아직 만들지 않은 것"** 표시 (`spec 027` Phase 3).
 *
 * 🔴 **빈 상태(`AppEmpty`)와 반드시 구별되게 그린다.** 변경 이력은 **실제로 비어 있을
 * 수도** 있어서 같은 모양으로 그리면 "기록이 없는 것" 인지 "기능이 없는 것" 인지
 * 사용자도 우리도 알 수 없다. 그래서 **점선 + `준비 중` 뱃지 + 막힌 이유**를 쓴다.
 *
 * 🔴 **섹션을 지우지 않고 자리를 비워 두는 것이 목적이다**(OQ-027-E). 지우면 "설계에
 * 없던 것" 이 되어 나중에 다시 논의해야 한다 — 자리가 있으면 백엔드 응답이 올 때
 * **끼워 넣기만** 하면 된다.
 *
 * ⚠️ 공용(`components/app/`)으로 빼지 않는다. 사례가 이 화면 2곳뿐이고, 다른 화면에서
 * 같은 수요가 생기면 그때 승격한다(A6 + global 승격 정책 "두 번째 반복에서").
 */

/** `준비 중` 뱃지 — 두 변형이 공유한다 */
const PendingTag = () => (
  <span className="shrink-0 rounded-sm border border-dashed border-border bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
    준비 중
  </span>
)

/**
 * **행 단위** — 기본정보처럼 값 자리만 비는 경우.
 * 값 자리에 점선 박스를 두어 "빈 값(`-`)" 과 다르다는 것을 드러낸다.
 */
export const PendingValue = ({ label }: { label: string }) => (
  <div className="flex items-start gap-4 border-b py-2">
    <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
    <span className="min-w-0 flex-1">
      <PendingTag />
    </span>
  </div>
)

/**
 * **섹션 단위** — 변경 이력·QR 카드처럼 블록 전체가 비는 경우.
 * 막힌 이유를 **반드시** 적는다. 이유 없는 "준비 중" 은 언제 풀리는지 알 수 없다.
 */
export const PendingSection = ({
  title,
  icon: Icon,
  reason,
}: {
  title: string
  icon: LucideIcon
  /** 왜 막혔는지 한 줄 — 백엔드 요청 번호나 spec 번호를 포함한다 */
  reason: string
}) => (
  <section className="rounded-lg border border-dashed border-border bg-card/40 p-6">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{title}</span>
      <PendingTag />
    </div>
    <div className="mt-4 flex items-start gap-3">
      <Icon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted-foreground/60" />
      <p className="text-caption leading-relaxed text-muted-foreground">{reason}</p>
    </div>
  </section>
)
