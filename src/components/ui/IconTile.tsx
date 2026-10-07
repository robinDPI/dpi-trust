import type { LucideIcon } from 'lucide-react'
import type { Tint } from '../../lib/data'
import { cn } from '../../lib/utils'

const tintClasses: Record<Tint, string> = {
  blue: 'bg-tint-blue-bg text-tint-blue-fg',
  green: 'bg-green-bg text-green-fg',
  purple: 'bg-tint-purple-bg text-tint-purple-fg',
  cyan: 'bg-tint-cyan-bg text-tint-cyan-fg',
  amber: 'bg-tint-amber-bg text-tint-amber-fg',
  slate: 'bg-tint-slate-bg text-tint-slate-fg',
}

interface IconTileProps {
  icon: LucideIcon
  tint: Tint
  size?: 'sm' | 'md'
}

export function IconTile({ icon: Icon, tint, size = 'md' }: IconTileProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[10px]',
        tintClasses[tint],
        size === 'md' ? 'size-10' : 'size-8',
      )}
    >
      <Icon className={size === 'md' ? 'size-5' : 'size-4'} strokeWidth={2} />
    </div>
  )
}
