import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  MegaphoneIcon,
  PinIcon,
  SquarePenIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import NoticeContentCard from '@/features/notice/components/detail/NoticeContentCard'
import NoticeForm from '@/features/notice/form/NoticeForm'
import { useNoticeDetail } from '@/features/notice/hooks/useNoticeDetail'
import { paths } from '@/router/paths'

/**
 * 공지 상세 (`spec 026` US2).
 *
 * 🔴 **머리는 다른 상세와 같고 몸은 한 열이다** — 브레드크럼 → 머리 줄(제목·핀·부제·액션)은
 * 코스/지점(027·029)·순찰이력(036·037) 상세와 같은 모양이고, 그 아래는 **내용 카드 하나**다
 * (본문 → 이미지 → 첨부파일). 다른 상세는 값이 여러 갈래라 2열이지만 공지는 **읽을 글 하나**다.
 *
 * 🔴 **조회 중과 "없음" 을 구분한다** — 빈 상태가 단정하면 조회 중에 그것이 뜨는 순간 사용자는
 * 방금 지운 줄 안다(023 T375 선례).
 *
 * ⚠️ 수정·삭제는 **UI 만** 있고 저장은 mock 이다(변경계 전환은 별도 spec).
 */

const Breadcrumb = () => (
  <nav aria-label="현재 위치" className="flex items-center gap-1 text-caption">
    <Link to={paths.service.notice} className="text-muted-foreground hover:text-foreground">
      공지사항
    </Link>
    <ChevronRightIcon size={13} className="text-muted-foreground/60" />
    <span className="font-medium text-foreground">공지 상세</span>
  </nav>
)

/** 🔴 실패 화면에서는 브레드크럼이 **빠져나갈 길로 읽히지 않는다** — 복귀 수단을 따로 둔다(023) */
const BackToList = () => (
  <Link
    to={paths.service.notice}
    className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
  >
    <ArrowLeftIcon size={14} />
    공지사항 목록으로
  </Link>
)

/** `'2026-05-28T10:30:00'` → `'2026-05-28 10:30'` */
const formatDateTime = (value: string): string => value.replace('T', ' ').slice(0, 16)

const NoticeDetailPage = () => {
  const navigate = useNavigate()
  const { noticeSeq: raw } = useParams<{ noticeSeq: string }>()
  const parsed = Number(raw)
  /* 🔴 숫자가 아니면 **요청하지 않는다** — 주소가 잘못된 것이고 서버 400 을 기다릴 이유가 없다 */
  const noticeSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = useNoticeDetail(noticeSeq)

  /**
   * 🔴🔴 **주소 오류를 로딩보다 먼저 분기한다**(037 T557 이 잡은 결함). `noticeSeq` 가 `null`
   * 이면 쿼리가 `enabled: false` 라 **영원히 `isPending`** 이다 — 로딩 분기에 걸리면 요청도
   * 안 나갔는데 스켈레톤이 끝까지 남는다.
   */
  if (noticeSeq === null) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Breadcrumb />
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="공지를 불러오지 못했습니다"
            description="주소가 올바르지 않습니다."
          />
          {/* 🔴 "다시 시도" 를 주지 않는다 — 같은 주소로 또 실패한다 */}
          <div className="flex justify-center pb-6">
            <BackToList />
          </div>
        </div>
      </div>
    )
  }

  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Breadcrumb />
        <div className="h-9 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Breadcrumb />
        <div className="rounded-lg border border-border bg-card">
          {/* 🔴 **"삭제되었다" 고 단정하지 않는다** — 네트워크·권한·없는 번호가 모두 여기로 온다 */}
          <AppEmpty
            icon={TriangleAlertIcon}
            title="공지를 불러오지 못했습니다"
            description={detail.error?.message}
          />
          <div className="flex flex-col items-center gap-3 pb-6">
            <AppButton variant="sub" onClick={() => void detail.refetch()}>
              다시 시도
            </AppButton>
            <BackToList />
          </div>
        </div>
      </div>
    )
  }

  const notice = detail.data

  return (
    <div className="flex flex-col gap-4 p-8">
      <Breadcrumb />

      <AppPageHeader
        title={notice.title}
        icon={MegaphoneIcon}
        /* 🔴 **기본정보 카드를 없애고 부제 한 줄로 올렸다**(사용자 결정 2026-10-20). 카드 4행 중
           고정은 제목 옆 핀이, 첨부 수는 이미지·첨부파일 카드 제목이 이미 말해서 **남는 것이
           작성자·작성일시뿐**이었다 — 카드 하나를 차지할 분량이 아니다 */
        subtitle={`${notice.userName} · ${formatDateTime(notice.createDt)}`}
        // 상태는 제목 옆, 액션은 헤더 맨 우측 — 성격이 달라 자리를 섞지 않는다(027 승계)
        // 🔴 고정은 **핀 아이콘**이다 — 목록의 핀 열과 같은 표식(사용자 요청 2026-10-20)
        titleSuffix={
          notice.isPin ? (
            <PinIcon size={16} className="text-point" aria-label="고정 공지" />
          ) : undefined
        }
        action={
          /* 🔴 **수정도 헤더에 둔다** — 지점(029)은 "고치려는 값을 보여주는 카드에 수단을
             둔다" 지만, 공지의 수정 대상은 **제목(헤더)과 본문(카드)에 걸쳐** 있어 어느 한
             카드에 속하지 않는다 */
          <div className="flex items-center gap-2">
            <AppDialog
              title="공지 수정"
              description="공지 내용을 수정할 수 있습니다."
              trigger={
                <AppButton icon={SquarePenIcon} variant="sub" className="bg-card">
                  수정
                </AppButton>
              }
            >
              <NoticeForm notice={notice} />
            </AppDialog>
            <AppAlertDialog
              size="sm"
              icon={Trash2Icon}
              variant="destructive"
              title="공지를 삭제하시겠습니까?"
              description="삭제된 공지는 복구할 수 없습니다."
              // ⚠️ mock — 실제 삭제 없이 목록으로 돌아간다(변경계 전환 spec 에서 연결)
              onAction={() => navigate(paths.service.notice)}
            >
              <AppButton icon={Trash2Icon} variant="destructive" className="bg-card">
                삭제
              </AppButton>
            </AppAlertDialog>
          </div>
        }
      />

      {/* 🔴 **한 열, 카드 하나**(사용자 결정 2026-10-20) — 본문 → 이미지 → 첨부파일.
          2열을 둘 이유(기본정보 카드)가 사라졌다. 근거는 `NoticeContentCard` 머리말 */}
      <NoticeContentCard notice={notice} />
    </div>
  )
}

export default NoticeDetailPage
