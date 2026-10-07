import type { ReactNode } from 'react'
import { Breadcrumb } from './Breadcrumb'

interface PageHeaderProps {
  breadcrumb: string
  title: string
  titleSub?: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ breadcrumb, title, titleSub, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Breadcrumb path={breadcrumb} />
        <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
          {titleSub && <span className="text-md text-ink-400">{titleSub}</span>}
        </div>
        <p className="mt-2 text-sm text-ink-500">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  )
}
