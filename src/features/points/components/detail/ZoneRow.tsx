import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { paths } from '@/router/paths'

/**
 * 소속 코스 1행 — **코스 상세로 가는 링크** (`spec 023` Phase 5, T371·T372).
 *
 * 🔴 **활성여부 점을 뺐다**(2026-10-13). `DetailPoint.courseList` 는
 * `{ courseSeq, courseName }` 만 주고(실측) 코스 활성여부를 주지 않아, 점이 **항상 중립**
 * 으로만 그려지고 있었다 — 아무것도 뜻하지 않는 표시다(027 지적). 채우려면 지점 상세마다
 * `GetCourseList` 를 추가로 돌려 `courseSeq` 로 맞춰야 하고, 사업장 코스가 많으면 **페이징**
 * 까지 돌아야 전량이 모인다. 요청 1건을 더 쓰는 값이 아니다.
 *
 * 🔴 **대신 링크를 준다.** 코스 상세(`/zones/:courseSeq`)에 가면 활성여부·편성·최근 순찰이
 * 다 있다 — 점 하나로 요약하는 것보다 **많이** 알려 준다. 023이 코스 상세를 열었기 때문에
 * 이제 갈 곳이 생겼다.
 */
const ZoneRow = ({ courseSeq, title }: { courseSeq: number; title: string }) => {
  return (
    <Link
      to={paths.service.courseDetail(courseSeq)}
      className="group flex items-center justify-between gap-4 border-b py-2 hover:text-point"
    >
      <span className="min-w-0 truncate">{title}</span>
      <ChevronRightIcon
        size={14}
        strokeWidth={1.75}
        className="shrink-0 text-muted-foreground group-hover:text-point"
      />
    </Link>
  )
}

export default ZoneRow
