import { useState } from 'react'
import { Link } from 'react-router-dom'

import AppButton from '@/components/app/AppButton'
import AppCheckbox from '@/components/app/AppCheckbox'
import AppDialog from '@/components/app/AppDialog'
import AppInput from '@/components/app/AppInput'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

import { useClassificationPoints } from '../../hooks/useClassificationPoints'
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
 * ⚠️ 후보 응답에 **`useYn` 이 없다**(실측) — 미사용 지점이 섞여 있어도 구분할 수 없다.
 * 추측으로 걸러내지 않는다.
 */

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
  const [selected, setSelected] = useState<number[]>([])

  const all = candidates.data ?? []
  const assignable = all.filter((point) => !assignedPointSeqs.includes(point.pointSeq))
  const keyword = search.trim()
  const visible = keyword
    ? assignable.filter((point) => point.pointName.includes(keyword))
    : assignable

  const close = () => {
    setSearch('')
    setSelected([])
    onOpenChange(false)
  }

  const submit = () => {
    onAdd(all.filter((point) => selected.includes(point.pointSeq)))
    close()
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="지점 추가"
      description="코스에 편성할 지점을 선택합니다. 순서와 구간시간은 추가한 뒤 조정합니다."
    >
      <div className="flex min-h-0 flex-col gap-3">
        <AppInput
          variant="search"
          placeholder="지점 이름 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

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
          /* 🔴 **세 가지 0건을 구분한다** — 사업장에 지점이 없음 / 전부 편성됨 / 검색 0건.
             하나의 문구로 뭉치면 사용자가 다음에 할 일을 알 수 없다 */
          <div className="py-6 text-center text-body text-muted-foreground">
            {all.length === 0 ? (
              <>
                사업장에 등록된 지점이 없습니다.{' '}
                <Link to={paths.service.points} className="underline hover:text-foreground">
                  순찰지점
                </Link>
                에서 먼저 추가해주세요.
              </>
            ) : keyword ? (
              '검색 결과가 없습니다.'
            ) : (
              '추가할 수 있는 지점이 없습니다. 모든 지점이 이미 편성되어 있습니다.'
            )}
          </div>
        ) : (
          <ul className="flex max-h-[320px] min-h-0 flex-col gap-1 overflow-y-auto">
            {visible.map((point) => (
              <li key={point.pointSeq} className="rounded-sm px-1 py-1.5 hover:bg-muted/60">
                <AppCheckbox
                  label={`${point.pointName} · ${point.authMethodName}`}
                  checked={selected.includes(point.pointSeq)}
                  onChange={(event) =>
                    setSelected((prev) =>
                      event.target.checked
                        ? [...prev, point.pointSeq]
                        : prev.filter((seq) => seq !== point.pointSeq)
                    )
                  }
                />
              </li>
            ))}
          </ul>
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
