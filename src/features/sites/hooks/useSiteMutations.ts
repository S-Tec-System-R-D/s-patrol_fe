import { useMutation, useQueryClient } from '@tanstack/react-query'

import { groupKeys } from '@/features/groups/queryKeys'
import { notify } from '@/lib/notify'
import { addSite } from '../api/addSite'
import { deleteSite } from '../api/deleteSite'
import { updateSite } from '../api/updateSite'
import { siteKeys } from '../queryKeys'
import type { AddSiteRequest, UpdateSiteRequest } from '../types/site'

/**
 * 사업장 추가 · 정보 수정 · 헬스체크 · 삭제 (`spec 044` T783).
 *
 * - 🔴 **비옵티미스틱** — 서버가 새 `siteSeq` 를 주지 않는다. 성공·실패 모두 다시 받는다
 *   (실패 중 "사업장이 존재하지 않습니다." 는 남이 먼저 지운 경우라 재조회가 곧 정리다).
 * - 🔴 사업장이 바뀌면 **목록(`GetGroupList`) 과 좌측 패널(`AdminSiteSelect`) 둘 다** 무효화한다 — 패널의 지사 행 개수도 사업장 수다.
 * - 🔴 **실패 토스트는 여기서 띄우지 않는다** — 전역 `MutationCache.onError` 가 서버 문구로 띄운다(409 · (D) 문자열 포함).
 */

const useInvalidateSites = () => {
  const queryClient = useQueryClient()
  return (siteSeq?: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: groupKeys.list }),
      queryClient.invalidateQueries({ queryKey: groupKeys.tree }),
      siteSeq === undefined ? null : queryClient.invalidateQueries({ queryKey: siteKeys.detail(siteSeq) }),
    ])
}

export const useAddSite = () => {
  const invalidate = useInvalidateSites()
  return useMutation({
    mutationFn: (body: AddSiteRequest) => addSite(body),
    onSuccess: () => notify.success('사업장을 추가했습니다.'),
    onSettled: () => invalidate(),
  })
}

/** 정보 수정(이름 · 소속 그룹 · 주소 · 연락처) — 🔴 연락처를 지우려면 호출부가 `tel: ""` 를 싣는다 */
export const useUpdateSiteInfo = () => {
  const invalidate = useInvalidateSites()
  return useMutation({
    mutationFn: (body: UpdateSiteRequest) => updateSite(body),
    onSuccess: () => notify.success('사업장 정보를 수정했습니다.'),
    onSettled: (_, __, body) => invalidate(body.siteSeq),
  })
}

/**
 * 헬스체크 저장 · 켜기 · 끄기. 목록에는 헬스체크가 없어(B-55 — 있어도 항상 `false`) 상세만 다시 받는다.
 * 문구는 켜기/끄기/설정 저장이 달라 호출부가 준다.
 */
export const useUpdateHealthCheck = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body }: { body: UpdateSiteRequest; successMessage: string }) => updateSite(body),
    onSuccess: (_, { successMessage }) => notify.success(successMessage),
    onSettled: (_, __, { body }) => queryClient.invalidateQueries({ queryKey: siteKeys.detail(body.siteSeq) }),
  })
}

/** 🔴 하위 사업장 · 지점까지 함께 지워진다(B-54) — 확인창은 호출부 책임 */
export const useDeleteSite = () => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateSites()
  return useMutation({
    mutationFn: (siteSeq: number) => deleteSite(siteSeq),
    onSuccess: (_, siteSeq) => {
      // 지운 상세를 다시 부르면 400 이다 — 무효화가 아니라 버린다
      queryClient.removeQueries({ queryKey: siteKeys.detail(siteSeq) })
      notify.success('사업장을 삭제했습니다.')
    },
    onSettled: () => invalidate(),
  })
}
