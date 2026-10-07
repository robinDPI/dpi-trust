import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type BadgeTone = 'neutral' | 'amber' | 'rose' | 'brand' | 'green'

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-green-bg text-green-fg',
  neutral: 'bg-surface-sunken text-ink-500 border border-border',
  amber: 'bg-amber-bg text-amber-fg',
  rose: 'bg-rose-bg text-rose-fg',
  brand: 'bg-brand-50 text-brand-700',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}
