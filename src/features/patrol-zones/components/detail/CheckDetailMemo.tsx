import { useState } from 'react'
import { ImageOffIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'

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
 * 그래서 "누가 언제" 는 **그 행의 `userName`·`checkDt`** 로 대체한다. 메모가 여러 건이어도
 * 행이 하나이므로 **메타는 패널 머리에 한 번만** 적는다 — 메모마다 반복하면 같은 값이
 * 여러 번 찍히고, 메모별로 다른 값인 것처럼 읽힌다.
 *
 * ✅ **시각은 `checkDt` 가 있으면 보여준다**(OQ-15 해소 2026-10-19). `checkDt` 는 **지점
 * 인증 시간**이고(사용자 DB 확인), 겹치던 시각은 테스트 환경 탓이었다. 인증 내역 표와 같은
 * 규칙이다. ⚠️ **"그 시각에 메모를 썼다" 는 뜻이 아니다** — 메모에는 작성 시각이 없고,
 * 이 줄은 **그 지점을 인증한 시각**이다.
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

/** `'2026-05-01T10:06:00'` → `'10:06'` — 같은 회차라 날짜는 헤더가 이미 말한다 */
const formatTime = (value: string): string => value.slice(11, 16)

interface CheckDetailMemoProps {
  /** 🔴 **행을 그대로 받는다** — 메타(`userName`·`checkDt`·`authMethod`)가 행에 있고, 쪼개면 prop 이 5개가 된다 */
  row: CheckDetailRow
}

const CheckDetailMemo = ({ row }: CheckDetailMemoProps) => {
  /* ✅ **`checkDt` 가 있으면 올린다**(OQ-15 해소 — 표와 같은 규칙) */
  const checkedAt = row.checkDt

  return (
    /* 🔴 **바탕·가로 패딩을 바깥에 맡긴다** — 표의 펼침 칸(036)도 카드(037)도 자기 여백을
       이미 갖고 있다. 여기서 또 주면 **박스 안의 박스**가 된다 */
    <div className="flex flex-col gap-3">
      {/**
       * 🔴 메타는 **패널 머리에 한 번만** — 메모마다 반복하면 메모별로 다른 값처럼 읽힌다.
       *
       * 🔴 **뱃지로 띄운다**(사용자 요청 2026-10-20). 회색 글자 한 줄이면 **메모 본문과 같은
       * 무게**로 흘러가 "누가·언제" 가 본문의 첫 줄처럼 읽혔다 — 뱃지는 그것이 **본문이 아니라
       * 꼬리표**임을 모양으로 말한다.
       * ⚠️ **두 surface 모두 바꾼다** — 같은 뜻을 화면마다 다른 모양으로 두면 036·037 중
       * 한쪽만 고쳐진다. 🔴 코스 상세의 캡쳐는 **영향이 없다**(메모 행은 접힌 상태로 찍힌다).
       *
       * ⚠️ **"그 시각에 메모를 썼다" 는 뜻이 아니다** — 메모에는 작성 시각이 없고, 이 값은
       * **그 지점을 인증한 시각**(`checkDt`)이다.
       */}
      <span className="w-fit">
        <AppBadge variant="muted">
          {/* 값 없음은 하이픈이다(`design-system.md` §4-5A) */}
          {row.userName ?? '-'}
          {checkedAt !== null && ` · ${formatTime(checkedAt)}`}
        </AppBadge>
      </span>

      {/**
       * 🔴 **메모는 배열이다 — 건마다 경계를 준다**(2026-10-20).
       *
       * 실측은 **1건만 관측**됐지만(`memos`/`memoList` 모두) 구조가 배열이라 여러 건이 올 수
       * 있다. 간격(`gap`)만으로 가르면 **두 메모가 한 덩어리 글로 읽힌다.**
       *
       * 🔴 **경계는 왼쪽 포인트 바가 말한다**(사용자 결정 2026-10-20 — 036 의 회색 패널을
       * 걷어내고 037 의 모양으로 **합쳤다**). 전에는 `surface` prop 으로 두 모양이 갈렸는데,
       * 036 이 같은 모양으로 오면서 **분기가 죽었다** — 쓰지 않는 갈래를 남기면 다음 사람이
       * 어느 쪽이 기본인지 매번 따져야 한다(A6).
       *
       * ⚠️ **같은 바인데 뜻이 다르다.** 최근 인증 목록(037)에서 포인트 바는 **"지금 보고 있는
       * 행"** 이고, 여기서는 **"기록 1건"** 이다 — 한 화면 안에서 섞이지 않는 이유는 **카드가
       * 다르기** 때문이다(선택이 있는 목록 vs 내용 그 자체).
       */}
      <ul className="flex flex-col gap-3">
        {row.memos.map((memo) => (
          <li
            key={memo.memoSeq}
            /**
             * 🔴 **바탕 없이 왼쪽 바만 둔다**(사용자 결정 2026-10-20).
             *
             * 전에는 연한 포인트 채움을 함께 썼는데, **색이 두 군데서 말하면 둘 다 약해진다**:
             * 열린 행이 하늘색을 들고 본문 안의 기록도 하늘색이면 **경계가 번진다.** 색은
             * **머리 행**이, 기록 1건의 경계는 **바**가 맡는다.
             * ⚠️ **`whitespace-pre-line` 과 함께 봐야 한다** — 채움이 없을수록 들여쓰기가
             * 유일한 경계라 왼쪽 패딩을 남긴다.
             */
            className="flex flex-col gap-2 border-l-2 border-l-point pl-3"
          >
            {/* 🔴 `whitespace-pre-line` — 줄바꿈이 들어온 메모를 한 줄로 뭉개지 않는다 */}
            <p className="whitespace-pre-line text-body text-foreground">{memo.memo}</p>
            <MemoAttaches memo={memo} />
          </li>
        ))}
      </ul>
    </div>
  )
}

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
 */
const MemoAttach = ({ attach }: { attach: CheckDetailAttach }) => {
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
          className="flex size-24 flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-border bg-card px-1 text-center"
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
          className="size-24 rounded-sm border border-border object-cover"
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
