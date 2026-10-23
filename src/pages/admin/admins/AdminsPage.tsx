import { useMemo, useState } from 'react'
import { FilterXIcon, PlusIcon, ShieldIcon, TriangleAlertIcon, UsersIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppInput from '@/components/app/AppInput'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppSelect from '@/components/app/AppSelect'
import AppTable from '@/components/AppTable'
import { adminColumns } from '@/features/admins/components/AdminColumns'
import AdminDetailDialog from '@/features/admins/components/AdminDetailDialog'
import LockedAccountButton from '@/features/admins/components/LockedAccountButton'
import { useAdminAssignments } from '@/features/admins/hooks/useAdminAssignments'
import { countAdmins, filterAdminRows, scopeAdminRows } from '@/features/admins/lib/adminList'
import { adminRoleFilterOptions } from '@/features/admins/lib/adminRole'
import type { GroupNode } from '@/features/auth/types/site'
import { GroupEditTrigger } from '@/features/groups/components/GroupEditTrigger'
import { GroupFilterButton } from '@/features/groups/components/GroupFilterButton'
import { GroupFilterPanel } from '@/features/groups/components/GroupFilterPanel'
import { useGroupParam } from '@/features/groups/hooks/useGroupParam'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useQueryParams } from '@/hooks/useQueryParams'
import { ALL_VALUE } from '@/lib/listQuery'

/**
 * 본사 관리자 `/admin/admins` (`spec 045` US1 · US2 · US3).
 *
 * 골격은 사업장 목록(`LocationsPage`)과 같다 — XL 이상 좌측 관리그룹 패널 / XL 미만 필터 줄 경로 버튼.
 *
 * 🔴 **관리자 목록 API 가 없다**(B-61) — 트리의 그룹마다 `GetGroupAdminList` 를 불러 행 · 담당 그룹을 만든다
 * (`useAdminAssignments`). 전부 받기 전에는 표를 그리지 않는다.
 * 🔴 **[관리자 추가] 는 막는다**(B-59) — 관리자 생성 API 가 없다.
 * 🔴 서버 필터 · 페이지네이션 없음 — 관리자는 수 명이다.
 */

const SEARCH_DEBOUNCE_MS = 300

const AdminsPage = () => {
  const assignments = useAdminAssignments()
  const { selected } = useGroupParam(assignments.root)
  const [params, setParams] = useQueryParams<'q' | 'role'>()
  const [selectedUserSeq, setSelectedUserSeq] = useState<number | null>(null)

  /** 🔴 입력은 로컬 state, URL 은 디바운스 뒤에. URL 이 밖에서 바뀌면 입력창을 맞춘다(`LocationsPage` 승계) */
  const [keywordDraft, setKeywordDraft] = useState(params.q ?? '')
  const [lastKeyword, setLastKeyword] = useState(params.q)
  if (params.q !== lastKeyword) {
    setLastKeyword(params.q)
    setKeywordDraft(params.q ?? '')
  }
  const pushKeyword = useDebouncedCallback(
    (value: string) => setParams({ q: value.trim() || undefined }),
    SEARCH_DEBOUNCE_MS
  )

  const allRows = assignments.rows
  const scopedRows = useMemo(
    () => (allRows && selected ? scopeAdminRows(allRows, selected) : []),
    [allRows, selected]
  )
  const rows = useMemo(
    () => filterAdminRows(scopedRows, params.q ?? '', params.role),
    [scopedRows, params.q, params.role]
  )
  const root = assignments.root
  /** 🔴 메모이즈한다 — 렌더마다 만들면 행이 리마운트된다(027) */
  const columns = useMemo(() => (root ? adminColumns(root) : []), [root])
  /** 🔴 재조회 뒤 그 관리자가 사라지면(남이 지움) 모달이 저절로 닫힌다 */
  const openRow = allRows?.find((row) => row.admin.userSeq === selectedUserSeq) ?? null

  /** 할당 조회가 끝나기 전에는 수를 그리지 않는다 — 틀린 0 보다 빈칸이 낫다 */
  const count = (group: GroupNode) => (allRows ? countAdmins(allRows, group) : null)
  const filterProps = { unitLabel: '관리자', count, headerAction: <GroupEditTrigger /> }

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="관리자" subtitle="본사 직원 계정과 담당 그룹을 관리합니다" />
      <div className="flex gap-4 items-start">
        <div className="hidden xl:block shrink-0 sticky top-6 self-start">
          <GroupFilterPanel {...filterProps} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="xl:hidden">
              <GroupFilterButton {...filterProps} />
            </div>
            <AppInput
              variant="search"
              placeholder="이름 검색"
              aria-label="이름 검색"
              className="w-[220px]"
              value={keywordDraft}
              onChange={(event) => {
                setKeywordDraft(event.target.value)
                pushKeyword(event.target.value)
              }}
            />
            <AppSelect
              aria-label="권한"
              icon={ShieldIcon}
              options={adminRoleFilterOptions}
              value={params.role ?? ALL_VALUE}
              onChange={(value) => setParams({ role: value === ALL_VALUE ? undefined : value })}
              active={Boolean(params.role)}
              className="w-auto"
            />
            <div className="flex-1" />
            {/* 다른 목록 화면과 같이 필터 줄 끝 — 🔴 막혀 있다(B-59) */}
            <LockedAccountButton icon={PlusIcon} label="관리자 추가" variant="default" />
          </div>

          {assignments.isError ? (
            <div className="rounded-lg border border-border bg-card">
              <AppEmpty
                icon={TriangleAlertIcon}
                title="관리자를 불러오지 못했습니다"
                description={assignments.error?.message}
              />
              <div className="flex justify-center pb-6">
                <AppButton variant="sub" onClick={assignments.refetch}>
                  다시 시도
                </AppButton>
              </div>
            </div>
          ) : assignments.isPending ? (
            <div aria-label="관리자 불러오는 중" className="rounded-sm border border-border bg-card">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b border-border/50 px-3 py-3 last:border-0">
                  <div className="h-[22px] animate-pulse rounded-md bg-muted" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-border bg-card">
              {/* 🔴 범위가 비었으면 그것이 먼저다 — 검색어가 있어도 "검색 결과 없음" 이 아니다 */}
              {scopedRows.length === 0 ? (
                <AppEmpty icon={UsersIcon} title="이 그룹에 할당된 관리자가 없습니다." />
              ) : (
                <AppEmpty icon={FilterXIcon} title="검색 결과가 없습니다." description="검색어나 권한을 바꿔보세요." />
              )}
            </div>
          ) : (
            <>
              <AppTable
                columns={columns}
                data={rows}
                hidePagination
                onRowClick={(row) => setSelectedUserSeq(row.admin.userSeq)}
              />
              <p className="text-caption text-muted-foreground">
                총 <b className="text-foreground">{rows.length}</b>명
              </p>
            </>
          )}
        </div>
      </div>

      {root && <AdminDetailDialog row={openRow} root={root} onClose={() => setSelectedUserSeq(null)} />}
    </div>
  )
}

export default AdminsPage
