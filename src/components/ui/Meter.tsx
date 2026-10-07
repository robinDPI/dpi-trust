import { cn } from '../../lib/utils'

type MeterTone = 'brand' | 'good' | 'warning' | 'critical'

const toneClasses: Record<MeterTone, { track: string; fill: string }> = {
  brand: { track: 'bg-brand-100', fill: 'bg-brand-600' },
  good: { track: 'bg-green-bg', fill: 'bg-green-fg' },
  warning: { track: 'bg-amber-bg', fill: 'bg-amber-fg' },
  critical: { track: 'bg-rose-bg', fill: 'bg-rose-fg' },
}

interface MeterProps {
  value: number
  max?: number
  tone?: MeterTone
  size?: 'sm' | 'md'
}

export function Meter({ value, max = 100, tone = 'brand', size = 'md' }: MeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const { track, fill } = toneClasses[tone]

  return (
    <div className={cn('w-full overflow-hidden rounded-full', track, size === 'md' ? 'h-2.5' : 'h-1.5')}>
      <div className={cn('h-full rounded-full transition-[width] duration-300', fill)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function scoreTone(score: number): MeterTone {
  if (score >= 85) return 'good'
  if (score >= 60) return 'warning'
  return 'critical'
}
