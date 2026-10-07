import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

export function Breadcrumb({ path }: { path: string }) {
  const segments = path.split('/').map((s) => s.trim())

  return (
    <div className="flex items-center gap-1.5 text-xs text-ink-400">
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 && <ChevronRight className="size-3" />}
          <span className={index === segments.length - 1 ? 'font-medium text-ink-500' : undefined}>{segment}</span>
        </Fragment>
      ))}
    </div>
  )
}
