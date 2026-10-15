import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { DownloadIcon, QrCodeIcon, TriangleAlertIcon } from 'lucide-react'

/**
 * 지점 **QR 코드 내려받기** (`spec 029` T425~T427).
 *
 * 🔴🔴 **QR 을 화면에 그리지 않는다**(사용자 결정 2026-10-13). QR 은 "그 지점에 실제로
 * 갔다" 는 증명인데, **관리 화면에 띄워 두면 화면을 찍어 현장에 가지 않고 인증**할 수
 * 있다. 같은 이유로 **식별자 문자열도 보여주지 않는다** — 그 문자열이 곧 QR 의 내용이라,
 * 이미지를 숨기고 원문을 적으면 숨긴 의미가 없다.
 *
 * 대신 **아이콘을 누르면 PNG 로 내려받는다.** 출력해서 현장에 부착하는 것이 이 값의
 * 유일한 용도이므로, 화면에 떠 있을 이유가 없다.
 *
 * 🔴 **인코딩 값은 서버가 준 `qrCode` 그대로다** — 우리가 조합하지 않는다. 근무자 앱이
 * 읽어 인증하는 값이라 한 글자만 달라도 **다운로드는 되는데 현장에서 안 되는** 가장
 * 나쁜 실패가 된다(A1).
 *
 * 🔴 **재발행 버튼은 없다** — **서버에 이미 발급된 코드를 교체할 수단이 없다**(재측정
 * 2026-10-15). `reissueQrYn` 은 `true`/`false` 가 결과를 바꾸지 않는다. 다만 **발급 자체는
 * 정상**이다: NFC 로 만든 지점(`qrCode: null`)을 QR 로 바꾸면 **플래그와 무관하게** 서버가
 * 발급한다 — 그래서 B-37(재발행 무동작)은 **철회**하고 질문(Q6)으로만 남겼다.
 * 인쇄는 산출물 형태 협의 후(OQ-029-A) — 다운로드한 PNG 로 대신한다.
 */

/**
 * 내려받을 PNG 한 변(px).
 *
 * 🔴 **화면 크기가 아니라 인쇄 크기 기준이다.** 현장 부착물은 출력물이라 작게 만들면
 * 흐려진다. 캔버스는 **화면에 보이지 않으므로** 커도 레이아웃에 영향이 없다.
 */
const DOWNLOAD_SIZE = 512

const PointQrCode = ({ qrCode, pointName }: { qrCode: string | null; pointName: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  if (!qrCode) {
    /**
     * 🔴 **"준비 중" 이 아니라 이상 상태다.** `qrCode` 는 지점을 만들 때 서버가 자동
     * 발급한다(실측). QR 지점인데 비어 있다면 기능이 없는 게 아니라 **그 지점이 현장에서
     * 인증되지 않는다**는 뜻이다.
     */
    return (
      <div className="flex items-start gap-2 rounded-sm border border-warning/40 bg-warning-bg/40 p-3">
        <TriangleAlertIcon size={16} className="mt-0.5 shrink-0 text-warning-foreground" />
        <div className="flex flex-col gap-0.5">
          <p className="text-body font-medium">QR 코드가 발급되지 않았습니다.</p>
          <p className="text-caption text-muted-foreground">
            이 지점은 현장에서 인증할 수 없습니다. 관리자에게 문의해주세요.
          </p>
        </div>
      </div>
    )
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    // 파일명에 지점명을 넣는다 — 여러 장을 뽑아 두면 어느 지점 것인지 파일명뿐이다
    link.download = `QR_${pointName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <>
      <button
        type="button"
        onClick={download}
        aria-label={`${pointName} QR 코드 내려받기`}
        className="group flex w-full items-center gap-3 rounded-sm border border-border bg-card p-4 text-left transition-colors hover:border-point hover:bg-point/5"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-point group-hover:text-white">
          {/* 🔴 hover 에서 **아이콘 자체가 바뀐다** — 색만 바뀌면 "눌리는 것" 인지
              알기 어렵다. 다운로드 화살표가 할 일을 그대로 말한다 */}
          <QrCodeIcon size={28} strokeWidth={1.5} className="group-hover:hidden" />
          <DownloadIcon size={28} strokeWidth={1.5} className="hidden group-hover:block" />
        </span>

        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body font-semibold">QR 코드 내려받기</span>
          {/* 🔴 **왜 화면에 안 보이는지**를 말한다 — 없는 줄 알고 문의하게 두지 않는다 */}
          <span className="text-caption text-muted-foreground">
            출력해 현장에 부착합니다. 보안상 화면에는 표시하지 않습니다.
          </span>
        </span>
      </button>

      {/* 🔴 **화면 밖에서만 그린다.** `display:none` 이면 캔버스가 비어 `toDataURL` 이
          빈 이미지를 준다 — 보이지 않게 치우되 **렌더는 시킨다** */}
      <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-0">
        <QRCodeCanvas ref={canvasRef} value={qrCode} size={DOWNLOAD_SIZE} level="M" marginSize={2} />
      </div>
    </>
  )
}

export default PointQrCode
