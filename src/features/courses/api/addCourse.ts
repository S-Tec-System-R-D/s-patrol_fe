import api from '@/lib/axios'
import type { AddCourseRequest } from '../types'

/**
 * 순찰코스 추가.
 *
 * `POST /api/v1/Course/W/sign/AddCourse`
 *
 * ✅ **실측 완료(2026-10-10, WF-1-0)**: 200 + `{"message":...,"data":true,"code":200}`.
 * 지점 3종과 같은 래퍼다.
 *
 * 🔴🔴 **`points` 를 보내지 않는다.** swagger 에는 있지만 **서버가 무시한다** — 지점을
 * 실어 보내면 `pointCount: 0` 으로 생성되고 **200 이 온다**(B-27). 성공 응답이 오면서
 * 절반만 되는, 가장 알아채기 어려운 실패다. 타입(`AddCourseRequest`)에서 필드를 **지워**
 * 보낼 수 없게 해 뒀다. 편성은 생성 후 `UpdateCourse` 로 한다.
 *
 * 🔴 **생성된 `courseSeq` 를 주지 않는다**(`data: true` 뿐) → 반환은 `void`. 생성 직후
 * 상세로 이동할 수 없고, **이름으로 찾아 이동하지도 않는다** — 동명 코스가 있으면
 * 엉뚱한 코스로 간다(`spec 023` §4). 성공 후에는 목록을 무효화해 다시 읽는다.
 */

const ADD_COURSE_PATH = '/api/v1/Course/W/sign/AddCourse'

export const addCourse = async (body: AddCourseRequest): Promise<void> => {
  await api.post(ADD_COURSE_PATH, body)
}
