import AppDialog from '@/components/app/AppDialog'
import AppAlertDialog from '@/components/AppAlertDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EllipsisVerticalIcon, LockKeyholeIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import EditPointForm from '../../form/EditPointForm'
import { useState } from 'react'

interface ActiveMenuProps {
  onActive: (active: boolean) => void
  onDelete: () => void
}

export const ActiveMenu = ({ onActive, onDelete }: ActiveMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeOpen, setActiveOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger>
          <div className="p-2  rounded-sm cursor-pointer hover:bg-muted">
            <EllipsisVerticalIcon size={20} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onSelect={() => {
                setMenuOpen(false)
                setActiveOpen(true)
              }}
            >
              <LockKeyholeIcon strokeWidth={1.5} />
              비활성화
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => {
                setMenuOpen(false)
                setEditOpen(true)
              }}
            >
              <SquarePenIcon strokeWidth={1.5} />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setMenuOpen(false)
                setDeleteOpen(true)
              }}
              className="cursor-pointer"
            >
              <Trash2Icon strokeWidth={1.5} />
              삭제
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AppAlertDialog
        open={activeOpen}
        onOpenChange={setActiveOpen}
        size="sm"
        icon={LockKeyholeIcon}
        title="지점을 비활성화하시겠습니까?"
        onAction={() => onActive(false)}
      />
      <AppDialog
        title="코스 수정"
        open={editOpen}
        onOpenChange={setEditOpen}
        description="구역에 포함된 지점정보를 수정할 수 있습니다."
      >
        <EditPointForm />
      </AppDialog>
      <AppAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        size="sm"
        icon={Trash2Icon}
        variant="destructive"
        title="지점을 삭제하시겠습니까?"
        onAction={() => onDelete()}
      />
    </>
  )
}
