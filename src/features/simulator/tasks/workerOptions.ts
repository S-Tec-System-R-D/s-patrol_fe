import type { SimSiteUser } from '../types'
import type { SiteData } from './types'

/** `codeSeq` 7 = 현장 근무자 */
const FIELD_WORKER = 7

/** 작업 대상이 될 수 있는 근무자 — 앱 서버에 로그인되는 사람만 */
export const readyWorkers = ({ users, readyLoginIds }: SiteData): SimSiteUser[] =>
  users.filter((user) => user.codeSeq === FIELD_WORKER && readyLoginIds.includes(user.loginId))
