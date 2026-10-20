/**
 * 근무자 표시 헬퍼 (`spec 038` T602).
 */

/**
 * 연락처 하이픈 — 서버는 `01012345678` 로 준다.
 *
 * 🔴 **형식이 아니면 원문 그대로** 돌려준다 — 모르는 형식을 억지로 자르면 틀린 번호가 화면에
 * 나온다. 이미 하이픈이 있으면 그대로다.
 */
export const formatPhone = (phone: string): string => {
  const digits = phone.trim()
  if (/^\d{11}$/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (/^\d{10}$/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

/** 근무 상태 라벨 — 서버 `workYn` */
export const workLabel = (workYn: boolean): string => (workYn ? '근무 중' : '근무 종료')
