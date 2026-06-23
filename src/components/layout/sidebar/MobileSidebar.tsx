import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MenuIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from 'radix-ui'
import { Sidebar } from './Sidebar'

/**
 * 모바일(<1024px, lg 미만)용 사이드바 토글.
 * - TopNav 좌측 햄버거 + 좌측 Sheet 슬라이드
 * - 라우트 이동 시 `open=false`로 자동 닫힘 (006 spec §3 US1)
 */
export const MobileSidebar = () => {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // 라우트 이동 감지 → Sheet 자동 닫힘. Radix Sheet는 controlled open이라 외부에서 닫아야 함.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [location.pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="메뉴 열기"
        className="lg:hidden p-2 rounded-sm hover:bg-muted cursor-pointer"
      >
        <MenuIcon size={20} strokeWidth={1.5} />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 data-[side=left]:w-70 sm:data-[side=left]:max-w-70"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <SheetTitle>사이드바 메뉴</SheetTitle>
        </VisuallyHidden.Root>
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
