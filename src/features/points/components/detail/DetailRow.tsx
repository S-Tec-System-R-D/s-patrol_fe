/**
 * 상세 정보 1행 — **라벨 좌측 고정폭 + 값 바로 옆**.
 *
 * 🔴 **027 에서 `justify-between` 을 버렸다.** 이 컴포넌트는 340px 패널에서 만들어졌고
 * 그 폭에서는 양끝 정렬이 읽혔다. 상세가 **전체 폭 페이지**가 되면서 라벨과 값 사이가
 * 580px(2단)~940px(1단)까지 벌어져 **눈이 따라가지 못했다**(실제 렌더 확인 2026-10-08).
 *
 * 라벨을 고정폭으로 왼쪽에 붙이면 **폭이 아무리 넓어져도 거리가 일정하다** — 페이지
 * 최대 폭을 제한하지 않고도 해결된다(폭 제한은 선례가 없고 이 화면만 좁아진다).
 *
 * ⚠️ 같은 일을 하는 `components/app/AppDetailRow` 가 따로 있다(공지·근무자·코스이력에서
 * 사용). **027 은 지점 쪽만 바꾼다** — 괜찮으면 그쪽으로 통합한다(사용자 결정 2026-10-08).
 */
/** `value` 는 `ReactNode` 다 — 인증수단처럼 뱃지를 넣는 행이 있다(027) */
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  return (
    <div className="flex items-start gap-4 border-b py-2">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words">{value}</span>
    </div>
  )
}

export default DetailRow
