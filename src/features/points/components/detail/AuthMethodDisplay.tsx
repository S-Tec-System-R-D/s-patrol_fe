import { QrCodeIcon, NfcIcon } from 'lucide-react'
import type { PointAuthenticationMethod } from '@/features/points/types'

interface Props {
  /**
   * `null` 이면 **아무것도 그리지 않는다**(호출부가 별도 안내를 그린다).
   *
   * 서버 `authMethod` 가 미실측 코드(9·10 외)일 때 `toAuthMethodLabel` 이 `null` 을
   * 주므로 그것을 그대로 받을 수 있게 넓혔다 — 추측으로 한쪽을 고르지 않는다(A1).
   * 🔴 **정수를 받게 바꾸지는 않는다**(`spec 022` tasks 제약 2) — 변환은 호출부에서 한다.
   */
  value: PointAuthenticationMethod | null
}

/**
 * 지점 상세의 인증수단 **값 표시**.
 *
 * 🔴 **027 에서 세그먼트를 버렸다.** 이전에는 `AuthMethodSelector`(폼 필드)와 **똑같이
 * 생긴** QR/NFC 2칸을 그리고 선택된 쪽만 강조했다 — 클릭만 안 될 뿐 **토글로 보였다.**
 * 조회 화면에서 **선택되지 않은 값(NFC)을 보여줄 이유가 없고**, 그것이 오히려 "바꿀 수
 * 있는 것" 이라는 오해를 만든다. 지금은 **현재 값 하나만** 그린다.
 *
 * 폼의 선택 UI 는 `form/fields/AuthMethodSelector` 가 계속 담당한다 — 역할이 갈렸다.
 */
const AuthMethodDisplay = ({ value }: Props) => {
  if (value === null) return null

  const Icon = value === 'QR' ? QrCodeIcon : NfcIcon

  return (
    /* 🔴 **행 높이에 맞춘 크기다.** 기본정보 행 안에 들어가므로 다른 값(평문 텍스트)과
       같은 줄에 서야 한다 — `px-3 py-1.5` 는 행보다 커서 그 줄만 튀어 보였다(2026-10-10). */
    <span className="inline-flex w-fit items-center gap-1 rounded-sm border border-point/40 bg-point/5 px-1.5 py-0.5 text-[11px] font-semibold leading-5 text-point">
      <Icon size={12} />
      {value}
    </span>
  )
}

export default AuthMethodDisplay
