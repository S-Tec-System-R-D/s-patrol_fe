import AppPageHeader from '@/components/app/AppPageHeader'
import PatrolHistoryTabs from '@/features/patrol-zones/components/PatrolHistoryTabs'

const PatrolPointsPage = () => {
  return (
    <div className="flex">
      <div className="flex-1 flex flex-col gap-4 p-8">
        <AppPageHeader
          title="순찰이력"
          subtitle="코스·지점 단위 순찰 수행 이력을 확인합니다"
        />
        <PatrolHistoryTabs />
        <p className="text-sm text-muted-foreground">
          (010 spec에서 지점 순찰이력 컨텐츠 구현 예정)
        </p>
      </div>
    </div>
  )
}

export default PatrolPointsPage
