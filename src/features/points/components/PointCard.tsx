import { ChevronRightIcon, MapPinIcon, NfcIcon, QrCodeIcon, RouteIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'

import { resolveAuthMethodLabel, toAuthMethodLabel } from '../lib/authMethod'
import type { PointRow } from '../types'

/**
 * 지점 목록의 **좁은 폭(`xl` 미만) 카드** (`spec 030` → **`spec 034` 에서 목업 A안**).
 *
 * 🔴🔴 **타일이 인증수단으로 갈린다** — QR 은 `QrCodeIcon`, NFC 는 `NfcIcon`
 * (lucide, 사용자 지정 2026-10-14). 코스 카드와 달리 **유형이 갈리므로 색이 정보**다:
 * 목록을 훑을 때 "이 지점이 QR 인가 NFC 인가" 를 **글자를 읽기 전에** 알아본다.
 *
 * 🔴 **인증수단 뱃지는 제거했다**(사용자 결정 2026-10-14 — 목업 설명대로). 타일이 이미
 * 그 일을 하는데 뱃지가 같이 있으면 **같은 정보가 한 행에 두 번**이고, 좁은 폭에서 뱃지가
 * 둘(사용 + 인증수단)이면 이름이 밀린다. 남는 뱃지는 **사용여부 하나**다.
 *
 * ⚠️ **접근성 — 색만으로 구분되는 상태를 감수한다.** `design-system.md` 는 "색·명도만으로
 * 의미를 전하지 않는다" 인데, 여기서는 **아이콘 모양이 함께 바뀌므로**(QR 격자 ↔ NFC 전파)
 * 색각 이상에서도 구분이 남는다. 그래도 라벨이 필요하면 **상세에 글자로 있다**.
 *
 * ⚠️ **미실측 코드(9·10 외)는 중립 타일** — 추측 아이콘을 만들지 않는다(A1). 이 경우
 * 목록에서는 인증수단을 알 수 없고, **상세에서 확인**한다.
 *
 * ⚠️ **"최근 순찰" 줄을 뺐다**(사용자 결정). 테이블에는 컬럼으로 남아 있다.
 */

/**
 * 카드 뱃지는 **한 단계 작다**(사용자 지적 2026-10-14). 기본 `AppBadge`(11px·px-2)는
 * 지점명과 크기가 비슷해 **이름과 뱃지가 서로 다툰다** — 카드에서 주인공은 이름이고
 * 뱃지는 곁들이는 상태다(`spec 028` 의 편성 모달에서 같은 판단을 했다).
 *
 * 🔴🔴 **`text-label`(폰트 크기 토큰)을 쓰면 안 된다.** `AppBadge` 는
 * `cn(badgeVariants(...), className)` 으로 병합하는데, **`tailwind-merge` 가 `text-label`
 * 을 글자색으로 분류해** variant 의 색(`text-success-foreground` 등)을 **지워 버린다** —
 * 뱃지 글자가 전부 검정이 된다(2026-10-14 실제로 겪었다). 임의값 `text-[10.5px]` 은
 * **폰트 크기로 인식**되어 색과 충돌하지 않는다(`spec 028` 이 같은 자리에서 쓴 방식).
 */
const CARD_BADGE = 'px-1.5 py-0.5 text-[10.5px] leading-4'

/** 인증수단 → 타일 아이콘·색. 🔴 **모르는 코드는 중립**이다 */
const tileOf = (method: 'QR' | 'NFC' | null, useYn: boolean) => {
  if (!useYn)
    return {
      Icon: method === 'NFC' ? NfcIcon : MapPinIcon,
      className: 'bg-muted text-muted-foreground',
    }
  if (method === 'QR') return { Icon: QrCodeIcon, className: 'bg-point-bg text-point' }
  if (method === 'NFC') return { Icon: NfcIcon, className: 'bg-success-bg text-success-foreground' }
  return { Icon: MapPinIcon, className: 'bg-muted text-muted-foreground' }
}

const PointCard = (point: PointRow) => {
  const method = toAuthMethodLabel(point.authMethod)
  const label = resolveAuthMethodLabel(point.authMethod, point.authMethodName)
  const { Icon, className } = tileOf(method, point.useYn)

  return (
    <div className="flex items-center gap-3">
      {/* 🔴 미사용이면 타일도 함께 가라앉는다 — 카드만 톤다운되고 타일이 밝으면
       **미사용인데 멀쩡해 보인다**(`tasks.md` 제약 4) */}
      {/* 🔴 **타일에 이름을 남긴다**(`title`·`aria-label`). 뱃지를 뺐으므로 이 타일이
          인증수단을 전하는 **유일한 요소**다 — 스크린리더에서 사라지면 안 된다 */}
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-md ${className}`}
        title={label || undefined}
        aria-label={label ? `인증수단 ${label}` : undefined}
        role={label ? 'img' : undefined}
      >
        <Icon size={20} strokeWidth={1.75} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-body font-semibold ${
              point.useYn ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {point.pointName}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {point.useYn ? (
              <AppBadge variant="success" className={CARD_BADGE}>
                사용
              </AppBadge>
            ) : (
              <AppBadge variant="muted" className={CARD_BADGE}>
                미사용
              </AppBadge>
            )}
            {/* 🔴 **인증수단 뱃지를 두지 않는다** — 타일이 같은 일을 한다(위 주석) */}
          </span>
        </div>

        <div className="flex items-center gap-1 text-caption text-muted-foreground">
          <RouteIcon size={13} strokeWidth={1.75} />
          <span className="tabular-nums">소속 코스 {point.usedCount}개</span>
        </div>
      </div>

      <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground/60" />
    </div>
  )
}

export default PointCard
