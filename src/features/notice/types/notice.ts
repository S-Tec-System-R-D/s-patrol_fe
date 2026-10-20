export interface NoticeAttachment {
  id: string
  fileName: string
}

export interface NoticeSummary {
  id: string
  index: number
  title: string
  contentPreview: string
  authorName: string
  createdAt: string
  readByMe: boolean
  isNew: boolean
  hasAttachment: boolean
}

export interface Notice extends NoticeSummary {
  content: string
  appPushSent: boolean
  attachments: NoticeAttachment[]
}

/**
 * ── 서버 타입 (`spec 026` T568) ─────────────────────────────────────────────
 *
 * `api-spec.md` §23·24 **실측 그대로 전량** 선언한다(안 쓰는 필드도 둔다 — CLAUDE.md B4).
 *
 * ⚠️ 위의 구 타입 3종(`Notice`·`NoticeSummary`·`NoticeAttachment`)은 mock 시절 것이다.
 * 소비처를 옮긴 뒤 T589 에서 지운다 — 지금 지우면 화면 전환 전까지 빌드가 깨진다.
 */

/** `GET Notice/W/sign/GetNoticeList` 의 행 */
export interface NoticeRow {
  noticeSeq: number
  title: string
  /** 🔴 목록인데 본문 전문이 온다(B-8). 화면에 쓰지 않는다 — 미리보기 컬럼이 없다 */
  description: string
  userSeq: number
  userName: string
  isPin: boolean
  createDt: string
  attachCount: number
}

/** `GET Notice/W/sign/DetailNotice?noticeSeq=` */
export interface NoticeDetail {
  noticeSeq: number
  title: string
  description: string
  userSeq: number
  userName: string
  isPin: boolean
  createDt: string
  /** ⚠️ 이미지·파일이 **두 배열로 나뉘어** 온다. 분리 기준은 미확인(OQ-12) */
  imageList: NoticeAttach[]
  fileList: NoticeAttach[]
}

export interface NoticeAttach {
  attachSeq: number
  /** 절대 URL(`/UploadedFiles/notices/YYYYMM/...`). 🔴 지금은 **404** 다(B-40) */
  attachPath: string
  attachName: string
  /** `'.jpg'` 처럼 점을 포함한다 */
  attachExt: string
}

/** `GetNoticeList` 요청 파라미터 (swagger) */
export interface NoticeListParams {
  siteSeq: number
  /** `yyyy-MM-dd`. ⚠️ 기준 필드(`createDt`?)는 미실측 — OQ-026-C */
  fromDt?: string
  toDt?: string
  /** ⚠️ 검색 대상(제목/작성자/본문)은 미실측 — OQ-026-A */
  keyword?: string
  pageNumber: number
  pageSize: number
}
