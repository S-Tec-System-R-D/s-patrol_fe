import api from '@/lib/axios'

/**
 * 순찰지점 삭제.
 *
 * `DELETE /api/v1/Point/W/sign/DeletePoint?pointSeq=`
 *
 * 파라미터명이 `pointSeq` 임을 swagger 로 확인했다 — `DeleteCourse` 만 `courseId` 를
 * 쓰는 네이밍 불일치가 있어(`api-spec.md` B-12) 지점도 같은지 짚었고, 지점은 해당
 * 없다.
 *
 * 🔴 **사용 중 코스가 있는 지점(`usedCount > 0`)을 프론트에서 선제 차단하지 않는다.**
 * "사용 중이면 삭제 불가" 가 실제 서버 규칙인지 **미실측**이고(OQ-022-B), 추측으로
 * 막으면 되는 동작을 막는다(A1). 호출하고 서버가 거부하면 그 사유를 노출한다.
 *
 * ⚠️ 성공 응답 형태 미실측 + OQ-022-A·J 함정은 `addPoint.ts` 주석과 동일하다.
 */

const DELETE_POINT_PATH = '/api/v1/Point/W/sign/DeletePoint'

export const deletePoint = async (pointSeq: number): Promise<void> => {
  await api.delete(DELETE_POINT_PATH, { params: { pointSeq } })
}
