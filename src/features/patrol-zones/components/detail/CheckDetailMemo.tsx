import { useState } from 'react'
import { ImageOffIcon } from 'lucide-react'

import type {
  CheckDetailAttach,
  CheckDetailMemo as CheckDetailMemoData,
  CheckDetailRow,
} from '@/features/course-history/types'

/**
 * 인증 내역 행의 **메모 펼침 패널** (`spec 036` T520·T521).
 *
 * 🔴 **`spec 023` C단이 남긴 자리를 여기서 채운다.** 023 은 코스 상세의 이상 이력에
 * **사유를 쓰지 않았다** — 메모가 목록에 없어 행마다 상세 조회(N+1)였고, 내용도
 * `"[조명 고장] [누수]"` 류 **키워드 조합**이라 "왜 미인증인지" 가 아니었다. 이쪽은
 * `CheckDetails` **한 응답에 `memos` 가 함께 온다**(요청 0건 증가).
 *
 * ## 🔴 메모에는 작성자·시각이 없다
 *
 * 실측 확정(2026-10-16): `memos` = **`{memoSeq, memo, attaches}` 3필드가 전부**다.
 * 그래서 "누가" 는 **그 행의 `userName`** 으로 대체한다. 메모가 여러 건이어도 행이 하나이므로
 * **패널 머리에 한 번만** 적는다 — 메모마다 반복하면 메모별로 다른 값인 것처럼 읽힌다.
 *
 * 🔴 **시각은 적지 않는다**(사용자 결정 2026-11-05) — 인증 시각(`checkDt`)은 표 · 타임라인 · 지점 상세가 이미
 * 적고, 메모 작성 시각은 서버에 없다.
 *
 * 🔴 **코멘트형이다**(사용자 결정 2026-11-05) — 연한 바탕 하나로 영역을 나눈다. 전에는 테두리 칸 · 회색 뱃지 ·
 * 왼쪽 파란 바가 겹쳐 내용보다 틀이 먼저 보였고, 타임라인 세로선 옆에 선이 또 섰다. 이름은 작은 회색
 * 글자로 분리해 본문의 첫 줄처럼 읽히지 않게 한다.
 *
 * 🔴 **"처리 상태"(시설팀 접수 등) 칸을 만들지 않는다** — 목업에는 있었지만 **서버에
 * 필드가 없다**(A1). 빈 칸을 두면 "아직 접수 안 됨" 으로 읽힌다.
 *
 * ## 🔴🔴 사진은 받을 수 없다 — B-40
 *
 * **첨부 URL 로 파일을 받을 수 없다. 404 다**(실측 2026-10-16: 순찰 2건·공지 1건 전부,
 * 토큰 유무 무관). 응답은 절대 URL 을 정상적으로 주므로 **"데이터 있음" 으로 보인다** —
 * 폴백 없이 두면 깨진 이미지 아이콘만 뜨고 **원인을 화면에서 알 수 없다**.
 * ⚠️ 스킴이 `http` 라 운영이 HTTPS 면 **mixed content 로 차단**된다(OQ-13) — 그 경우도
 * 같은 폴백으로 떨어진다.
 *
 * ✅ **백엔드 회신 후 폴백이 저절로 사라진다** — 이미지가 뜨면 `onError` 가 안 불린다.
 * 그래서 "준비 중" 류의 문구를 쓰지 않는다(회신되면 거짓이 된다).
 */

interface CheckDetailMemoProps {
  /** 🔴 **행을 그대로 받는다** — 지점 상세도 같은 행 모양으로 넘긴다 */
  row: CheckDetailRow
}

const CheckDetailMemo = ({ row }: CheckDetailMemoProps) => (
  <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3">
    {/* 값 없음은 하이픈이다(`design-system.md` §4-5A) */}
    <p className="text-caption text-muted-foreground">{row.userName ?? '-'}</p>

    {/* 메모는 배열이다 — 여러 건이면 한 덩어리 글로 읽히지 않게 구분선을 둔다 */}
    <ul className="flex flex-col divide-y divide-border">
      {row.memos.map((memo) => (
        <li key={memo.memoSeq} className="flex flex-col gap-2 py-2 first:pt-0 last:pb-0">
          {/* 🔴 `whitespace-pre-line` — 줄바꿈이 들어온 메모를 한 줄로 뭉개지 않는다 */}
          <p className="whitespace-pre-line text-body text-foreground">{memo.memo}</p>
          <MemoAttaches memo={memo} />
        </li>
      ))}
    </ul>
  </div>
)

/** 첨부 목록. ⚠️ **`attaches` 는 nullable 이다** — 빈 배열이 아니라 `null` 이 온다 */
const MemoAttaches = ({ memo }: { memo: CheckDetailMemoData }) => {
  const attaches = memo.attaches ?? []
  if (attaches.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {attaches.map((attach) => (
        <li key={attach.attachSeq}>
          <MemoAttach attach={attach} />
        </li>
      ))}
    </ul>
  )
}

/**
 * 첨부 1장. 🔴 **`onError` 폴백이 이 컴포넌트의 존재 이유다**(B-40).
 *
 * 실패 상태를 **첨부마다** 들고 있어야 한다 — 패널 단위로 묶으면 한 장이 404 일 때
 * 나머지 멀쩡한 사진까지 폴백으로 가린다(회신 후 일부만 복구되는 경우가 실재할 수 있다).
 *
 * 🔴 **export 한다**(`spec 026` 공지 이미지 카드) — 폴백 썸네일을 두 벌로 만들면 B-40 회신
 * 때 한쪽만 고쳐진다(037 이월 ⑤ 가 예고한 형태: 컴포넌트만 꺼내고 배치는 소비처가 정한다).
 */
export const MemoAttach = ({ attach }: { attach: CheckDetailAttach }) => {
  const [failed, setFailed] = useState(false)

  return (
    /**
     * 🔴 **파일명을 썸네일 아래 적는다**(목업 `코스상세 - 지점인증내역 수정안`, 2026-10-20).
     * 전에는 `alt`·`title` 에만 있어 **마우스를 올려야 보였다** — 사진이 여러 장이면 어느
     * 것이 무엇인지 화면에서 구분이 안 된다.
     *
     * ⚠️ **목업의 촬영 시각(`10:24`)은 적을 수 없다** — 첨부에 시각 필드가 없다
     * (`attachSeq`·`imagePath`·`fileName`·`fileExt` 가 전부). 지어내지 않는다(A1).
     */
    <figure className="flex w-24 flex-col gap-1">
      {failed ? (
        <div
          className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-card px-1 text-center"
          /* 🔴 파일명을 `title` 에도 둔다 — 캡션이 잘려도 어느 파일이 실패했는지 알 수 있어야
             백엔드에 전달된다 */
          title={attach.fileName}
        >
          <ImageOffIcon size={18} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
          <span className="text-[10px] leading-tight text-muted-foreground">
            이미지를 불러올 수 없습니다
          </span>
        </div>
      ) : (
        <img
          src={attach.imagePath}
          alt={attach.fileName}
          loading="lazy"
          className="size-24 rounded-md border border-border object-cover"
          // 🔴 404·mixed content·네트워크 실패를 한 분기로 모은다 — 사용자가 할 수 있는 일이 같다
          onError={() => setFailed(true)}
        />
      )}
      <figcaption className="truncate text-label text-muted-foreground" title={attach.fileName}>
        {attach.fileName}
      </figcaption>
    </figure>
  )
}

export default CheckDetailMemo
