import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisIcon,
  GripVerticalIcon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import AppButton from '@/components/app/AppButton'
import AppIconButton from '@/components/app/AppIconButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getSiteSeq } from '@/lib/auth/site'
import { cn } from '@/lib/utils'

import { updateCourse } from '../../api/updateCourse'
import {
  isDirty,
  moveDraft,
  newDraftKey,
  toDrafts,
  toOrderedPoints,
  type CoursePointDraft,
} from '../../lib/coursePointOrder'
import { toUpdateCourseBody } from '../../lib/updateCourseBody'
import { courseKeys } from '../../queryKeys'
import type { CourseDetail } from '../../types'
import AddCoursePointDialog from './AddCoursePointDialog'

/**
 * 지점 편성 — **편집 모드** (`spec 023` Phase 4, T367·T368).
 * 🔄 **`spec 074`(사용자 결정 2026-11-13) — 페이지가 모달 안에 그린다.** 카드 틀 · 제목은 모달 몫이라 여기 없다.
 * 바뀐 내용이 있는지는 `onDirtyChange` 로 올린다 — 모달 바깥 클릭 · Esc 로 닫을 때 페이지가 버릴지 묻는다.
 *
 * 🔴 **드래그마다 저장하지 않는다 — 명시적인 편집 모드다.** 이유가 세 개다:
 * 1. `UpdateCourse` 는 **전량 전송**(B-25)이다. 드래그 한 번마다 코스 전체를 PUT 하면
 *    지점 5개를 재배치하는 동안 **전량 교체가 네 번** 일어난다.
 * 2. 실패 시 "화면만 바뀌고 서버는 그대로" 가 되어 다음 조회에서 **순서가 되돌아간다**
 *    (spec §4 가 금지한 상태).
 * 3. 구간시간은 **타이핑**이라 자동 저장과 맞지 않는다(글자마다 PUT).
 *
 * 🔴 **그래서 §4 의 "실패 시 원복" 은 이렇게 지킨다**: 저장이 실패하면 **초안을 유지**
 * 하되 "저장되지 않았다" 를 화면에 **명시**하고(토스트는 사라진다), **취소가 원복**이다
 * (서버 순서로 되돌아간다). 초안을 말없이 서버 값으로 되돌리면 사용자가 방금 한 작업이
 * **설명 없이 사라진다** — 전량 전송이라 **부분 반영이 없다**는 점이 이 선택의 근거다.
 *
 * 🔴 **`orderNo` 는 저장 시 1..N 으로 다시 매긴다**(`lib/coursePointOrder.ts`). 서버는
 * 중복 `orderNo` 도 그대로 저장하므로(실측 2026-10-12) 재부여는 우리 책임이다.
 *
 * 🔴 **지점별 활성(`useYn`)은 표시만 한다** — `UpdateCoursePointDto` 에 필드가 없어
 * 보내지 않는다 — **코스에서 바꿀 값이 아니다**(B-29 철회, 실측 2026-10-13).
 * 🔴 **구간 메모 UI 를 만들지 않는다** — 쓰기 전용이라 다시 읽을 수 없고(B-30), 전량
 * 전송과 겹쳐 다른 경로로 들어간 메모를 지운다. 저장 시 `memo: null` 이 나가는 것은
 * **알고도 보내는 것**이다(`lib/updateCourseBody.ts` 주석).
 *
 * 🔴 **지점이 0개가 되어도 자동 조치를 하지 않는다**(규칙 12) — 비활성화·저장 차단·경고
 * 배너 **어느 것도** 없다. 전부 지우고 다시 짜는 것은 정상 작업이다.
 *
 * ⚠️ **실제 드래그는 jsdom 에서 재현되지 않는다**(레이아웃 측정이 0). 순서 계산은 순수
 * 함수로 꺼내 단위 테스트로 고정했고, 드래그 동작 자체는 브라우저 확인(T377) 몫이다.
 * `dnd-kit` 의 `KeyboardSensor` 를 달아 **키보드로도 정렬**할 수 있다(`patterns.md` §5).
 *
 * 🔄 **행 모양 개편(사용자 결정 2026-11-13 · Atlassian · PatternFly · WCAG 2.2 끌기 대안 참고)**:
 * - 순찰 경로 카드와 같은 말 — 번호 동그라미 · 미사용은 🔒 + 행 회색. 상자 → 구분선.
 * - 🔴 **인증수단을 그리지 않는다**(사용자 결정 2026-11-13) — 여기서 바꿀 수 없는 지점 속성이고 순서와 무관하다.
 *   경로 카드 · `지점 추가` 후보 목록에는 남는다.
 * - 🔴 **끌지 않고도 순서를 바꾼다** — 행 `⋯` 메뉴의 `위로 · 아래로 이동`(휴대폰에서 끌기가 어렵다). 제거도 이 메뉴 안.
 * - 끄는 행은 그림자 카드(`DragOverlay`)로 뜨고, 놓일 자리는 점선 칸 · 번호는 끄는 동안 바로 바뀐다.
 * - 🔴 한 줄 — 인증수단을 빼서 390 에서도 이름에 약 120px 가 남는다(전에는 이름이 한 글자만 남았다).
 */

/** 번호 동그라미 — 미사용은 자물쇠(경로 카드와 같다) */
const OrderMark = ({ order, useYn }: { order: number; useYn: boolean }) =>
  useYn ? (
    <span className="grid size-[22px] shrink-0 place-items-center rounded-full border border-point/30 bg-point-bg text-[11px] font-bold text-point tabular-nums">
      {order}
    </span>
  ) : (
    <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
      <LockIcon size={12} aria-hidden />
      {/* 🔴 지점별 활성은 **표시만** — 코스에서 바꿀 값이 아니다(B-29 철회) */}
      <span className="sr-only">미사용</span>
    </span>
  )

interface RowProps {
  draft: CoursePointDraft
  /** 화면에 그리는 번호 = **배열 순서**(끄는 동안은 놓였을 때의 순서). 저장 시 보내는 `orderNo` 와 같은 값이다 */
  order: number
  isFirst: boolean
  isLast: boolean
  onCourseMinChange: (value: number) => void
  onMove: (step: -1 | 1) => void
  onRemove: () => void
  disabled: boolean
}

const SortableRow = ({ draft, order, isFirst, isLast, onCourseMinChange, onMove, onRemove, disabled }: RowProps) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: draft.key })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        // 🔄 `spec 084`(목업 `20`): 목록을 감싼 상자를 없애고 줄 사이 선만 · 줄 높이 44px
        'group relative flex h-11 items-center gap-2 border-b border-border sm:gap-2.5',
        draft.useYn ? 'hover:bg-muted/40' : 'bg-muted/70',
        // 🔴 놓일 자리 — 원래 행은 점선 칸으로 남고 그 칸이 놓일 위치로 움직인다(손에 든 모양은 `DragOverlay`)
        isDragging && 'border border-dashed border-point bg-point-bg/60 [&>*]:invisible'
      )}
    >
      {/* 🔴 드래그 핸들은 **좌측 점 6개**(`patterns.md` §5). 행 전체를 드래그 대상으로
          두면 구간시간 입력을 클릭할 때마다 드래그가 시작된다.
          🔴 `touch-none` — 없으면 터치에서 브라우저가 스크롤로 먼저 가져가 드래그가 시작되지
          않는다(`PointerSensor` 요구 사항) */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`${draft.pointName} 순서 변경`}
        className="touch-none cursor-grab rounded-sm p-1 text-muted-foreground/60 transition-colors group-hover:text-foreground hover:bg-muted active:cursor-grabbing"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon size={16} strokeWidth={1.75} />
      </button>

      {/* 🔴 번호는 **배열 순서**로 그린다 — 저장 시 보내는 `orderNo` 와 같은 값이어야
          한다. 서버가 준 `orderNo` 를 그대로 쓰면 드래그 후 번호가 안 바뀐다 */}
      <OrderMark order={order} useYn={draft.useYn} />

      <span
        title={draft.pointName}
        className={cn(
          'min-w-0 flex-1 truncate text-body font-medium',
          draft.useYn ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {draft.pointName}
      </span>
      <label className="text-caption text-muted-foreground">
        <span className="flex h-[30px] w-[92px] items-center justify-end gap-1.5 rounded-[7px] border border-border bg-card px-2.5 focus-within:border-point">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label={`${draft.pointName} 구간시간(분)`}
            className="w-full min-w-0 bg-transparent text-right text-body tabular-nums text-foreground focus:outline-none"
            value={draft.courseMin}
            disabled={disabled}
            onChange={(event) => onCourseMinChange(Number(event.target.value))}
          />
          <span aria-hidden>분</span>
        </span>
      </label>

      {/* 🔴 끌기의 대안 + 제거 — 한 줄에 버튼 하나. modal={false}: 편집 모달 안에서 겹친 포커스 잠금을 피한다 */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <AppIconButton
            icon={EllipsisIcon}
            aria-label={`${draft.pointName} 메뉴`}
            variant="ghost"
            disabled={disabled}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem className="cursor-pointer" disabled={isFirst} onSelect={() => onMove(-1)}>
            <ArrowUpIcon />
            위로 이동
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" disabled={isLast} onSelect={() => onMove(1)}>
            <ArrowDownIcon />
            아래로 이동
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="cursor-pointer" onSelect={onRemove}>
            <Trash2Icon />
            편성에서 제거
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

/** 끄는 동안 손에 들린 행 — 그림자 카드 */
const DragPreview = ({ draft, order }: { draft: CoursePointDraft; order: number }) => (
  <div className="flex items-center gap-3 rounded-md border border-border bg-card px-1.5 py-2.5 shadow-lg">
    <span className="p-1 text-foreground">
      <GripVerticalIcon size={16} strokeWidth={1.75} />
    </span>
    <OrderMark order={order} useYn={draft.useYn} />
    <span className="min-w-0 flex-1 truncate pr-3 text-body font-semibold">{draft.pointName}</span>
  </div>
)

interface CoursePointEditorProps {
  course: CourseDetail
  /** 편집 종료(저장 성공 또는 취소) */
  onClose: () => void
  /** 초안이 서버 편성과 달라졌는지 */
  onDirtyChange?: (dirty: boolean) => void
}

const CoursePointEditor = ({ course, onClose, onDirtyChange }: CoursePointEditorProps) => {
  const queryClient = useQueryClient()
  // 🔴 상세 응답에 `siteSeq` 가 없다(OQ-9) — 021 저장값으로 보충한다
  const siteSeq = getSiteSeq()

  const [drafts, setDrafts] = useState<CoursePointDraft[]>(() => toDrafts(course.points))
  /** 새 행 `key` 용 누적 번호 — 추가·제거를 반복해도 겹치지 않게 */
  const [serial, setSerial] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [failed, setFailed] = useState(false)

  const sensors = useSensors(
    // 4px 이동 전에는 클릭으로 본다 — 제거 버튼·입력 클릭이 드래그로 먹히지 않게
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const mutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.lists }),
        queryClient.invalidateQueries({ queryKey: courseKeys.detail(course.courseSeq) }),
      ])
      onClose()
    },
    // 🔴 초안을 버리지 않는다. 전역 토스트는 사라지므로 화면에도 남긴다(T368)
    onError: () => setFailed(true),
  })

  /** 끄는 중인 행 · 지금 위에 있는 행 — 번호를 놓였을 때의 순서로 미리 보여 준다 */
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)

  const handleDragStart = ({ active }: DragStartEvent) => setActiveKey(String(active.id))
  const handleDragOver = ({ over }: DragOverEvent) => setOverKey(over ? String(over.id) : null)
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveKey(null)
    setOverKey(null)
    if (!over) return
    setDrafts((prev) => moveDraft(prev, String(active.id), String(over.id)))
  }
  const handleDragCancel = () => {
    setActiveKey(null)
    setOverKey(null)
  }

  const moveBy = (key: string, step: -1 | 1) =>
    setDrafts((prev) => {
      const index = prev.findIndex((row) => row.key === key)
      const neighbor = prev[index + step]
      return neighbor ? moveDraft(prev, key, neighbor.key) : prev
    })

  const projected = activeKey && overKey ? moveDraft(drafts, activeKey, overKey) : drafts
  const orderOf = (key: string) => projected.findIndex((row) => row.key === key) + 1
  const activeDraft = activeKey ? drafts.find((row) => row.key === activeKey) : undefined

  const save = () => {
    if (siteSeq === null) return
    setFailed(false)
    mutation.mutate(
      // 🔴 `points` 전량 + `orderNo` 1..N 재부여 (B-25)
      toUpdateCourseBody(course, siteSeq, { points: toOrderedPoints(drafts) })
    )
  }

  const dirty = isDirty(drafts, course.points)
  const locked = mutation.isPending

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  return (
    <div className="flex flex-col gap-3">
      {drafts.length === 0 ? (
        /* 🔴 **경고가 아니다**(규칙 12). 전부 지우고 다시 짜는 것은 정상 작업이고,
           이 상태로 저장하는 것도 막지 않는다 */
        <p className="rounded-sm border border-dashed border-border py-6 text-center text-body text-muted-foreground">
          편성된 지점이 없습니다. 지점을 추가해주세요.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={drafts.map((draft) => draft.key)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col border-t border-border">
              {drafts.map((draft, index) => (
                <SortableRow
                  key={draft.key}
                  draft={draft}
                  order={orderOf(draft.key)}
                  isFirst={index === 0}
                  isLast={index === drafts.length - 1}
                  disabled={locked}
                  onMove={(step) => moveBy(draft.key, step)}
                  onCourseMinChange={(value) =>
                    setDrafts((prev) =>
                      prev.map((row) =>
                        row.key === draft.key
                          ? // 빈 입력·음수는 0 으로 모은다 — 서버도 `courseMin: null` 을
                            // 0 으로 저장한다(실측 2026-10-12)
                            { ...row, courseMin: Number.isFinite(value) && value > 0 ? value : 0 }
                          : row
                      )
                    )
                  }
                  onRemove={() =>
                    setDrafts((prev) => prev.filter((row) => row.key !== draft.key))
                  }
                />
              ))}
            </ol>
          </SortableContext>
          {/* 🔴 **body 로 포털** — 모달 상자가 `transform` 으로 가운데 정렬돼 `position: fixed` 의 기준이 모달이 된다.
              그대로 두면 손에 든 카드가 포인터에서 모달 위치만큼 어긋나 화면 밖으로 밀린다(브라우저 확인 2026-11-13) */}
          {createPortal(
            <DragOverlay zIndex={60}>
              {activeDraft && <DragPreview draft={activeDraft} order={orderOf(activeDraft.key)} />}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      )}

      <AppButton
        variant="dash"
        icon={PlusIcon}
        size="full"
        type="button"
        disabled={locked}
        onClick={() => setAddOpen(true)}
      >
        지점 추가
      </AppButton>

      {failed && (
        /* 🔴 **"저장되지 않았다" 를 화면에 남긴다.** 전량 전송이라 **부분 반영이 없다** —
           서버 편성은 저장 직전 상태 그대로다. 토스트는 사라지므로 여기서 또 말한다 */
        <p className="rounded-sm bg-danger-bg px-3 py-2 text-caption text-danger">
          저장되지 않았습니다. 서버의 편성은 그대로이며, 화면의 변경은 유지했습니다. 다시
          시도하거나 취소하세요.
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        {/* 🔴 **취소가 원복이다** — 초안을 버리고 서버 순서로 돌아간다(spec §4) */}
        <AppButton variant="sub" type="button" disabled={locked} onClick={onClose}>
          취소
        </AppButton>
        <AppButton type="button" disabled={locked || !dirty} onClick={save}>
          {locked ? '저장 중…' : '저장'}
        </AppButton>
      </div>

      <AddCoursePointDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        assignedPointSeqs={drafts.map((draft) => draft.pointSeq)}
        onAdd={(points) => {
          setDrafts((prev) => [
            ...prev,
            ...points.map((point, index) => ({
              key: newDraftKey(serial + index),
              // 🔴 새 행은 `coursePointSeq` 가 없다 — 서버가 저장할 때 부여한다
              coursePointSeq: null,
              pointSeq: point.pointSeq,
              pointName: point.pointName,
              authMethod: point.authMethod,
              // ⚠️ 후보 응답에 `useYn` 이 없다 — 새 행은 활성으로 그린다(서버 기본값)
              useYn: true,
              courseMin: 0,
            })),
          ])
          setSerial((prev) => prev + points.length)
        }}
      />
    </div>
  )
}

export default CoursePointEditor
