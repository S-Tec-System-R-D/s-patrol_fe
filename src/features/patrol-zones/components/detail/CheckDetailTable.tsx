import { Fragment, useState } from 'react'
import { ChevronDownIcon, MessageSquareTextIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge as COMPACT_BADGE } from '@/components/app/AppBadge.variants'
import AppEmpty from '@/components/app/AppEmpty'
import { checkGaps } from '@/features/course-history/lib/checkIntervals'
import { formatDuration } from '@/features/course-history/lib/elapsed'
import { pointCheckBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { AUTH_METHOD, type CheckDetailRow } from '@/features/course-history/types'

import CheckDetailMemo from './CheckDetailMemo'
import CheckDetailTimeline from './CheckDetailTimeline'

/**
 * 지점 인증 내역 (`spec 036` T513).
 *
 * 🔴🔴 **미완료를 두 종류로 구분한다** — `checkDt` 로 갈린다(실측 124건이 79 / 45 로 갈린다):
 * - **미인증**: 아예 가지 않았다. 순찰자·시각도 전부 `null`
 * - **미완료**: 순찰자·시각은 남았는데 **인증이 안 됐다**(`authMethod` 는 `null`)
 *
 * 둘을 한 뱃지로 묶으면 **"안 간 것" 과 "갔는데 인증 실패" 가 구분되지 않는다** — 관리자가
 * 해야 할 일이 다르다(전자는 순찰 누락, 후자는 태그·단말 문제일 수 있다).
 *
 * ✅ **미완료 행도 인증시각을 보여준다**(OQ-15 해소 2026-10-19). `checkDt` 는 **지점 인증
 * 시간**이고(사용자 DB 확인), 코스 `endDt` 와 겹치던 것은 **테스트 환경 탓**이었다 —
 * 모바일 개발자 책상에 태그가 전부 모여 있어 몇 초 안에 연달아 찍힌다.
 * ⚠️ 그 행들은 `authMethod` 가 **0/45** 라 **인증수단 칸만 `-`** 로 남는다 — 시각이 "갔다"
 * 를 말하고 수단이 "인증이 안 끝났다" 를 말한다(미완료 2종 구분과 같은 결).
 *
 * 🔴 **위치 컬럼을 만들지 않는다** — 층·위치 필드가 **서버 어디에도 없다**(목업에는 있다).
 *
 * 🔴 **뱃지를 한 단계 작게 쓴다**(사용자 확인 2026-10-16). 기본 `AppBadge`(11px·px-2)는
 * 행 높이가 조밀한 표에서 **지점명과 크기가 비슷해** 이름과 뱃지가 서로 다툰다 — 카드에서
 * 쓰던 `cardBadge` 와 같은 치수다(`AppBadge.variants.ts`). 한 행에 뱃지가 **최대 3개**
 * (인증수단 + 결과 + 시간초과)라 기본 크기로는 결과 칸이 줄바꿈된다.
 *
 * 🔴 **메모 행을 펼친다**(T520 — 코드베이스 **첫 펼침 UI**다. `aria-expanded` 선례 0건).
 * 펼침 패널은 **같은 `<tbody>` 안의 다음 `<tr>`** 이다 — 표 밖에 두면 행과의 연결이
 * 끊기고(스크롤·정렬에서 어긋난다) `colSpan` 으로 폭을 맞출 수도 없다.
 * 🔴 **여러 행을 동시에 펼칠 수 있다**(아코디언이 아니다). 하나만 열리게 하면 두 지점의
 * 메모를 **나란히 비교할 수 없고**, "닫으려 하지 않았는데 닫혔다" 가 된다.
 * 🔴 **펼침 버튼의 접근성 이름에 지점명을 넣는다** — 행이 여러 개라 `기록 보기` 만으로는
 * 스크린리더에서 **전부 같은 이름**이 된다(030 의 카드 접근성 사고와 같은 종류).
 *
 * 🔴 **치수는 공용 `AppTable` 에 맞춘다**(사용자 확인 2026-10-19 — 글자가 행에 비해 컸다).
 * 이 표는 `AppTable` 이 아니라 **손으로 짠 `<table>`** 이라 치수가 따로 흘렀다:
 * 본문 `text-sm`(14px, **Tailwind 기본값**)에 `py-2.5` 로, 공용 표(`text-body` 12.5px ·
 * `py-3`)보다 **글자는 크고 패딩은 좁았다**. → `text-body` + `py-3` 으로 되돌렸다.
 * 🔴 **`text-sm` 을 쓰면 안 된다** — 프로젝트는 자체 글자 토큰 체계(`--text-panel-title`
 * 14.5 / `--text-body` 12.5 / `--text-caption` 12 / `--text-label` 10.5)를 쓰고, `text-sm`
 * 은 그 밖이다. 임의로 줄이면 **다섯 번째 크기**가 생긴다.
 * ✅ 덤으로 034 의 걱정이 풀렸다 — "조밀한 표에서 지점명과 뱃지가 서로 다툰다" 가 뱃지를
 * `10.5px` 로 줄인 이유였는데, 본문이 14 → 12.5 가 되어 차이가 3.5px → **2px** 로 좁혀졌다.
 *
 * 🔴 **순번은 `orderNo` 를 그대로 쓴다.** 서버가 중복을 저장하지만(032) 그건 **편성의
 * 사실**이고, 배열 위치로 바꿔 매기면 **같은 지점을 화면마다 다른 번호**로 부른다.
 */

/** `'2026-05-01T10:06:00'` → `'10:06'` — 같은 회차라 날짜는 헤더가 이미 말한다 */
const formatTime = (value: string): string => value.slice(11, 16)

interface CheckDetailTableProps {
  rows: CheckDetailRow[]
}

const CheckDetailTable = ({ rows }: CheckDetailTableProps) => {
  /** 펼친 행의 `detailSeq`. 🔴 **복수**다 — 두 지점의 메모를 나란히 볼 수 있어야 한다 */
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  if (rows.length === 0) {
    /* 🔴 이력은 있는데 인증 행이 0건인 경우가 **실재한다**(완료인데 `checkedCount: 0`) —
       장애가 아니라 사실이므로 실패 문구를 쓰지 않는다 */
    return (
      <AppEmpty
        icon={MessageSquareTextIcon}
        title="인증 내역이 없습니다"
        description="이 회차에는 기록된 지점 인증이 없습니다."
      />
    )
  }

  const gaps = checkGaps(rows)
  const ordered = [...rows].sort((a, b) => a.orderNo - b.orderNo)

  const toggle = (detailSeq: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      // 🔴 `Set` 을 새로 만든다 — 제자리에서 고치면 참조가 같아 리렌더가 안 된다
      if (next.has(detailSeq)) next.delete(detailSeq)
      else next.add(detailSeq)
      return next
    })

  return (
    <>
      {/* 🔴 표는 `xl` 이상만 — 그 아래는 세로 타임라인(`spec 055`). 7칸 표는 좁은 폭에서 옆으로 밀어야 읽혔다 */}
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full text-body">
          <thead className="border-b bg-muted">
            <tr className="text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
              <th className="px-3 py-3 w-12">순서</th>
              <th className="px-3 py-3">순찰지점</th>
              <th className="px-3 py-3 w-20">인증수단</th>
              <th className="px-3 py-3 w-20">인증시각</th>
              <th className="px-3 py-3 w-20">구간</th>
              <th className="px-3 py-3 w-28">결과</th>
              {/* 🔴 **건수를 적으므로 칸을 넓히고 오른쪽에 붙인다**(목업 수정안 2026-10-20) —
                `사진 3 · 메모 1` + 꺾쇠가 16px 칸에 들어가지 않는다 */}
              <th className="px-3 py-3 w-32 text-right">기록</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => {
              const result = pointCheckBadge(row.status, row.checkDt, row.memos.length > 0)
              const overtime = overtimeBadge(row.overtimeYn)
              const gap = gaps.get(row.detailSeq) ?? null
              /* ✅ **`checkDt` 가 있으면 보여준다**(OQ-15 해소) — 수단이 없어도 시각은 사실이다 */
              const checkedAt = row.checkDt
              const hasMemo = row.memos.length > 0
              const isOpen = expanded.has(row.detailSeq)
              /* 🔴 **건수는 이 응답 안에 이미 있다**(요청 0건) — 메모는 배열, 사진은 메모마다의
               `attaches` 합이다. ⚠️ `attaches` 는 **nullable** 이라 `?? []` 가 필수다 */
              const memoCount = row.memos.length
              const photoCount = row.memos.reduce(
                (sum, memo) => sum + (memo.attaches?.length ?? 0),
                0
              )

              return (
                <Fragment key={row.detailSeq}>
                  {/* 🔴 **행 전체가 토글이다**(사용자 결정 2026-10-19 — 아이콘 클릭에서 바꿨다).
                    아이콘만 누를 수 있으면 **과녁이 16px** 이라 조준해야 하고, 행을 눌렀는데
                    아무 일도 안 일어나면 "고장" 으로 읽힌다.
                    🔴 **`<tr>` 에 `aria-expanded` 를 둔다** — ARIA 의 `row` 롤이 지원하는
                    속성이라 표 의미를 깨지 않는다. 안쪽에 `button` 을 중첩하면 **같은 토글이
                    두 개**가 되고 클릭이 겹친다(`stopPropagation` 을 들고 다녀야 한다).
                    🔴 **키보드로도 열려야 한다** — `tabIndex` + Enter/Space. `<tr onClick>` 만
                    두면 마우스 전용이 된다.
                    ⚠️ **메모 0건 행은 아무것도 걸지 않는다** — 포커스도 안 가고 커서도 안 바뀐다.
                    눌릴 것처럼 보이는데 안 눌리는 것이 안 눌리게 보이는 것보다 나쁘다 */}
                  <tr
                    /* 🔴 **펼친 행에 색을 깐다**(목업 수정안 2026-10-20). 여러 행을 동시에 펼칠
                     수 있어 패널만 보고는 **어느 행에 딸린 기록인지** 눈이 못 따라간다 —
                     아래 패널과 같은 톤이라 둘이 한 덩어리로 읽힌다 */
                    className={`border-b last:border-0 ${
                      hasMemo ? 'cursor-pointer hover:bg-muted/50' : ''
                    } ${isOpen ? 'bg-point-bg' : ''}`}
                    {...(hasMemo && {
                      tabIndex: 0,
                      'aria-expanded': isOpen,
                      'aria-label': `${row.pointName} 기록 ${isOpen ? '접기' : '펼치기'}`,
                      onClick: () => toggle(row.detailSeq),
                      onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        // Space 는 페이지를 스크롤한다 — 토글로 쓰는 동안은 막는다
                        event.preventDefault()
                        toggle(row.detailSeq)
                      },
                    })}
                  >
                    {/* 🔴 **순번을 칩으로 세운다**(목업 수정안 2026-10-20) — 맨 숫자는 인증시각·구간
                      같은 **다른 숫자들과 같은 무게**로 흘러가 순서가 읽히지 않았다.
                      ⚠️ 번호가 건너뛰어 보이는 것은 정상이다 — `orderNo` 는 **편성의 사실**이고
                      서버가 중복·결번을 그대로 준다(032). 배열 위치로 다시 매기면 같은 지점을
                      화면마다 다른 번호로 부른다 */}
                    <td className="px-3 py-3">
                      <span
                        /* 🔴 **`leading-none` 이 빠지면 숫자가 위로 뜬다**(사용자 확인 2026-10-20).
                         `text-label` 은 **글자 크기만 정하는 토큰**이라 줄높이는 `body` 의
                         **1.4 를 그대로 물려받는다** — 10.5px 글자에 14.7px 짜리 줄상자가 생기고,
                         `place-items-center` 는 **그 줄상자**를 가운데 두므로 숫자 자체는
                         반쪽 여백만큼 올라간다. 칩처럼 **글자 하나를 가두는 자리**에서는 줄높이를
                         글자에 맞춰야 중앙이 맞는다 */
                        /* ⚠️ **칩은 열림 상태로 색을 바꾸지 않는다**(2026-10-20) — 열린 행이
                         `bg-point-bg` 를 입는 순간 **같은 색 칩이 행에 묻힌다.** 열렸다는 것은
                         행 전체 색과 꺾쇠가 이미 두 번 말하므로 칩까지 거들 필요가 없다 */
                        className="grid size-6 place-items-center rounded-full bg-muted text-label font-medium leading-none tabular-nums text-muted-foreground"
                      >
                        {row.orderNo}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{row.pointName}</td>
                    <td className="px-3 py-3">
                      {/* 🔴 미인증·미완료 행은 `authMethod` 가 `null` 이다 — 빈 칸이 아니라 `—` */}
                      {row.authMethod === AUTH_METHOD.QR ? (
                        <AppBadge variant="point" className={COMPACT_BADGE}>
                          QR
                        </AppBadge>
                      ) : row.authMethod === AUTH_METHOD.NFC ? (
                        <AppBadge variant="success" className={COMPACT_BADGE}>
                          NFC
                        </AppBadge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                      {checkedAt === null ? '-' : formatTime(checkedAt)}
                    </td>
                    {/* 🔴 **`whitespace-nowrap` 이다.** `formatDuration` 이 `1시간 20분` 처럼 **공백이
                      있는 값**을 만들고 `<th>` 가 `w-20`(80px) 이라, 브라우저가 그 공백에서 줄을
                      끊었다(사용자 확인 2026-10-19). 폭을 늘려 맞추면 값 길이를 추측하는 셈이다 —
                      끊지 말라고 하면 컬럼이 **필요한 만큼** 늘어난다 */}
                    <td className="px-3 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                      {gap === null ? '-' : `+${formatDuration(gap)}`}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <AppBadge variant={result.variant} className={COMPACT_BADGE}>
                          {result.label}
                        </AppBadge>
                        {/* 🔴 결과와 **독립 축**이라 병기한다(목록과 같은 규칙) */}
                        {overtime && (
                          <AppBadge variant={overtime.variant} className={COMPACT_BADGE}>
                            {overtime.label}
                          </AppBadge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {hasMemo ? (
                        /* 🔴 **표시 전용이다 — 버튼이 아니다.** 행 전체가 토글이므로 안쪽에
                         버튼을 두면 같은 일을 하는 과녁이 두 개가 된다(위 `<tr>` 주석).
                         🔴 **꺾쇠가 열림/닫힘을 말한다** — 건수만으로는 "기록이 있다" 까지만
                         전달되고 **눌러서 펼칠 수 있다는 사실이 안 보인다**.
                         🔴 **아이콘 대신 건수다**(목업 수정안 2026-10-20) — 메시지 아이콘은
                         "뭔가 있다" 까지만 말했다. 펼치기 전에 **얼마나 있는지**를 알면
                         어느 행을 열지 고를 수 있다. ⚠️ 목록(`ZoneColumn`)은 **그대로 아이콘**이다
                         — 거기는 응답에 `hasMemo` boolean 뿐이라 셀 수가 없다 */
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap text-warning-foreground">
                          <span className="tabular-nums">
                            {/* 사진이 없는 메모가 흔하다 — 0 을 적지 않는다("사진 0" 은 빈 값이다) */}
                            {photoCount > 0 && `사진 ${photoCount} · `}
                            메모 {memoCount}
                          </span>
                          <ChevronDownIcon
                            size={14}
                            aria-hidden
                            className={`text-muted-foreground transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      ) : (
                        /* 메모 0건 행에는 **펼침 표시를 두지 않는다** — 펼칠 것이 없다 */
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>

                  {/* 🔴 패널은 **같은 `<tbody>` 의 다음 `<tr>`** 이다. `colSpan` 은 헤더 7칸과 맞춘다 */}
                  {isOpen && (
                    /* 🔴 **머리 행과 같은 톤을 깔아 한 덩어리로 묶는다**(목업 수정안 2026-10-20).
                     전에는 `CheckDetailMemo` 가 **자기 회색 바탕**을 들고 있었는데, 그 회색이
                     행과 다른 색이라 패널이 **표에서 떨어져** 보였다. 바탕은 여기가 깔고
                     패널은 내용만 그린다(037 과 같은 모양으로 합쳤다).
                     🔴 **가로 패딩은 순찰지점 칸에 맞춘다**(`px-3` 이 아니라 안쪽 들여쓰기) —
                     기록이 **그 행에 딸린 것**임을 왼쪽 정렬이 말한다 */
                    <tr className="border-b last:border-0">
                      {/**
                       * 🔴 **색은 머리 행이 혼자 든다 — 본문은 흰 바탕이다**(사용자 결정 2026-10-20).
                       *
                       * 처음에는 행과 본문에 **같은 톤**을 깔아 한 덩어리로 묶으려 했는데, 그러면
                       * 색이 넓게 퍼져 **어디가 눌린 행인지**가 흐려지고 본문 글도 바탕 위에 뜬다.
                       * 하늘색 머리 + 흰 본문이면 **열린 행 하나만 또렷하고** 내용은 읽기 쉽다.
                       *
                       * 🔴 **위 패딩이 있어야 한다**(사용자 확인 2026-10-20) — 없으면 작성자·시각
                       * 뱃지가 **행 구분선에 붙어** 머리 행의 일부처럼 보인다.
                       */}
                      <td colSpan={7} className="bg-card px-4 pt-3 pb-4">
                        <CheckDetailMemo row={row} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <CheckDetailTimeline rows={rows} className="flex flex-col p-4 xl:hidden" />
    </>
  )
}

export default CheckDetailTable
