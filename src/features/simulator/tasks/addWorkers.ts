import { addWorker } from '../api/build'
import { fetchSiteUsers } from '../api/siteData'
import { loginIdRange, nextLoginId, nextNameIndex } from '../lib/numbering'
import { number, text, type SimTask } from './types'

/** `codeSeq` 7 = 현장 근무자 */
const FIELD_WORKER = 7
/** 사업장에 근무자가 하나도 없을 때의 시작 아이디 — 테스트 사업장 대역(`600101`~)을 따른다 */
const FALLBACK_START_ID = '600101'

/**
 * 근무자 일괄 추가 (`spec 082` US2).
 * 그 사업장 근무자의 가장 큰 아이디 다음부터 만든다. 비밀번호는 공통 비밀번호다.
 * 🔴 아이디는 **서버 전체에서** 유일해야 한다 — 다른 사업장이 쓰는 번호면 400 으로 멈춘다(시작 아이디를 바꿔 다시 실행).
 */
export const addWorkersTask: SimTask = {
  id: 'add-workers',
  group: '구축',
  name: '근무자 일괄 추가',

  fields: ({ users }) => {
    const workers = users.filter((user) => user.codeSeq === FIELD_WORKER)
    return [
      { type: 'number', name: 'count', label: '인원', default: 3, min: 1, max: 50 },
      {
        type: 'text',
        name: 'startId',
        label: '시작 아이디',
        default: nextLoginId(workers.map((worker) => worker.loginId), FALLBACK_START_ID),
        hint: '숫자 6자리. 이 번호부터 차례로 만듭니다.',
      },
      { type: 'text', name: 'prefix', label: '이름 접두어', default: '근무자' },
    ]
  },

  validate: (values) => {
    if (!/^\d{6}$/.test(text(values, 'startId'))) return '시작 아이디는 숫자 6자리여야 합니다.'
    if (!text(values, 'prefix')) return '이름 접두어를 입력해 주세요.'
    const count = number(values, 'count')
    if (!Number.isInteger(count) || count < 1 || count > 50) return '인원은 1~50 사이여야 합니다.'
    return null
  },

  summary: (values) => `${number(values, 'count')}명 · ${text(values, 'startId')}~`,

  run: async (ctx, values, { site, users }) => {
    const count = number(values, 'count')
    const prefix = text(values, 'prefix')
    const loginIds = loginIdRange(text(values, 'startId'), count)
    const firstIndex = nextNameIndex(users.map((user) => user.userName), prefix)

    ctx.setProgress(0, count)
    for (const [index, loginId] of loginIds.entries()) {
      const name = `${prefix}${firstIndex + index}`
      // 전화번호는 형식만 맞춘 가짜 값이다 — 아이디에서 만든다
      await ctx.step(`근무자 추가 · ${loginId} ${name}`, () =>
        addWorker(site.siteSeq, { loginId, name, phone: `01000${loginId}` })
      )
      ctx.setProgress(index + 1, count)
    }

    // 응답에 만든 번호가 없다 — 목록을 다시 읽어 확인한다
    await ctx.step(
      '목록 확인',
      async () => {
        const after = await fetchSiteUsers(site.siteSeq)
        const found = loginIds.filter((loginId) => after.some((user) => user.loginId === loginId))
        if (found.length !== loginIds.length) {
          throw new Error(`목록에 ${found.length}/${loginIds.length}명만 보입니다`)
        }
        return found.length
      },
      (found) => `${found}명 확인`
    )
  },
}
