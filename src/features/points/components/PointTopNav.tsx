import AppDialog from '@/components/app/AppDialog'
import AppInput from '@/components/app/AppInput'
import AppButton from '@/components/app/AppButton'
import { PlusIcon } from 'lucide-react'
import AddPointForm from '../form/AddPointForm'

const PointTopNav = () => {
  return (
    <div className=" flex gap-2 p-4 bg-background border-b  ">
      <AppInput variant="search" placeholder="지점명" className="w-full" />
      <AppDialog
        title="지점 생성"
        description="신규지점을 생성할 수 있습니다."
        trigger={
          <AppButton icon={PlusIcon} iconSize={20} iconStrokeWidth={2}>
            지점 추가
          </AppButton>
        }
      >
        <AddPointForm />
      </AppDialog>
    </div>
  )
}

export default PointTopNav
