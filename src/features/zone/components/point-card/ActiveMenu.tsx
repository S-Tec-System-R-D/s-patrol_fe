import AppDialog from '@/components/app/AppDialog'
import AppAlertDialog from '@/components/AppAlertDialog'
import AppIconButton from '@/components/app/AppIconButton'
import { LockKeyholeIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import EditPointForm from '../../form/EditPointForm'
import { useState } from 'react'

interface ActiveMenuProps {
  onActive: (active: boolean) => void
  onDelete: () => void
}

export const ActiveMenu = ({ onActive, onDelete }: ActiveMenuProps) => {
  const [activeOpen, setActiveOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <AppIconButton icon={LockKeyholeIcon} onClick={() => setActiveOpen(true)} />
      <AppIconButton icon={SquarePenIcon} onClick={() => setEditOpen(true)} />
      <AppIconButton icon={Trash2Icon} onClick={() => setDeleteOpen(true)} />

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
    </div>
  )
}
