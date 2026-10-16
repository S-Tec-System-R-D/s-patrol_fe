import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import AppButton from '@/components/app/AppButton'
import AppCheckbox from '@/components/app/AppCheckbox'
import AppDialog from '@/components/app/AppDialog'
import AppInput from '@/components/app/AppInput'
import { toAuthMethodLabel } from '@/features/points/lib/authMethod'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

import { useClassificationPoints } from '../../hooks/useClassificationPoints'
import {
  candidateCounts,
  filterCandidates,
  orderNoOf,
  splitByKeyword,
  toggleSelection,
  type CandidateFilter,
} from '../../lib/pointCandidates'
import type { ClassificationPoint } from '../../types'

/**
 * 코스에 편성할 지점 고르기 (`spec 023` Phase 4, T366 — OQ-023-C 결정).
 *
 * 🔴 **모달 + 검색으로 간다.** `GetClassificationPoint` 는 **페이징이 없어** 사업장의
 * 지점이 **전량** 내려온다(실측 §5-2 14번) — 후보가 수십 개가 되면 스크롤만으로는 못
 * 찾는다. 상세 안 인라인 목록으로 두면 다이어그램·순서 카드와 **폭을 다투고**, 긴 후보
 * 목록이 편성 목록을 화면 밖으로 밀어낸다.
 *
 * 🔴 **검색은 클라이언트에서 한다** — 서버에 검색 파라미터가 없다. 목록(`/zones`)의
 * "클라이언트 필터 0건" 규칙과 반대로 보이지만, **서버가 거를 수단을 제공하지 않는
 * 경우**라 성격이 다르다(목록은 서버가 거른다는 것을 T355 에서 실측했다).
 *
 * 🔴 **조회는 모달이 열릴 때만 한다**(`useClassificationPoints(siteSeq, open)`). 상세를
 * 열 때마다 사업장 전체 지점을 받아 올 이유가 없다.
 *
 * ⚠️ **이미 편성된 지점을 후보에서 뺀다 — 서버 규칙이 아니라 우리 규칙이다.** 실측
 * (2026-10-12)에서 **같은 `pointSeq` 를 한 코스에 두 번 넣는 것이 통과**했다(각각 다른
 * `coursePointSeq` 를 받는다). 서버가 막지 않으므로 화면에서 막는다 — 같은 지점을 두 번
 * 도는 코스는 **실수일 가능성이 압도적**이고, 정말 필요하면 그때 근거와 함께 푼다(A1).
 *
 * ✅ **미사용 지점은 서버가 후보에서 빼고 준다**(실측 2026-10-13). 응답에 `useYn` 이
 * 없어 "섞여 있어도 구분할 수 없다" 고 적었던 것은 틀렸다 — 여기서 거르지 않는다.
 *
 * 🔴 **`미배정` 칩(목업)은 만들 수 없다.** 후보 응답에 "이 지점이 어느 코스에 속하는지"
 * 가 없고, 알아내려면 지점마다 상세 조회(N+1)다. 필터는 **인증수단 2종 + 전체**뿐이다.
 */

/**
 * 필터 칩. 🔴 **버튼이다** — 뱃지처럼 보이지만 누르는 것이라 `AppBadge` 를 쓰지 않는다
 * (키보드 포커스·`aria-pressed` 가 필요하다).
 */
const FilterChip = ({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    aria-pressed={active}
    // 🔴 라벨과 숫자가 붙어 `전체3` 으로 읽힌다 — 읽히는 이름을 명시한다
    aria-label={`${label} ${count}건`}
    onClick={onClick}
    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption transition-colors ${
      active
        ? 'border-foreground bg-foreground text-background'
        : 'border-border bg-card text-muted-foreground hover:bg-muted/60'
    }`}
  >
    {label}
    <span className="tabular-nums opacity-70">{count}</span>
  </button>
)

/** 검색어 일치 구간 강조. 분할은 순수 함수가 한다(`splitByKeyword`) */
const Highlight = ({ text, keyword }: { text: string; keyword: string }) => (
  <>
    {splitByKeyword(text, keyword).map((chunk, index) =>
      chunk.hit ? (
        <mark key={index} className="rounded-xs bg-warning-bg px-0.5 text-warning-foreground">
          {chunk.text}
        </mark>
      ) : (
        <span key={index}>{chunk.text}</span>
      )
    )}
  </>
)

interface AddCoursePointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 이미 편성된 `pointSeq` — 후보에서 제외한다 */
  assignedPointSeqs: number[]
  onAdd: (points: ClassificationPoint[]) => void
}

const AddCoursePointDialog = ({
  open,
  onOpenChange,
  assignedPointSeqs,
  onAdd,
}: AddCoursePointDialogProps) => {
  const siteSeq = getSiteSeq()
  const candidates = useClassificationPoints(siteSeq, open)

  const [search, setSearch] = useState('')
  /**
   * 🔴 **선택 순서를 그대로 들고 있는다**(`spec 028` T385). 이전에는 `number[]`(pointSeq)
   * 였고 제출할 때 `all.filter(...)` 로 되살렸는데, 그러면 **후보 응답 순서**로 나간다 —
   * 3번을 먼저 고르고 1번을 골라도 1번이 먼저 들어갔다. 지금은 번호를 보여주므로
   * (`orderNoOf`) 그 순서가 **화면의 숫자와 어긋나면 안 된다.**
   */
  const [selected, setSelected] = useState<ClassificationPoint[]>([])

  /** 칩 필터. 🔴 닫을 때 검색어·선택과 **함께** 초기화한다(T394) */
  const [filter, setFilter] = useState<CandidateFilter>('ALL')

  const all = candidates.data ?? []
  /** 🔴 **칩 건수의 기준** — 편성 제외까지만. 검색어는 반영하지 않는다(`pointCandidates.ts`) */
  const assignable = all.filter((point) => !assignedPointSeqs.includes(point.pointSeq))
  const counts = candidateCounts(assignable)
  const keyword = search.trim()
  const visible = filterCandidates(all, assignedPointSeqs, filter, keyword)

  const close = () => {
    setSearch('')
    setFilter('ALL')
    setSelected([])
    onOpenChange(false)
  }

  const submit = () => {
    // 🔴 **고른 순서 그대로** 넘긴다 — 호출부가 초안 끝에 append 하므로 이 순서가
    // 곧 편성 순서가 된다(T386)
    onAdd(selected)
    close()
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="지점 추가"
      /* 🔴 **코스명·사업장명을 넣지 않는다**(목업과 다른 점, T395). 이 모달은 코스 상세
         안에서만 열리고 **페이지 제목이 이미 코스명**이다. 사업장도 선택된 하나뿐이라
         같은 값을 한 화면에 두 번 적는 꼴이 된다 */
      description="고른 순서대로 코스 끝에 추가됩니다. 구간시간은 추가한 뒤 입력합니다."
    >
      <div className="flex min-h-0 flex-col gap-3">
        <AppInput
          variant="search"
          placeholder="지점 이름 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {/* 🔴 **칩은 항상 보인다**(목록 화면의 팝오버 필터와 다르다). 소비처가 이 모달
            뿐이라 공용 컴포넌트로 뽑지 않는다(A6, `tasks.md` 제약 1).
            ⚠️ **`미배정` 칩은 만들 수 없다** — 후보 응답에 "이 지점이 어느 코스에 속하는지"
            가 없다. 알아내려면 지점마다 상세 조회(N+1)다(제약 2) */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="인증수단 필터">
          <FilterChip label="전체" count={counts.all} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
          <FilterChip label="QR" count={counts.qr} active={filter === 'QR'} onClick={() => setFilter('QR')} />
          <FilterChip label="NFC" count={counts.nfc} active={filter === 'NFC'} onClick={() => setFilter('NFC')} />
        </div>

        {candidates.isPending ? (
          /* 🔴 로딩을 "후보 없음" 으로 보여주지 않는다 — 지점이 없다고 믿고 나가게 된다 */
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-sm bg-muted" />
            ))}
          </div>
        ) : candidates.isError ? (
          <p className="py-6 text-center text-body text-muted-foreground">
            지점 목록을 불러오지 못했습니다.
          </p>
        ) : visible.length === 0 ? (
          /* 🔴 **네 가지 0건을 구분한다** — 사업장에 지점 없음 / 전부 편성됨 / 검색 0건 /
             필터 0건. 하나의 문구로 뭉치면 사용자가 다음에 할 일을 알 수 없다.
             🔴 **필터 0건이 028 에서 새로 생겼다** — 칩을 눌러 비었는데 "검색 결과가
             없습니다" 라고 하면 검색어를 지우러 간다(원인이 칩인데) */
          <div className="py-6 text-center text-body text-muted-foreground">
            {all.length === 0 ? (
              <>
                사업장에 등록된 지점이 없습니다.{' '}
                <Link to={paths.service.points} className="underline hover:text-foreground">
                  순찰지점
                </Link>
                에서 먼저 추가해주세요.
              </>
            ) : assignable.length === 0 ? (
              '추가할 수 있는 지점이 없습니다. 모든 지점이 이미 편성되어 있습니다.'
            ) : keyword ? (
              '검색 결과가 없습니다.'
            ) : (
              <>
                <p>{filter} 인증 지점이 없습니다.</p>
                <button
                  type="button"
                  className="mt-2 underline hover:text-foreground"
                  onClick={() => setFilter('ALL')}
                >
                  전체 보기
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-caption text-muted-foreground">검색결과 {visible.length}개</p>

            <ul className="flex max-h-[320px] min-h-0 flex-col gap-1 overflow-y-auto">
              {visible.map((point) => {
                const method = toAuthMethodLabel(point.authMethod)
                const index = selected.findIndex((item) => item.pointSeq === point.pointSeq)
                const checked = index !== -1
                const inputId = `course-point-candidate-${point.pointSeq}`

                return (
                  <li
                    key={point.pointSeq}
                    /* 🔴 고른 행은 **좌측 바**로 표시한다(목업, 사용자 결정 2026-10-13) —
                       배경 톤만으로는 스크롤 중에 눈에 띄지 않는다.
                       🔴 바는 `border-l` 이 아니라 **덧대는 요소**다 — 테두리로 그리면 행의
                       `rounded-sm` 을 따라 **위아래가 둥글어진다**(사용자 지적). 일자 바여야
                       눈이 세로로 미끄러진다. 행 패딩은 선택 여부와 무관하게 같다 */
                    className={`relative flex items-center gap-2.5 rounded-sm px-2.5 py-2.5 ${
                      checked ? 'bg-point/5' : 'hover:bg-muted/60'
                    }`}
                  >
                    {checked && (
                      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-point" />
                    )}

                    <AppCheckbox
                      id={inputId}
                      checked={checked}
                      onChange={() => setSelected((prev) => toggleSelection(prev, point))}
                    />
                    {/* 행 전체를 눌러도 토글된다 — 체크박스 4px 를 조준하게 두지 않는다 */}
                    <label
                      htmlFor={inputId}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-body">
                        <Highlight text={point.pointName} keyword={keyword} />
                      </span>
                      {/* 🔴 목록 뱃지는 **한 단계 작게**(사용자 지적 2026-10-13) — 기본
                          `AppBadge` 는 지점명과 글자 크기가 비슷해 둘이 다툰다. 여기서
                          주인공은 이름이고 인증수단은 곁들이는 정보다 */}
                      {method && (
                        <AppBadge
                          variant={method === 'QR' ? 'point' : 'success'}
                          className={cardBadge}
                        >
                          {method}
                        </AppBadge>
                      )}
                      {/* 🔴 순번은 **고른 행에만** 붙인다 — 안 고른 행에 번호가 있으면
                          "이미 그 자리에 있다" 로 읽힌다 */}
                      {checked && (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-point text-label font-bold text-white tabular-nums">
                          {orderNoOf(assignedPointSeqs.length, index)}
                        </span>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {/* 🔴 **선택 목록을 따로 둔다** — 필터·검색을 바꾸면 고른 행이 목록에서 사라지는데
            (선택은 유지된다, T392) 그것을 확인하고 해제할 자리가 없으면 사용자는 무엇을
            골랐는지 알 수 없다 */}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-sm bg-muted p-2">
            <span className="text-caption text-muted-foreground">선택 {selected.length}</span>
            {selected.map((point, index) => (
              <span
                key={point.pointSeq}
                className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-caption"
              >
                <span className="tabular-nums text-muted-foreground">
                  {orderNoOf(assignedPointSeqs.length, index)}
                </span>
                <span className="max-w-[160px] truncate">{point.pointName}</span>
                <button
                  type="button"
                  aria-label={`${point.pointName} 선택 해제`}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSelected((prev) => toggleSelection(prev, point))}
                >
                  <XIcon size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              className="ml-auto text-caption font-medium text-point hover:text-point/80"
              onClick={() => setSelected([])}
            >
              모두 해제
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <AppButton variant="sub" type="button" onClick={close}>
            취소
          </AppButton>
          {/* 🔴 아직 저장이 아니다 — 편집 중인 목록에 **담을 뿐**이고 저장은 편성 카드의
              "저장" 이 한다. 라벨을 "추가" 로 둬서 "저장" 과 구분한다 */}
          <AppButton type="button" disabled={selected.length === 0} onClick={submit}>
            {selected.length > 0 ? `${selected.length}개 추가` : '추가'}
          </AppButton>
        </div>
      </div>
    </AppDialog>
  )
}

export default AddCoursePointDialog
