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
 * 🔴🔴 **`nfcTagId` 는 `authMethod` 가 함께 올 때만 처리된다**(재측정 2026-10-15).
 * `authMethod` 없이 `nfcTagId` 만 보내면 **무시하면서 200** 이 온다 — 저장된 줄 알고
 * 넘어가는 가장 나쁜 실패다. 그래서 수정 폼은 **수단을 항상 동봉**한다.
 * ⚠️ 단 `authMethod: 10`(NFC)을 **TAG ID 없이** 보내면 **400**(`"NFC 값을 입력해주세요."`)
 * 이므로 **수단과 태그는 함께** 보낸다. `authMethod: 9`(QR)는 태그 없이 200.
 *
 * `reissueQrYn` 은 `false` 고정 — **서버가 이 플래그를 보지 않는다**(재측정 2026-10-15,
 * B-37 철회 → Q6). QR 로 전환할 때 코드가 없으면 플래그와 무관하게 서버가 발급한다.
 *
 * ⚠️ 성공 응답 형태 미실측 + OQ-022-A·J 함정은 `addPoint.ts` 주석과 동일하다.
 */

const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'

export const updatePoint = async (body: UpdatePointRequest): Promise<void> => {
  await api.patch(UPDATE_POINT_PATH, body)
}
