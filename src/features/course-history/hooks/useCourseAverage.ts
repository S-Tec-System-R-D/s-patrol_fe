import { useQuery } from '@tanstack/react-query'

import { fetchCourseHistory } from '../api/getCourseHistory'
import { courseAverage } from '../lib/courseAverage'
import { MAX_PAGE_SIZE } from '../lib/courseHistoryListParams'
import { courseHistoryKeys } from '../queryKeys'
import { COURSE_HISTORY_STATUS } from '../types'

/**
 * 코스 평균 소요시간 (`spec 036` T498).
 *
 * 🔴 **상세 훅과 분리한다.** 평균은 **코스 단위**라 회차가 바뀌어도 같은 코스면 값이
 * 같다 — 상세(`historySeq`)에 묶으면 회차를 옮길 때마다 100건을 다시 받는다.
 *
 * 🔴 **완료만 센다**(`eventType=1`). 미완료의 소요시간은 "그 코스를 도는 데 걸리는 시간"
 * 이 아니다 — 실측 사업장 6 은 54건 중 30건이 미완료라, 섞으면 평균이 절반 가까이 틀린다.
 *
 * 🔴 **기간을 걸지 않는다.** "이 코스의 평균" 이려면 화면의 기간 필터와 무관해야 한다
 * (기간을 좁히면 평균이 화면마다 달라진다). 대신 `pageSize` 상한(100) 때문에 100건을
 * 넘으면 `partial: true` 로 알리고 화면이 **"최근 100회 평균"** 이라고 적는다.
 *
 * ⚠️ `siteSeq`·`courseSeq` 가 없으면 호출하지 않는다(B-9 — 권한 밖도 200 이 온다).
 */

export const useCourseAverage = (siteSeq: number | null, courseSeq: number | null) =>
  useQuery({
    queryKey: courseHistoryKeys.courseAverage(siteSeq ?? -1, courseSeq ?? -1),
    queryFn: () =>
      fetchCourseHistory({
        siteSeq: siteSeq as number,
        courseSeq: courseSeq as number,
        eventType: COURSE_HISTORY_STATUS.COMPLETED,
        pageNumber: 1,
        pageSize: MAX_PAGE_SIZE,
      }),
    enabled: siteSeq !== null && courseSeq !== null,
    select: (data) => courseAverage(data.items, data.totalCount),
  })
