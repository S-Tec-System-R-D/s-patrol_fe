import z from 'zod'

/**
 * 순찰지점 폼 스키마 — 추가·수정 공용.
 *
 * 필드명은 **폼 내부 이름**이고 서버 DTO와 다르다(`description` → `memo`,
 * `authenticationMethod` → `authMethod` 정수). 변환은 제출 직전에 한 번만 한다
 * (`lib/authMethod.ts` / `spec 022` §3 규칙 5).
 *
 * 🔴 **`useYn` 은 `AddPointDto` 의 required 다.** 022 전까지 폼에 없어서 추가하면
 * 서버가 요구하는 값을 보내지 못했다(`screens.md:75` 도 "지점사용" 을 폼 필드로 명시).
 */

/**
 * NFC TAG ID — **14자리 HEX**.
 *
 * `screens.md:75` 가 요구하고 mock 데이터도 전부 14자 HEX 다. 022 전까지는
 * `z.string()` + "NFC 인데 비어 있으면" refine 뿐이라 **형식 검증이 없었다** — 아무
 * 문자열이나 통과했다.
 *
 * ⚠️ 대소문자를 모두 받되 서버 전송 시 변환하지 않는다. 서버가 대문자만 받는지
 * **미실측**이고, 실측 없이 값을 바꾸면 사용자가 입력한 것과 저장된 것이 달라진다(A1).
 */
const NFC_TAG_ID_PATTERN = /^[0-9A-Fa-f]{14}$/

export const pointSchema = z
  .object({
    name: z.string().min(2, '두 글자 이상 입력해주세요.'),
    description: z.string(),
    authenticationMethod: z.enum(['QR', 'NFC']),
    nfcTagId: z.string(),
    useYn: z.boolean(),
  })
  .refine((data) => !(data.authenticationMethod === 'NFC' && !data.nfcTagId), {
    error: 'NFC TAG ID를 입력해주세요.',
    path: ['nfcTagId'],
  })
  // 값이 있을 때만 형식을 본다 — 비어 있는 경우는 위 refine 이 전담한다(메시지 중복 방지).
  .refine(
    (data) =>
      !(
        data.authenticationMethod === 'NFC' &&
        data.nfcTagId &&
        !NFC_TAG_ID_PATTERN.test(data.nfcTagId)
      ),
    {
      error: '14자리 HEX로 입력해주세요. (예: 04A1B2C3D4E5F6)',
      path: ['nfcTagId'],
    }
  )

export type FormDataType = z.infer<typeof pointSchema>

/** 추가 폼 기본값. 수정 폼은 상세 응답으로 덮는다(T266) */
export const pointFormDefaults: FormDataType = {
  name: '',
  description: '',
  authenticationMethod: 'QR',
  nfcTagId: '',
  useYn: true,
}
