import { cn } from '@/lib/utils'

// 상태 의미 없는 순수 장식용 팔레트(design-system.md §1 아바타 장식 팔레트) 순환 배정.
const AVATAR_PALETTE_CLASSES = [
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
] as const

const hashToIndex = (id: string) => {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return sum % AVATAR_PALETTE_CLASSES.length
}

interface WorkerAvatarProps {
  id: string
  name: string
  className?: string
}

const WorkerAvatar = ({ id, name, className }: WorkerAvatarProps) => {
  const paletteClass = AVATAR_PALETTE_CLASSES[hashToIndex(id)]

  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-badge font-semibold text-white',
        paletteClass,
        className
      )}
    >
      {name.slice(0, 2)}
    </span>
  )
}

export default WorkerAvatar
