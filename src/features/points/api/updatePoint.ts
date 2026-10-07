import api from '@/lib/axios'
import type { UpdatePointRequest } from '../types'

/**
 * 순찰지점 수정.
 *
 * 🔴 **`PATCH` 다. `PUT` 이 아니다**(swagger 실측). `roadmap.md` §7-1 의
 * "POST/PUT/DELETE" 표기는 오기이며 `spec 022` 에서 교정한다.
 *
 * `PATCH /api/v1/Point/W/sign/UpdatePoint`
 *
 * 메서드가 PATCH 지만 **부분 갱신을 가정하지 않는다** — `UpdatePointDto` 가 전체 필드를
 * 받고 어떤 필드를 생략했을 때 서버가 "변경 없음" 으로 보는지 **미실측**이다. 그래서
 * 폼이 들고 있는 값을 **전부 채워 보낸다**(생략 = 무엇인지 모르는 상태로 두지 않는다).
 *
 * `reissueQrYn` 은 `false` 고정 — QR 재발급은 `spec 022` 범위 외(OQ-022-D).
 *
 * ⚠️ 성공 응답 형태 미실측 + OQ-022-A·J 함정은 `addPoint.ts` 주석과 동일하다.
 */

const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'

export const updatePoint = async (body: UpdatePointRequest): Promise<void> => {
  await api.patch(UPDATE_POINT_PATH, body)
}
