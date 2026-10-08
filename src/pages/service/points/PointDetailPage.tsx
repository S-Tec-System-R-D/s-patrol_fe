import { ArrowLeftIcon, MapPinIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import PointDetail from '@/features/points/components/detail/PointDetail'
import { usePointDetail } from '@/features/points/hooks/usePointDetail'
import { paths } from '@/router/paths'

/**
 * 순찰지점 상세 — **라우트로 분리된 페이지** (`spec 027` Phase 1).
 *
 * 027 전까지 상세는 `/points` 안의 우측 패널이었고 선택 상태가 `useState` 였다 →
 * **새로고침하면 날아가고** 딥링크·뒤로가기가 없었다. 이제 `pointSeq` 가 URL 에 있다.
 *
 * ⚠️ **본 Phase 는 최소 골격이다.** 기존 `PointDetail` 카드를 그대로 얹었고, 헤더·액션
 * 풋터·섹션 재배치는 Phase 2(T312~T315)에서 한다. 지금 함께 바꾸면 "라우트 전환" 과
 * "UI 재설계" 가 한 커밋에 섞여 무엇이 깨졌는지 분리할 수 없다.
 *
 * 🔴 **없는 `pointSeq` 를 `/404` 로 보내지 않는다**(spec §4). 서버는 400 + 래퍼
 * (`"잘못된 요청입니다."`)를 주는데, 이는 "경로가 없다" 가 아니라 **삭제됐거나 다른
 * 사업장의 지점**이라는 뜻이다. 목록으로 돌아갈 수단과 함께 안내한다.
 */
const PointDetailPage = () => {
  const { pointSeq: pointSeqParam } = useParams<{ pointSeq: string }>()
  const navigate = useNavigate()

  // URL 세그먼트는 문자열이다. 숫자가 아니면 조회하지 않는다(`/points/abc`).
  const parsed = Number(pointSeqParam)
  const pointSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = usePointDetail(pointSeq)

  return (
    <div className="flex flex-col gap-4 p-8">
      <Link
        to={paths.service.points}
        className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon size={14} />
        목록으로
      </Link>

      {detail.data ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* 🔴 삭제 성공 시 목록으로 돌아간다 — 상세가 페이지라 그 자리에 머물 수 없다.
              실패 시에는 호출되지 않으므로 화면이 그대로 유지된다(spec 규칙 13). */}
          <PointDetail
            point={detail.data}
            onDeleted={() => navigate(paths.service.points, { replace: true })}
          />
        </div>
      ) : detail.isPending && pointSeq !== null ? (
        <AppPageHeader title="지점 정보를 불러오는 중" subtitle="잠시만 기다려주세요" />
      ) : (
        <AppEmpty
          icon={pointSeq === null ? MapPinIcon : TriangleAlertIcon}
          title="지점을 찾을 수 없습니다"
          description={
            pointSeq === null
              ? '주소가 올바르지 않습니다. 목록에서 다시 선택해주세요.'
              : (detail.error?.message ?? '삭제되었거나 접근할 수 없는 지점입니다.')
          }
        />
      )}
    </div>
  )
}

export default PointDetailPage
