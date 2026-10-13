import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updatePoint } from '../api/updatePoint'
import { pointKeys } from '../queryKeys'
import type { AuthMethod } from '@/types/enum'
import { toAuthMethodCode } from '../lib/authMethod'

/**
 * 지점 **인증수단 전환** (`spec 029` T411).
 *
 * 🔴 **방향이 비대칭이다 — 서버가 그렇게 생겼다**(WF-1-0 실측 2026-10-13):
 * - `NFC → QR` : `authMethod: 9` 만 보내면 된다
 * - `QR → NFC` : `nfcTagId` 가 **없으면 400**(`"NFC 값을 입력해주세요."`)
 *
 * 그래서 이 훅은 **NFC 로 갈 때 `nfcTagId` 를 필수로 받는다**(타입에서 막는다). 호출부가
 * 깜빡해도 컴파일이 안 되게 하는 것이 요점이다 — 서버 400 은 마지막 방어선이다.
 *
 * 🔴 **QR 로 갈 때는 `nfcTagId` 를 보내지 않는다.** 어차피 서버가 `null`·`''` 을 무시해
 * **지울 수 없고**(B-15), 보내 봐야 "지우려 했는데 안 지워진" 흔적만 남는다. 남은 값은
 * **화면에서 보여주지 않는 것**으로 다룬다(`spec.md` §3 규칙 4).
 *
 * 🔴 **옵티미스틱이 아니다.** 응답 전까지 스위치는 이전 값에 머문다 — 눌린 즉시 바뀌면
 * TAG ID 입력을 취소했을 때 **서버와 화면이 어긋난 채 남는다**(코스 토글과 같은 규약,
 * `patterns.md` §10-B).
 *
 * 🔴 **`name` 을 보내지 않는다.** `UpdatePoint` 는 진짜 부분 갱신이라(실측) 생략한 필드는
 * 유지된다. 전환이 이름을 건드릴 이유가 없다.
 */

type ChangeAuthMethodInput =
  | { to: Extract<AuthMethod, 'QR'> }
  | { to: Extract<AuthMethod, 'NFC'>; nfcTagId: string }

export const useChangeAuthMethod = (pointSeq: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ChangeAuthMethodInput) =>
      updatePoint({
        pointSeq,
        authMethod: toAuthMethodCode(input.to),
        nfcTagId: input.to === 'NFC' ? input.nfcTagId : undefined,
        // 재발행은 이 동작과 무관하다. 🔴 애초에 서버에서 **동작하지 않는다**(B-37)
        reissueQrYn: false,
      }),
    onSuccess: async () => {
      // 목록에도 인증수단 컬럼이 있다 — 상세만 갱신하면 목록이 옛 값을 보여준다.
      // 🔴 상세는 루트가 'point' 라 `lists` 접두사에 걸리지 않는다(`queryKeys.ts` 규약 4)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pointKeys.lists }),
        queryClient.invalidateQueries({ queryKey: pointKeys.detail(pointSeq) }),
      ])
    },
  })
}
