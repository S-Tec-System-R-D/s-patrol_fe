import { PlusIcon, QrCodeIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import { getSiteName } from '@/lib/auth/site'

import ZoneRow from './ZoneRow'
import DetailSection from './DetailSection'
import DetailRow from './DetailRow'
import AuthMethodDisplay from './AuthMethodDisplay'
import { PendingSection, PendingValue } from './PendingBlock'
import { resolveAuthMethodLabel, toAuthMethodLabel } from '../../lib/authMethod'
import type { PointDetail as PointDetailData } from '../../types'

/**
 * 지점 상세의 **본문** (`spec 027` Phase 2).
 *
 * ⚠️ 타입 `PointDetail` 과 이름이 같아 타입을 `PointDetailData` 로 받는다.
 * 타입명은 `api-spec.md` 실측 이름을 따른다(`CLAUDE.md` B4).
 *
 * 🔴 **순수 표시 컴포넌트다.** 제목·상태 뱃지·수정/삭제 액션은 **페이지**가 갖는다
 * (`PointDetailPage`). 상세가 패널이던 시절에는 한 덩어리였지만, 페이지가 되면서
 * "이 지점이 무엇인가"(헤더)와 "그 내용"(본문)의 주인이 갈렸다.
 *
 * 🔴 **섹션마다 카드를 나눈다**(사용자 결정 2026-10-08). 한 카드에 다 담으면 전체 폭에서
 * 세 덩어리의 경계가 흐려진다 — 기본정보·인증수단·소속 코스는 **읽는 목적이 다르고**
 * 길이도 제각각이다. `xl` 이상 2단, 미만 1단(`design-system.md` §2-5).
 *
 * **"지점명" 행은 페이지 제목과 중복이지만 의도적으로 둔다**(사용자 결정 2026-10-08) —
 * 기본정보 블록만 따로 읽거나 캡쳐할 때 이름이 없으면 무엇의 정보인지 알 수 없다.
 * 반면 **"사용여부" 는 제목 옆 뱃지**로 올라가 본문에 두지 않는다(상태는 한 곳에서만).
 * **생성일 행도 없다**: 서버 응답에 `createdAt` 이 없다(OQ-022-I, 실측 확인).
 * 대신 서버가 주는 **최근 순찰**을 보여준다.
 * ⚠️ 목업(`지점관리-신규.png`)에는 생성일이 있어 **갈라진 지점**이다(OQ-027-B).
 */

/** 섹션 카드 — 경계를 나누는 것이 목적이라 공용으로 뽑지 않고 여기 둔다(A6) */
const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>{children}</div>
)

const PointDetail = ({ point }: { point: PointDetailData }) => {
  const method = toAuthMethodLabel(point.authMethod)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <DetailSection title="기본정보">
          {/* 🔴 목업은 8칸 2열이다. **4칸은 서버에 없어 placeholder** 로 둔다 —
              지우면 "설계에 없던 것" 이 되어 나중에 다시 논의해야 한다(OQ-027-E) */}
          <div className="grid grid-cols-1 gap-x-10 xl:grid-cols-2">
            {/* 제목과 중복이지만 **의도적으로 둔다**(사용자 결정 2026-10-08) — 기본정보
                블록만 따로 읽거나 캡쳐할 때 이름이 없으면 무엇의 정보인지 알 수 없다 */}
            <DetailRow label="지점명" value={point.name} />
            <PendingValue label="지점 코드" />

            {/* 사업장명은 서버 응답이 아니라 **선택 결과**에서 온다(spec 021) */}
            <DetailRow label="사업장" value={getSiteName() ?? '-'} />
            <PendingValue label="상세 위치" />

            <DetailRow label="설명" value={point.memo?.trim() || '-'} />
            {/* 🔴 인증 수단을 기본정보로 녹였다(사용자 결정 2026-10-10) — 값 하나뿐인
                섹션을 따로 둘 이유가 없다. 우측 카드는 **수단별 자격증명**을 맡는다.
                ⚠️ "최근 순찰" 은 통계 칸에 있어 여기서 뺐다(같은 값 두 번) */}
            <DetailRow label="인증수단" value={<AuthMethodDisplay value={method} />} />

            <PendingValue label="등록" />
            <PendingValue label="최근 수정" />
          </div>
        </DetailSection>
      </Card>


      <Card>
        <div className="flex items-start justify-between gap-4">
          <DetailSection title="소속 코스" description="이 지점이 포함된 순찰 코스입니다.">
            {null}
          </DetailSection>
          {/* 🔴 비활성 + 사유. 코스 편성 API 는 `spec 023` 이다 — 버튼을 아예 빼면
              "그런 기능이 없는 것" 으로 읽히고, 누를 수 있게 두면 아무 일도 안 일어난다 */}
          <AppButton
            icon={PlusIcon}
            variant="sub"
            className="bg-card"
            disabled
            title="코스 편성은 순찰코스 화면(준비 중)에서 지원됩니다"
          >
            코스에 추가
          </AppButton>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {point.courseList.length === 0 ? (
            <span className="text-caption text-muted-foreground">
              소속된 코스가 없습니다. 코스에 추가하면 근무자의 순찰 경로에 이 지점이
              포함되고, 인증 기록이 쌓이기 시작합니다.
            </span>
          ) : (
            point.courseList.map((course) => (
              <ZoneRow key={course.courseSeq} title={course.courseName} />
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

/**
 * 지점 **자격증명 카드** — 인증수단에 따라 다른 것을 보여준다(사용자 결정 2026-10-10).
 *
 * 🔴 **"인증 수단" 섹션은 기본정보로 녹였다.** 값 하나(QR/NFC)뿐인 섹션을 따로 둘 이유가
 * 없었다. 이 카드는 **그 수단이 실제로 쓰는 자격증명**을 맡는다 — 역할이 갈렸다.
 *
 * | 수단 | 보여주는 것 | 상태 |
 * |---|---|---|
 * | **NFC** | TAG ID | ✅ **실 데이터**(`nfcTagId` 는 서버에 있다) |
 * | **QR** | QR 이미지·식별자·발행정보 | 🔲 placeholder — 발행 메타가 없고(B-23) 생성은 별도 작업(OQ-022-D) |
 * | 미실측 코드 | 안내 문구 | — |
 *
 * 🔴 **NFC 는 placeholder 가 아니다.** 022 에서 `nfcTagId` 를 실측했고 화면에 뜬다.
 * QR 만 막혀 있는데 둘을 같은 "준비 중" 으로 묶으면 **되는 것까지 안 되는 것처럼** 보인다.
 */
export const PointCredentialCard = ({ point }: { point: PointDetailData }) => {
  const method = toAuthMethodLabel(point.authMethod)

  if (method === 'NFC') {
    return (
      <Card>
        <DetailSection title="NFC 태그" description="근무자 단말이 이 태그를 읽어 인증합니다.">
          {point.nfcTagId ? (
            <DetailRow label="TAG ID" value={<span className="font-mono">{point.nfcTagId}</span>} />
          ) : (
            /* ⚠️ 서버가 NFC 지점의 TAG ID 를 강제하지 않는다(B-13) — 실 데이터에 존재한다 */
            <span className="text-caption text-muted-foreground">
              태그 ID가 등록되지 않았습니다. 수정에서 14자리 HEX를 입력해주세요.
            </span>
          )}
        </DetailSection>
      </Card>
    )
  }

  if (method === 'QR') {
    return (
      <PendingSection
        title="QR 코드"
        icon={QrCodeIcon}
        reason="QR 이미지·식별자·발행 정보(발행일·버전)와 다운로드·인쇄는 아직 없습니다. 서버에 발행 메타가 없고(B-23) QR 생성은 별도 작업입니다(OQ-022-D)."
      />
    )
  }

  // 9·10 외 미실측 코드 — 추측 라벨을 만들지 않는다(A1)
  return (
    <Card>
      <DetailSection title="인증 자격증명">
        <span className="text-caption text-muted-foreground">
          {resolveAuthMethodLabel(point.authMethod, point.authMethodName) ||
            '인증수단 정보를 확인할 수 없습니다.'}
        </span>
      </DetailSection>
    </Card>
  )
}

export default PointDetail
