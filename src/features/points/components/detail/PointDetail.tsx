import { CopyIcon, SquarePenIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppDetailRow from '@/components/app/AppDetailRow'
import AppLinkButton from '@/components/app/AppLinkButton'
import { getSiteName } from '@/lib/auth/site'
import { notify } from '@/lib/notify'
import { paths } from '@/router/paths'

import DetailSection from './DetailSection'
import PointMiniMap from './PointMiniMap'
import PointQrCode from './PointQrCode'
import { resolveAuthMethodLabel, toAuthMethodLabel } from '../../lib/authMethod'
import type { PointDetail as PointDetailData } from '../../types'

/**
 * 지점 상세 **속성 패널** (`spec 076` — 시안 개선 B, 이전 `spec 027` · `029` 기본정보 · 자격증명 카드).
 *
 * ⚠️ 타입 `PointDetail` 과 이름이 같아 타입을 `PointDetailData` 로 받는다.
 *
 * 🔄 **076 에서 카드 셋(소속 코스 · 기본정보 · 자격증명)을 패널 하나로 합쳤다**: 지도(등록 좌표) →
 * `기본정보 [수정]` → 인증수단 · 소속 코스 · 사업장 · 설명 · 좌표 · TAG ID(또는 QR 내려받기).
 * - 🔴 **지점명 행을 뺐다**(D4) — 027 은 "캡처할 때 이름이 없으면 무엇의 정보인지 모른다" 로
 *   뒀는데, 패널 바로 위가 이름 머리라 시안대로 뺀다.
 * - 🔴 **QR/NFC 전환 스위치를 뺐다**(076 범위) — 인증수단은 `수정` 창에서 바꾼다(이미 있다).
 * - 🔴 **QR 은 여전히 화면에 그리지 않는다**(029 보안) — 시안은 NFC 지점만 그렸고, QR 지점은
 *   TAG ID 자리에 내려받기 버튼을 둔다.
 * - 🔴 `수정` 은 `기본정보` 제목 줄(D3) — 코스 상세(074)와 같은 규칙. 시안은 머리에 뒀다.
 */

/**
 * 좌표 표시. 🔴 **둘 중 하나라도 없으면 `-`** — 위도만 있는 좌표는 지도에 찍을 수 없다.
 * 소수점 4자리면 **약 11m** 로, 건물 안 지점을 구분하기에 충분하고 읽기도 편하다.
 */
const formatCoords = ({ gpsLat, gpsLng }: PointDetailData): string =>
  gpsLat === null || gpsLng === null ? '좌표 없음' : `${gpsLat.toFixed(4)}, ${gpsLng.toFixed(4)}`

/** TAG ID — 읽기 전용 칸 + `복사`(현장 태그를 맞춰 볼 때 손으로 옮겨 적지 않게) */
const TagIdValue = ({ tagId }: { tagId: string }) => {
  const copy = () => {
    navigator.clipboard
      ?.writeText(tagId)
      .then(() => notify.success('TAG ID를 복사했습니다.'))
      .catch(() => notify.error('복사하지 못했습니다.'))
  }

  return (
    <span className="flex items-center gap-1.5">
      <span
        title={tagId}
        className="min-w-0 truncate font-mono text-caption"
      >
        {tagId}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label="TAG ID 복사"
        className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-sub-foreground hover:bg-border"
      >
        <CopyIcon size={12} aria-hidden />
        복사
      </button>
    </span>
  )
}

/**
 * 소속 코스 — 여러 개를 세로로(시안 "복수 대응"). 줄마다 **코스 상세 링크**다 —
 * 활성여부 점 대신 링크를 준다는 023 판단 그대로(T371).
 */
const CourseListValue = ({ point }: { point: PointDetailData }) =>
  point.courseList.length === 0 ? (
    <span className="text-muted-foreground">소속된 코스가 없습니다</span>
  ) : (
    <span className="flex flex-wrap gap-x-1.5">
      {point.courseList.map((course, index) => (
        <span key={course.courseSeq}>
          <Link to={paths.service.courseDetail(course.courseSeq)} className="text-point hover:underline">
            {course.courseName}
          </Link>
          {index < point.courseList.length - 1 && <span className="pl-1.5 text-muted-foreground">·</span>}
        </span>
      ))}
    </span>
  )

const PointDetail = ({ point, onEdit }: { point: PointDetailData; onEdit?: () => void }) => {
  const method = toAuthMethodLabel(point.authMethod)

  return (
    <section className="flex min-w-0 flex-col gap-7 xl:self-start">
      {/* 🔄 `spec 084`(목업 대조): `위치` 영역 — 제목 옆에 좌표(전에는 기본정보의 한 줄이었다). 🔴 좌표는 표시만 한다(029 A안 · B-33) */}
      <DetailSection title="위치" count={formatCoords(point)}>
        <div className="overflow-hidden rounded-[10px] border border-border">
          <PointMiniMap lat={point.gpsLat} lng={point.gpsLng} name={point.name} />
        </div>
      </DetailSection>

      <div>
        <DetailSection
          title="기본정보"
          action={
            onEdit && (
              <AppLinkButton icon={SquarePenIcon} aria-label="기본정보 수정" onClick={onEdit}>
                수정
              </AppLinkButton>
            )
          }
        >
          <div className="flex flex-col">
            <AppDetailRow
              label="인증수단"
              value={
                method ? (
                  method
                ) : (
                  // 9·10 외 미실측 코드 — 추측 라벨을 만들지 않는다(A1)
                  resolveAuthMethodLabel(point.authMethod, point.authMethodName) || '인증수단 정보를 확인할 수 없습니다.'
                )
              }
            />
            <AppDetailRow label="소속 코스" value={<CourseListValue point={point} />} />
            {/* 사업장명은 서버 응답이 아니라 **선택 결과**에서 온다(spec 021) */}
            <AppDetailRow label="사업장" value={getSiteName() ?? '-'} />
            <AppDetailRow label="설명" value={point.memo?.trim() || '-'} />
            {method === 'NFC' && (
              <AppDetailRow
                label="TAG ID"
                value={
                  point.nfcTagId ? (
                    <TagIdValue tagId={point.nfcTagId} />
                  ) : (
                    /* ⚠️ 서버가 NFC 지점의 TAG ID 를 강제하지 않는다(B-13) — 실 데이터에 존재한다 */
                    <span className="text-caption text-muted-foreground">
                      태그 ID가 등록되지 않았습니다. 수정에서 14자리 HEX를 입력해주세요.
                    </span>
                  )
                }
              />
            )}
          </div>

          {/* 🔴 QR 은 그리지 않고 내려받기만(029 보안) — 행 칸이 좁아 패널 폭 전체를 쓴다 */}
          {method === 'QR' && (
            <div className="pt-2">
              <PointQrCode qrCode={point.qrCode} pointName={point.name} />
            </div>
          )}
        </DetailSection>
      </div>
    </section>
  )
}

export default PointDetail
