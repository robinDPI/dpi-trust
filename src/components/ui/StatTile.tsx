import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { Tint } from '../../lib/data'
import { cn } from '../../lib/utils'
import { Badge } from './Badge'
import { IconTile } from './IconTile'

interface Delta {
  label: string
  direction: 'up' | 'down'
  tone: 'good' | 'bad'
}

interface StatTileProps {
  icon: LucideIcon
  tint: Tint
  label: string
  value: string
  delta?: Delta
  status?: string
}

export function StatTile({ icon, tint, label, value, delta, status }: StatTileProps) {
  const DeltaIcon = delta?.direction === 'up' ? TrendingUp : TrendingDown

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <IconTile icon={icon} tint={tint} size="sm" />
        {status && <Badge tone="rose">{status}</Badge>}
      </div>
      <p className="mt-3 text-sm text-ink-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
        {delta && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              delta.tone === 'good' ? 'text-green-fg' : 'text-rose-fg',
            )}
          >
            <DeltaIcon className="size-3.5" />
            {delta.label}
          </span>
        )}
      </div>
    </div>
  )
}
