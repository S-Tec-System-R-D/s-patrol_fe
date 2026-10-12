import z from 'zod'

/**
 * 순찰코스 폼 스키마 — 생성·수정 **공용** (`spec 023` Phase 4).
 *
 * 🔴 **필드가 명칭·설명 둘뿐이다**(사용자 결정 — 생성 모달은 명칭·설명만). 이유가
 * 생성과 수정에서 각각 다르다:
 * - **생성**: `AddCourse` 가 `points` 를 **무시**한다(B-27). 모달에서 지점을 묻고
 *   보내면 `pointCount: 0` 으로 만들어지면서 **200 이 오는** — 성공으로 보이는 반쪽
 *   결과가 된다. 편성은 생성 후 상세에서 한다.
 * - **수정**: 편성·활성화·교대 허용은 **상세에 각자의 자리**가 있다(편집 모드 · 토글
 *   2종). 모달에 또 두면 같은 값을 두 곳에서 고치게 된다.
 *
 * 🔴 **"총 소요시간" 입력을 두지 않는다.** 실측(B-31)에서 `totalMin: null` 을 보내면
 * 서버가 **구간시간 합으로 채운다** — 즉 파생 값이다. 입력란을 만들면 지점 합과 다른
 * 값을 쓸 수 있고(서버가 검사하지 않는다) 화면의 총 소요시간이 **거짓이 된다**.
 *
 * ⚠️ `useYn`·`switchYn` 도 폼에 없다. 생성 시에는 기본값으로 나가고(활성·교대 미허용),
 * 바꾸는 것은 상세의 확인 모달을 거친다(규칙 11).
 */

export const courseSchema = z.object({
  // 지점 폼과 같은 하한을 쓴다(`features/points/form/schema.ts`) — 다른 규칙을 만들지 않는다
  name: z.string().min(2, '두 글자 이상 입력해주세요.'),
  description: z.string(),
})

export type CourseFormDataType = z.infer<typeof courseSchema>

/**
 * 생성 폼 기본값. 수정 폼은 상세 응답을 직접 `defaultValues` 로 넣는다
 * (022 가 "수정 폼인데 빈 값에서 시작" 하던 것을 고친 뒤의 선례).
 */
export const courseFormDefaults: CourseFormDataType = {
  name: '',
  description: '',
}
