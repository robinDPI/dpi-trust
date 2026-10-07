import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  id?: string
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function Card({ id, title, description, actions, className, bodyClassName, children }: CardProps) {
  return (
    <section id={id} className={cn('scroll-mt-36 rounded-lg border border-border bg-surface shadow-xs', className)}>
      {title && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-md font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
