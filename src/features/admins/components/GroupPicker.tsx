import { useState } from 'react'
import { FolderTreeIcon, XIcon } from 'lucide-react'

import AppCheckbox from '@/components/app/AppCheckbox'
import AppEmpty from '@/components/app/AppEmpty'
import AppInput from '@/components/app/AppInput'
import type { GroupNode } from '@/features/auth/types/site'
import { splitByKeyword } from '@/features/courses/lib/pointCandidates'
import { layerName } from '@/features/groups/lib/groupTree'
import { cn } from '@/lib/utils'
import { pickChips, pickState, searchChoices, togglePick } from '../lib/groupSelection'
import GroupLayerMark from './GroupLayerMark'

/**
 * 담당 그룹 고르기 (`spec 045` 후속, 사용자 선택 시안 A 2026-10-23) — 선택 칩 · 검색 · 트리 체크.
 * 관리자 추가 폼(매니저) · 담당 그룹 추가 모달이 같이 쓴다. 규칙은 `lib/groupSelection`(본부 = 지사 전부 · 지사 = 한 본부 안).
 *
 * - 선택지는 호출부가 `groupChoices` 로 만든다 — 회사(루트)는 빠진다(OQ-045-A).
 * - 검색은 이름 부분 일치 + 그 본부를 맥락으로 남긴다 · 맞은 글자 강조(028 `splitByKeyword`).
 * - `fixed` = 이미 맡은 그룹 — 체크 · 잠금으로 보이고 칩에는 없다.
 * - 단계 표기는 관리그룹 트리와 같다(`GroupLayerMark` — 사용자 요청 2026-10-23).
 *   체크된 행은 배경을 칠한다 — 직접 고른 행은 진하게, 본부에 딸려 온 · 이미 맡은 행은 옅게.
 */

interface GroupPickerProps {
  root: GroupNode
  options: GroupNode[]
  selected: number[]
  onChange: (selected: number[]) => void
  fixed?: number[]
  disabled?: boolean
  error?: string
}

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

const GroupPicker = ({ root, options, selected, onChange, fixed = [], disabled, error }: GroupPickerProps) => {
  const [keyword, setKeyword] = useState('')

  if (options.length === 0) return <AppEmpty icon={FolderTreeIcon} title="추가할 수 있는 그룹이 없습니다" />

  const visible = searchChoices(root, options, keyword)
  const chips = pickChips(root, selected)
  /** 들여쓰기 기준 — Master 트리는 루트가 지사일 수도 있다 */
  const baseLayer = Math.min(...options.map((group) => group.layer))

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex flex-col overflow-hidden rounded-md border ${error ? 'border-danger' : 'border-border'}`}
      >
        <div aria-label="선택한 그룹" className="flex min-h-10 flex-wrap items-center gap-1.5 border-b border-border px-2.5 py-2">
          {chips.length === 0 ? (
            <span className="text-caption text-muted-foreground">선택한 그룹이 없습니다.</span>
          ) : (
            chips.map(({ group, label }) => (
              <span
                key={group.groupSeq}
                className="inline-flex items-center gap-1 rounded-full bg-point-bg py-0.5 pr-1 pl-2.5 text-caption text-point-foreground"
              >
                {label}
                <button
                  type="button"
                  aria-label={`${label} 빼기`}
                  disabled={disabled}
                  onClick={() => onChange(selected.filter((seq) => seq !== group.groupSeq))}
                  className="grid size-4 place-items-center rounded-full hover:bg-point/20"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="border-b border-border p-2">
          <AppInput
            variant="search"
            placeholder="그룹 검색"
            aria-label="그룹 검색"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        {visible.length === 0 ? (
          <p className="py-6 text-center text-caption text-muted-foreground">검색 결과가 없습니다.</p>
        ) : (
          <ul aria-label="그룹 선택" className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto p-1">
            {visible.map((group) => {
              const state = pickState(root, group, selected, fixed)
              const picked = state.checked && !state.disabled
              return (
                <li
                  key={group.groupSeq}
                  data-picked={picked || undefined}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md py-1.5 pr-3 transition-colors',
                    picked ? 'bg-point-bg' : state.checked ? 'bg-point-bg/40' : 'hover:bg-muted/50'
                  )}
                  style={{ paddingLeft: 8 + (group.layer - baseLayer) * 20 }}
                >
                  <AppCheckbox
                    label={
                      <span className={cn('flex items-center gap-1.5', picked && 'font-semibold text-point-foreground')}>
                        <GroupLayerMark layer={group.layer} />
                        <Highlight text={group.groupName} keyword={keyword.trim()} />
                      </span>
                    }
                    checked={state.checked}
                    disabled={disabled || state.disabled}
                    onChange={() => onChange(togglePick(group, selected))}
                  />
                  <span className="text-meta text-muted-foreground">{layerName(group.layer)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  )
}

export default GroupPicker
