import { fetchPendingAssignments, requestAssignment } from '../api/assignment'
import type { SimSiteUser } from '../types'
import { text, type SimTask } from './types'

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** 오늘에서 `days` 일 뒤의 `YYYY-MM-DD` (이 PC 의 날짜) */
const dateAfter = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * 배치 요청 (`spec 082` US4).
 * 근무자 본인이 "다른 사업장으로 보내 달라"고 신청한다. 신청은 **받는 사업장**의 배치 화면에 뜬다.
 * 🔴 승인 · 거절은 하지 않는다 — 웹의 배치 화면에서 한다(그 화면이 테스트 대상이다).
 *
 * 근무자 줄의 "배치 요청" 버튼에서 연다 — 누구의 요청인지는 이미 정해져 있다.
 */
export const requestAssignmentTaskFor = (worker: SimSiteUser): SimTask => ({
  id: `request-assignment-${worker.loginId}`,
  group: '배치',
  name: `배치 요청 · ${worker.userName}`,

  fields: (data) => {
    const others = data.sites.filter((site) => site.siteSeq !== data.site.siteSeq)
    // 기본값이 엉뚱한 사업장이 되지 않게 **같은 그룹의 사업장을 앞에** 둔다(테스트 사업장끼리 같은 그룹이다)
    const sameGroup = others.filter((site) => site.groupPath === data.site.groupPath)
    const targets = [...sameGroup, ...others.filter((site) => !sameGroup.includes(site))].map((site) => ({
      value: String(site.siteSeq),
      label: `${site.siteName} #${site.siteSeq}`,
    }))
    return [
      {
        type: 'select',
        name: 'toSite',
        label: '받는 사업장',
        default: targets[0]?.value ?? '',
        options: targets,
        hint: '신청은 이 사업장의 배치 화면에 뜹니다. 승인 · 거절은 웹에서 합니다.',
      },
      { type: 'text', name: 'reason', label: '사유', default: '시뮬 배치 요청' },
      { type: 'text', name: 'startDate', label: '시작일', default: dateAfter(0), hint: 'YYYY-MM-DD' },
      {
        type: 'text',
        name: 'endDate',
        label: '종료일',
        default: dateAfter(7),
        hint: 'YYYY-MM-DD. 비우면 종료일 없이 신청합니다.',
      },
    ]
  },

  validate: (values) => {
    if (!text(values, 'toSite')) return '받는 사업장을 골라 주세요.'
    if (!DATE.test(text(values, 'startDate'))) return '시작일은 YYYY-MM-DD 형식이어야 합니다.'
    const endDate = text(values, 'endDate')
    if (endDate && !DATE.test(endDate)) return '종료일은 YYYY-MM-DD 형식이거나 비워야 합니다.'
    if (endDate && endDate < text(values, 'startDate')) return '종료일이 시작일보다 앞입니다.'
    return null
  },

  summary: (values, data) => {
    const target = data.sites.find((site) => String(site.siteSeq) === text(values, 'toSite'))
    return `→ ${target?.siteName ?? text(values, 'toSite')}`
  },

  run: async (ctx, values, data) => {
    const { loginId } = worker
    const toSiteSeq = Number(text(values, 'toSite'))
    const endDate = text(values, 'endDate')

    await ctx.step(`배치 요청 · ${worker.userName}`, () =>
      requestAssignment(loginId, {
        userSeq: worker.userSeq,
        fromSiteSeq: data.site.siteSeq,
        toSiteSeq,
        reason: text(values, 'reason'),
        startDt: `${text(values, 'startDate')}T00:00:00`,
        endDt: endDate ? `${endDate}T00:00:00` : null,
      })
    )

    // 응답에 신청 번호가 없다 — 받는 사업장의 대기 목록에서 찾는다
    await ctx.step(
      '받는 사업장 대기 목록 확인',
      async () => {
        const pending = await fetchPendingAssignments(loginId, toSiteSeq, 'assignment')
        const mine = pending.find((item) => item.userSeq === worker.userSeq)
        if (!mine) throw new Error('대기 목록에 신청이 보이지 않습니다')
        return mine
      },
      (mine) => `신청 #${mine.assignmentSeq} · 승인 대기`
    )
  },
})
