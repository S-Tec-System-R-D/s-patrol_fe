import { SquarePenIcon } from 'lucide-react'

import AppDetailRow from '@/components/app/AppDetailRow'
import AppLinkButton from '@/components/app/AppLinkButton'
import { getSiteName } from '@/lib/auth/site'

import ZoneRow from './ZoneRow'
import DetailSection from './DetailSection'
import AuthMethodDisplay from './AuthMethodDisplay'
import PointCredentialSwitch from './PointCredentialSwitch'
import PointQrCode from './PointQrCode'
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

/**
 * 좌표 표시. 🔴 **둘 중 하나라도 없으면 `-`** — 위도만 있는 좌표는 지도에 찍을 수 없다.
 * 소수점 4자리면 **약 11m** 로, 건물 안 지점을 구분하기에 충분하고 읽기도 편하다.
 */
const formatCoords = ({ gpsLat, gpsLng }: PointDetailData): string =>
  gpsLat === null || gpsLng === null ? '-' : `${gpsLat.toFixed(4)}, ${gpsLng.toFixed(4)}`

const PointDetail = ({ point, onEdit }: { point: PointDetailData; onEdit?: () => void }) => {
  const method = toAuthMethodLabel(point.authMethod)

  return (
    <Card>
      {/* 🔴 **수정 버튼이 이 카드로 왔다**(`spec 029` T413, 사용자 결정 2026-10-13) —
            코스 상세와 같은 규칙이다. 고치려는 값을 **보여 주는 카드**에 수단을 둔다.
            헤더에는 `삭제` 만 남는다(지점 전체에 대한 동작이라 어느 카드에도 속하지 않는다) */}
        <DetailSection
          title="기본정보"
          action={
            onEdit && (
              /* 코스 상세와 같은 링크형 [수정](`048`, 사용자 결정 2026-10-26) */
              <AppLinkButton icon={SquarePenIcon} aria-label="기본정보 수정" onClick={onEdit}>
                수정
              </AppLinkButton>
            )
          }
        >
          {/* 🔴 **placeholder 4개를 치웠다**(`spec 029`, 사용자 결정 2026-10-13).
              027 은 목업 8칸 중 4칸을 "서버에 없어 placeholder" 로 뒀는데(OQ-027-E),
              **그 논의를 했다**:
              - `지점 코드` — 서버에 없고, 식별은 지점명으로 한다
              - `등록`·`최근 수정` — 생성·수정 메타가 없다(B-19). 🔴 **그래서 B-19 도
                철회한다** — 받을 자리를 없애 놓고 요청만 남겨 두지 않는다(B-34·B-29 선례)
              - `상세 위치` — **좌표로 대체한다.** 이건 서버에 **실제로 있는 값**이다
              이 카드는 **우측 1열**로 옮겨졌으므로 2열 그리드도 뺀다(좁은 칸에서 라벨·값이
              둘 다 좁아져 줄바꿈된다 — 코스 `CourseInfo` 가 같은 이유로 1열이다).
              🔄 **행은 `between` 이다**(`spec 050`) — 우측 1열이라 `fixed` 가 필요 없다.
              ⚠️ 자격증명 카드의 `TAG ID` 는 이번 범위 밖이라 `fixed` 그대로다 */}
          <div className="flex flex-col">
            {/* 제목과 중복이지만 **의도적으로 둔다**(사용자 결정 2026-10-08) — 기본정보
                블록만 따로 읽거나 캡쳐할 때 이름이 없으면 무엇의 정보인지 알 수 없다 */}
            <AppDetailRow label="지점명" value={point.name} />

            {/* 사업장명은 서버 응답이 아니라 **선택 결과**에서 온다(spec 021) */}
            <AppDetailRow label="사업장" value={getSiteName() ?? '-'} />

            {/* 🔴 **좌표는 표시만 한다**(사용자 결정 2026-10-13, A안). 편집은 `spec 032`
                (지도)에서 "좌표 없는 지점을 어떻게 다룰지" 와 **함께** 정한다 — 서버에
                범위 검증이 없어(B-33, `lat: 123` 전례) 입력을 열면 프론트가 검사를
                떠안아야 하고, 그 규칙은 지도 쪽 결정과 한 몸이다.
                ⚠️ 실데이터에 **`null` 인 지점이 섞여 있다** — 없으면 `-` 다 */}
            <AppDetailRow label="좌표" value={formatCoords(point)} />

            <AppDetailRow label="설명" value={point.memo?.trim() || '-'} />
            {/* 🔴 인증 수단을 기본정보로 녹였다(사용자 결정 2026-10-10) — 값 하나뿐인
                섹션을 따로 둘 이유가 없다. 우측 카드는 **수단별 자격증명**을 맡는다.
                ⚠️ "최근 순찰" 은 통계 칸에 있어 여기서 뺐다(같은 값 두 번) */}
            <AppDetailRow label="인증수단" value={<AuthMethodDisplay value={method} />} />
          </div>
        </DetailSection>
      </Card>
  )
}

/**
 * **소속 코스 카드** (`spec 029` — 기본정보에서 떼어냈다).
 *
 * 🔴 **좌측 열로 갔다.** 기본정보·자격증명은 "이 지점이 무엇인가" 이고, 소속 코스와 순찰
 * 기록은 **시간이 쌓이는 것**이다 — 열이 그 둘을 가른다(사용자 결정 2026-10-13).
 *
 * 🔴 **편성 진입 버튼을 두지 않는다**(사용자 결정 2026-10-13). 027이 둔 비활성
 * `코스에 추가` → `spec 023` Phase 5가 `/zones` 링크로 바꿨다가 → **없앴다.** 여기서 바로
 * 편성해 주지 못하는 이상(코스 선택 모달 + 상세 조회 + `UpdateCourse` 전량 전송 = 요청
 * 3개) 버튼은 **"다른 데 가서 하세요" 만 말하는 자리 차지**다. 아래 코스 행이 이미 코스
 * 상세로 가는 링크라 갈 길은 있다.
 */
export const PointCourseList = ({ point }: { point: PointDetailData }) => (
  <Card>
    <DetailSection title="소속 코스" description="이 지점이 포함된 순찰 코스입니다.">
      <div className="flex flex-col gap-2">
        {point.courseList.length === 0 ? (
          /* 🔴 **"인증 기록이 쌓이기 시작합니다" 를 뺐다**(사용자 결정 2026-10-13) —
             빈 상태는 **지금 무엇이 없는지**만 말하면 된다. 그 뒤에 일어날 일까지
             설명하면 안내가 아니라 홍보가 된다 */
          <span className="text-caption text-muted-foreground">
            소속된 코스가 없습니다. 코스에 추가하면 근무자의 순찰 경로에 이 지점이
            포함됩니다.
          </span>
        ) : (
          point.courseList.map((course) => (
            <ZoneRow key={course.courseSeq} courseSeq={course.courseSeq} title={course.courseName} />
          ))
        )}
      </div>
    </DetailSection>
  </Card>
)

/**
 * 지점 **자격증명 카드** — 인증수단에 따라 다른 것을 보여준다(사용자 결정 2026-10-10).
 *
 * 🔴 **029 에서 전환 스위치가 이 카드로 들어왔다.** 그 전까지 이 카드는 조회 전용이었고
 * 인증수단은 **수정 폼에서만** 바꿀 수 있었다. 이제 **보여 주는 자리에서 바꾼다** —
 * 기본정보(수정 아이콘)·코스 상세와 같은 규칙이다.
 *
 * | 수단 | 보여주는 것 | 상태 |
 * |---|---|---|
 * | **NFC** | TAG ID | ✅ 실 데이터 |
 * | **QR** | QR 이미지·식별자 | ✅ **029 에서 실물로**(`qrCode` 가 서버에 있다) |
 * | 미실측 코드 | 안내 문구 | — |
 *
 * 🔴 **지금 쓰는 수단의 자격증명만 그린다.** 전환해도 반대쪽 값이 남는다(QR→NFC 후에도
 * `qrCode` 가 남고, NFC→QR 은 프론트가 `nfcTagId` 를 보내지 않아 남는다 — 실측 2026-10-13).
 * **남은 값은 보여주지 않는다** — 쓰이지 않는 자격증명이 화면에 있으면 "둘 다 되는 지점"
 * 으로 읽힌다.
 */
export const PointCredentialCard = ({ point }: { point: PointDetailData }) => {
  const method = toAuthMethodLabel(point.authMethod)

  /**
   * 🔴 **스위치는 수단과 무관하게 항상 같은 자리에 있다.** 수단별 본문 안에 넣으면
   * 전환할 때마다 버튼 위치가 움직인다 — 방금 누른 것이 어디 갔는지 눈으로 좇게 된다.
   */
  const Switcher = (
    <PointCredentialSwitch pointSeq={point.pointSeq} authMethod={point.authMethod} />
  )

  if (method === 'NFC') {
    return (
      <Card className="flex flex-col gap-4">
        {Switcher}
        <DetailSection title="NFC 태그" description="근무자 단말이 이 태그를 읽어 인증합니다.">
          {point.nfcTagId ? (
            <AppDetailRow variant="fixed" label="TAG ID" value={<span className="font-mono">{point.nfcTagId}</span>} />
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
      <Card className="flex flex-col gap-4">
        {Switcher}
        {/* 🔴 **placeholder 가 아니라 실물이다**(T425). 027 은 "서버에 발행 메타가
            없다"(B-23)를 근거로 비워 뒀는데, **식별자(`qrCode`)는 있었다**(실측
            2026-10-13). 없는 것은 발행일·버전뿐이고 그건 이 카드가 아니라 **아직 안
            만드는 것**(재발행·인쇄)에 필요한 값이다 */}
        <DetailSection title="QR 코드" description="근무자 단말이 이 코드를 읽어 인증합니다.">
          <PointQrCode qrCode={point.qrCode} pointName={point.name} />
        </DetailSection>
      </Card>
    )
  }

  // 9·10 외 미실측 코드 — 추측 라벨을 만들지 않는다(A1)
  return (
    <Card className="flex flex-col gap-4">
      {Switcher}
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
