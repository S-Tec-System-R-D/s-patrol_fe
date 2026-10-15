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

/**
 * 🔴 **TAG ID 규칙의 단일 출처**(`spec 029` T408). 소비처가 **셋**이 됐다:
 * 추가 폼 · 수정 폼 · **인증수단 전환 모달**. 같은 규칙을 세 군데에 적으면 한 곳만
 * 고쳐지고 나머지는 남는다 — 022 가 "에러 바인딩 복붙" 으로 겪은 것과 같은 종류다.
 */
const NFC_TAG_ID_REQUIRED = 'NFC TAG ID를 입력해주세요.'
const NFC_TAG_ID_FORMAT = '14자리 HEX로 입력해주세요. (예: 04A1B2C3D4E5F6)'

/** 값이 반드시 있어야 하는 자리(전환 모달·NFC 지점의 수정 폼) */
const requiredNfcTagId = z
  .string()
  .min(1, NFC_TAG_ID_REQUIRED)
  .regex(NFC_TAG_ID_PATTERN, NFC_TAG_ID_FORMAT)

export const pointSchema = z
  .object({
    name: z.string().min(2, '두 글자 이상 입력해주세요.'),
    description: z.string(),
    // 메시지를 붙인 이유: 수정 폼이 미실측 코드(9·10 외)를 **미선택**으로 열어(A1)
    // 처음으로 "선택 안 함" 이 실제 경로가 됐다. 기본 영문 메시지가 화면에 뜬다.
    authenticationMethod: z.enum(['QR', 'NFC'], { error: '인증수단을 선택해주세요.' }),
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
      error: NFC_TAG_ID_FORMAT,
      path: ['nfcTagId'],
    }
  )

export type FormDataType = z.infer<typeof pointSchema>

/**
 * **인증수단 전환 모달** 스키마 (`spec 029` T409).
 *
 * 🔴 **QR → NFC 전환에만 쓴다.** 서버가 `authMethod: 10` 을 `nfcTagId` 없이 받으면
 * **400** 을 준다(WF-1-0 실측) — 즉 "TAG ID 없이 NFC 로 바꾸기" 는 **존재하지 않는
 * 경로**다. 이 스키마가 그 경로를 코드에서 막는 1차 방어선이고, 서버 400 은 마지막
 * 방어선이다. 반대 방향(NFC → QR)은 받을 값이 없어 스키마가 없다.
 */
export const authSwitchSchema = z.object({
  nfcTagId: requiredNfcTagId,
})

export type AuthSwitchFormData = z.infer<typeof authSwitchSchema>

/**
 * **수정 폼** 스키마 — 추가 폼과 **같은 스키마**를 쓴다(`pointSchema`).
 *
 * 🔴 **029 의 `makeEditPointSchema(isNfc)` 를 걷어냈다**(재측정 2026-10-15). 당시에는
 * 수단이 폼 밖(서버값)에 있어 필수 여부를 인자로 받아야 했는데, 이제 수정 폼도 수단을
 * 직접 고르므로 **`refine` 이 폼 값만 보고 판단할 수 있다** — 함수로 만들 이유가 사라졌다.
 *
 * 🔴 **수단을 수정 폼에 되돌린 이유**: 서버는 `authMethod` 가 **함께 와야** `nfcTagId` 를
 * 처리한다. 안 보내면 **무시하고 200** 을 준다(실측) — 029 의 "authMethod 를 보내지 않는다"
 * 는 **TAG ID 가 조용히 저장되지 않는 버그**였다. 수단을 보내려면 폼이 그 값을 알아야 한다.
 *
 * ⚠️ 상세 카드의 전환 스위치는 **그대로 둔다**(중복 허용, 사용자 결정 2026-10-15).
 * 나중에 한쪽을 뺀다.
 */
// 수정 폼은 `pointSchema` 와 `FormDataType` 을 그대로 쓴다 — 별칭을 만들지 않는다
// (같은 것에 이름이 둘이면 어느 쪽이 진짜인지 매번 확인해야 한다).

/** 추가 폼 기본값. 수정 폼은 상세 응답을 직접 `defaultValues` 로 넣는다 */
export const pointFormDefaults: FormDataType = {
  name: '',
  description: '',
  authenticationMethod: 'QR',
  nfcTagId: '',
  useYn: true,
}
