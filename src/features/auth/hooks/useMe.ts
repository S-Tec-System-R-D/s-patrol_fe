import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type { MeDto, MeRaw } from '@/features/auth/types/me'

/**
 * 본인 정보 훅.
 * - 엔드포인트: `GET /api/auth/me` (data-model.md §4-3)
 * - 응답은 axios 인터셉터가 unwrap → `MeRaw` 페이로드.
 * - 화면에는 `MeDto`로 변환(필요 필드만)해 노출.
 * - 401이면 인터셉터가 refresh 흐름 처리(useMe는 변환만 책임).
 * - queryKey 표준 `['auth','me']` — `<RequireRole>` 등 공유 소비자가 동일 캐시 사용.
 */

const ME_PATH = '/api/auth/me'

const toMeDto = (raw: MeRaw): MeDto => ({
  id: raw.id,
  name: raw.name,
  role: raw.role,
  groupName: raw.groupName,
  locationName: raw.locationName,
})

const fetchMe = async (): Promise<MeRaw> => {
  // 인터셉터가 ApiResponse를 unwrap하여 response.data는 페이로드 그대로.
  // 다만 axios 응답 타입은 wrapper 시그니처라 cast.
  const res = await api.get<ApiResponse<MeRaw>>(ME_PATH)
  return res.data as unknown as MeRaw
}

export const meQueryKey = ['auth', 'me'] as const

export const useMe = () =>
  useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    select: toMeDto,
  })
