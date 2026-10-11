import api from '@/lib/axios'
import type { UpdateCourseRequest } from '../types'

/**
 * 순찰코스 수정 — **기본정보와 지점 편성이 같은 엔드포인트다.**
 *
 * 🔴 **`PUT` 이다. `PATCH` 가 아니다**(swagger 실측). 지점(`UpdatePoint`)은 PATCH 라
 * 부분 갱신인데 코스는 PUT 이고 동작도 다르다 — **지점의 교훈을 옮기면 틀린다.**
 *
 * `PUT /api/v1/Course/W/sign/UpdateCourse`
 *
 * ✅ **실측 완료(2026-10-10, WF-1-0)**: 성공은 200 + `data: true`.
 *
 * 🔴🔴 **`points` 는 전체 교체다**(B-25). 생략·빈 배열·일부 전송이 **모두 나머지를
 * 삭제**한다. 그래서 타입이 `points` 를 **required** 로 두고, 호출부는 **화면이 들고 있는
 * 전체 목록**을 매번 그대로 보낸다. 지점 하나를 더하는 경우에도 전량이다 —
 * "변경분만 보내기" 를 만들면 나머지가 지워진다.
 *
 * 🔴🔴 **`courseSeq` 가 빠지면 서버가 401 을 준다**(B-28). 인증 문제가 아닌데 401 이라
 * **axios 인터셉터가 토큰 만료로 오해**해 재발급·로그아웃 경로를 탄다 — 코스를
 * 저장하려다 **로그아웃되는** 증상이다. 타입에서 required 로 막았다(swagger 는
 * required 가 아니지만 우리가 더 엄격하게 간다).
 *
 * 🔴 **`memo: null` 은 반영된다**(비워짐). 지점은 `null`·`''` 을 무시해 값을 비울 수
 * 없지만(B-15) **코스는 비워진다.** 엔드포인트마다 다르므로 코스는 코스대로 쓴다.
 *
 * ⚠️ 편성 지점의 `useYn` 은 **보낼 수단이 없다**(`UpdateCoursePointDto` 에 없음, B-29) —
 * 읽기 전용이다. 토글을 만들면 저장해도 안 바뀐다.
 *
 * ⚠️ **PATCH 전환을 요청해 뒀다**(B-24). 받아들여지면 `points` 의 의미도 함께 정해져야
 * 하므로(B-25) 그때 "전량 전송" 규약을 재검토한다(OQ-023-E) — 손댈 곳은 이 파일과
 * 호출부 하나다.
 */

const UPDATE_COURSE_PATH = '/api/v1/Course/W/sign/UpdateCourse'

export const updateCourse = async (body: UpdateCourseRequest): Promise<void> => {
  await api.put(UPDATE_COURSE_PATH, body)
}
