import AppDialog from '@/components/app/AppDialog'
import AppInput from '@/components/app/AppInput'
import AppIconButton from '@/components/app/AppIconButton'
import { PlusIcon } from 'lucide-react'
import AddPointForm from '../form/AddPointForm'

const PointTopNav = () => {
  return (
    <div className="flex gap-2">
      <AppInput variant="search" placeholder="지점 이름 검색" />
      <AppDialog
        title="지점 생성"
        description="신규지점을 생성할 수 있습니다."
        trigger={
          <AppIconButton
            icon={PlusIcon}
            iconSize={14}
            className="h-9 w-9 shrink-0 border-transparent bg-point-bg text-point-foreground hover:bg-point-bg/80"
          />
        }
      >
        <AddPointForm />
      </AppDialog>
    </div>
  )
}

export default PointTopNav
