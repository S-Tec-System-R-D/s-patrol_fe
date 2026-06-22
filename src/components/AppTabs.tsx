import { type LucideIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { useLocation, useNavigate } from 'react-router-dom'

export interface AppTabsProps {
  tabs: TabItems[]
  mode?: 'path' | 'query'
  queryKey?: string
}

export interface TabItems {
  label: string
  path: string
  icon: LucideIcon
}

const AppTabs = ({ tabs, mode = 'path' }: AppTabsProps) => {
  const navigate = useNavigate()
  const pathname = useLocation()

  // pathname → 매칭되는 tab.path. 동일 입력에 동일 결과라 effect 없이 derive.
  const value =
    mode === 'path'
      ? (tabs.find((t) => pathname.pathname.startsWith(t.path))?.path ?? '')
      : ''

  const handleClick = (path: string) => {
    navigate(path)
  }

  return (
    <Tabs
      className="bg-background border-b "
      value={value}
      onValueChange={(value) => handleClick(value)}
    >
      <TabsList variant="line" className="h-auto">
        {tabs.map((t, i) => {
          const { label, path, icon: Icon } = t
          return (
            <TabsTrigger key={'tab' + i} className="px-4 py-2 h-auto" value={path}>
              <Icon strokeWidth={1.5} />
              {label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}

export default AppTabs
