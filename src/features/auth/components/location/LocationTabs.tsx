import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayersIcon, MapPinIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const LOCATION_TABS = ['zones', 'points']

/**
 *
 * 순찰이력 /patrol?type=zones, /patrol?type=
 *
 */

// FIXME : 삭제해도됨
const LocationTabs = () => {
  const navigate = useNavigate()
  const pathname = useLocation()

  // 동일 입력에 동일 출력 — effect 없이 derive.
  const value = LOCATION_TABS.find((tab) => pathname.pathname.startsWith(`/${tab}`)) ?? 'zones'

  return (
    <Tabs
      className="bg-background border-b "
      defaultValue={'zone'}
      value={value}
      onValueChange={(value) => navigate(value)}
    >
      <TabsList variant="line" className="h-auto">
        <TabsTrigger className="px-4 py-2 h-auto" value="zones">
          <LayersIcon strokeWidth={1.5} />
          구역
        </TabsTrigger>
        <TabsTrigger className="px-4 py-2 h-auto" value="points">
          <MapPinIcon strokeWidth={1.5} />
          지점
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export default LocationTabs
