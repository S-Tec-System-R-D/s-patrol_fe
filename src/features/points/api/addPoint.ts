import api from '@/lib/axios'
import type { AddPointRequest } from '../types'

/**
 * 순찰지점 추가 — **프로젝트의 첫 서버 상태 변경 호출**이다.
 *
 * `POST /api/v1/Point/W/sign/AddPoint`
 *
 * ⚠️ **성공 응답 형태가 미실측이다.** `api-spec.md` §5-1 의 실측 24종은 전부 조회계고
 * 변경계 행이 없다. 그래서 반환을 `void` 로 두고 **응답 본문에 의존하지 않는다** —
 * 생성된 `pointSeq` 를 준다 해도 쓰지 않고, 성공 후 목록을 무효화해 다시 읽는다.
 * 실측으로 `pointSeq` 가 확인되면 그때 반환 타입을 넓힌다(추측으로 먼저 선언하지
 * 않는다 — A1).
 *
 * 🔴 **알려진 함정 2개**(둘 다 백엔드 복귀 후 실측 — `spec 022` OQ-022-A·J)
 * - `HTTP 200` + 실패 `code` 응답이면 019 의 "성공은 2xx 전담" 판정이 **실패를 성공으로**
 *   본다 → 저장 안 됐는데 됐다고 표시된다.
 * - 응답이 `ApiResponse` 래퍼가 아니면(예: 204 No Content) 인터셉터가
 *   `'알 수 없는 응답 형식'` 을 던져 **성공을 실패로** 본다.
 */

const ADD_POINT_PATH = '/api/v1/Point/W/sign/AddPoint'

export const addPoint = async (body: AddPointRequest): Promise<void> => {
  await api.post(ADD_POINT_PATH, body)
}
