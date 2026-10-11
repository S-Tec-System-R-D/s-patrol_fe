import api from '@/lib/axios'

/**
 * 순찰코스 삭제.
 *
 * `DELETE /api/v1/Course/W/sign/DeleteCourse?courseId=`
 *
 * 🔴🔴 **파라미터 이름이 `courseId` 다. `courseSeq` 가 아니다.**
 * 이 프로젝트의 ID 는 전부 `~Seq` 접미사라(`CLAUDE.md` B4) 이 하나만 예외고, 그래서
 * **틀리기 가장 쉬운 자리**다. `courseSeq` 로 보내면 **400 ProblemDetails**
 * (`errors.courseId`)가 온다 — 래퍼가 아니라 형태까지 달라진다(B-12 / 실측 §5-1-B).
 * 🔴 **함수 인자 이름도 `courseId` 로 둔다** — 호출부에서 변환이 보이게 해서
 * `{ courseSeq }` 를 그대로 넘기는 실수를 타입이 잡게 한다.
 *
 * ✅ **실측 완료(2026-10-10, WF-1-0)**: 성공은 200 + `data: true`.
 * 🔴 **편성된 지점이 있어도 거부하지 않는다.** 코스가 지워지고 편성도 함께 사라진다 —
 * "사용 중이라 못 지운다" 는 서버 규칙이 **없다**(지점의 `DeletePoint` 도 동일, OQ-10).
 * 따라서 프론트에서 선제 차단하지 않는다(A1 — 없는 규칙을 만들지 않는다).
 */

const DELETE_COURSE_PATH = '/api/v1/Course/W/sign/DeleteCourse'

export const deleteCourse = async (courseId: number): Promise<void> => {
  await api.delete(DELETE_COURSE_PATH, { params: { courseId } })
}
