/**
 * 공지사항 서버 타입 (`spec 026` T568).
 *
 * `api-spec.md` §23·24 **실측 그대로 전량** 선언한다(안 쓰는 필드도 둔다 — CLAUDE.md B4).
 * mock 시절 타입(`Notice`·`NoticeSummary`·`NoticeAttachment` — 읽음·신규·앱 푸시 등 서버에
 * 없는 필드를 갖고 있었다)은 T589 에서 지웠다.
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
  /** 이미지·파일이 **두 배열로 나뉘어** 온다 — 서버가 확장자/내용으로 나눈다(OQ-12 해소, 실측 2026-10-21) */
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
  /** `yyyy-MM-dd`. `createDt` 날짜 기준, **양 끝 포함**(실측 2026-10-20) */
  fromDt?: string
  toDt?: string
  /** **제목 + 본문** 부분일치. 🔴 작성자는 검색되지 않는다(실측 2026-10-20) */
  keyword?: string
  pageNumber: number
  pageSize: number
}

/**
 * `POST Notice/W/sign/AddNotice` (multipart, swagger 이름 그대로 — `spec 040` T660).
 *
 * 🔴 성공해도 **생성된 `noticeSeq` 를 주지 않는다**(`api-spec.md` §5-1-B) — 작성 후 목록에 머문다.
 */
export interface AddNoticeRequest {
  siteSeq: number
  title: string
  description: string
  isPin: boolean
  file: File[]
}

/**
 * `PATCH Notice/W/sign/UpsertNotice` 의 **화면용 모양**(`spec 040` §2-1).
 *
 * 서버의 `attachList[]` 는 삭제·추가 항목이 한 배열에 섞이고 추가는 **항목당 1파일 + `isRemove=false`
 * 필수**다(B-43). 그대로 들고 다니면 틀리기 쉬워 두 배열로 받고 `toUpsertNoticeFormData` 가 펼친다.
 */
export interface UpsertNoticeRequest {
  noticeSeq: number
  title: string
  description: string
  isPin: boolean
  removeAttachSeqs: number[]
  newFiles: File[]
}
