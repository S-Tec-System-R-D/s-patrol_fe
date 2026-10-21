/**
 * 공지 첨부 선택 규칙 (`spec 040` T666).
 *
 * 서버의 첨부 거부는 사유 없는 400 이라(B-17) **고르는 단계에서** 막는다. 기준은 실측(2026-10-21,
 * `api-spec.md` §5-1-B) — 공식값은 OQ-19 로 묻고 있다.
 */

/** 실측 통과 확장자. `bmp`·`exe` 는 거부 확인, `hwp`·`mp4` 는 미확정이라 넣지 않는다 */
export const NOTICE_ATTACH_EXTS = [
  'png', 'jpg', 'jpeg', 'gif', 'webp',
  'pdf', 'xlsx', 'docx', 'pptx', 'zip', 'txt', 'csv',
] as const

export const NOTICE_ATTACH_ACCEPT = NOTICE_ATTACH_EXTS.map((ext) => `.${ext}`).join(',')

/**
 * 첨부 합계 상한 — 28MB.
 *
 * 🔴 실측은 20MB 통과 · 29MB 거부. 요청 **전체**가 약 30,000,000 바이트에서 잘리는 것으로 보인다
 * (ASP.NET Kestrel 기본 `MaxRequestBodySize` 와 같은 값). 제목·본문·multipart 경계도 그 안에 들어가므로
 * 파일 합계는 여유를 두고 28MB(29,360,128 바이트)로 막는다.
 */
export const NOTICE_ATTACH_MAX_BYTES = 28 * 1024 * 1024

const extOf = (name: string) => name.slice(name.lastIndexOf('.') + 1).toLowerCase()

export const isAllowedNoticeAttach = (name: string): boolean =>
  name.includes('.') && (NOTICE_ATTACH_EXTS as readonly string[]).includes(extOf(name))

/**
 * 고른 파일을 지금 목록에 더한다. 허용 밖 확장자는 빼고, 합계 상한을 넘기면 **이번 선택 전체를** 받지
 * 않는다(일부만 붙으면 어떤 파일이 빠졌는지 알기 어렵다).
 */
export const addNoticeAttaches = (
  current: File[],
  picked: File[]
): { files: File[]; error: string | null } => {
  const rejected = picked.filter((file) => !isAllowedNoticeAttach(file.name))
  const allowed = picked.filter((file) => isAllowedNoticeAttach(file.name))
  const total = [...current, ...allowed].reduce((sum, file) => sum + file.size, 0)
  if (total > NOTICE_ATTACH_MAX_BYTES) {
    return { files: current, error: '첨부 파일은 합계 28MB까지 올릴 수 있습니다.' }
  }
  return {
    files: [...current, ...allowed],
    error:
      rejected.length > 0
        ? `올릴 수 없는 형식입니다: ${rejected.map((file) => file.name).join(', ')}`
        : null,
  }
}

/** `1.2 MB` · `340 KB` */
export const formatFileSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
