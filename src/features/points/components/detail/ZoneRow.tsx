/**
 * 소속 코스 1행.
 *
 * `isActive` 는 **선택**이다. `DetailPoint.courseList` 가 `{ courseSeq, courseName }` 만
 * 주고 코스 활성여부를 주지 않아(실측), 모르는 값을 `true` 로 채워 활성인 것처럼
 * 보이게 하지 않는다(A1). 생략하면 중립(테두리) 점으로 그린다.
 * 코스 활성여부는 코스 API 전환(`spec 023`)에서 채운다.
 */
const ZoneRow = ({ title, isActive }: { title: string; isActive?: boolean }) => {
  return (
    <div className="flex items-center gap-4 py-2 border-b">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isActive ? 'bg-point' : 'border border-muted-foreground/40'
        }`}
      />
      <span>{title}</span>
    </div>
  )
}

export default ZoneRow
