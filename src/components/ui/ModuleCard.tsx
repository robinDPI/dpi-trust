import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ModuleItem } from '../../lib/data'
import { Badge } from './Badge'
import { IconTile } from './IconTile'

export function ModuleCard({ item }: { item: ModuleItem }) {
  const { t } = useTranslation()
  const base = item.i18nKey
  const badge = t(`${base}.badge`, { defaultValue: '' })

  return (
    <Link
      to={item.path}
      className="group flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-xs transition-shadow duration-150 hover:border-border-strong hover:shadow-md"
    >
      <IconTile icon={item.icon} tint={item.tint} size="sm" />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-ink-900">{t(`${base}.name`)}</h4>
          {badge && <Badge tone="rose">{badge}</Badge>}
        </div>
        <p className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-ink-400">{t(`${base}.tag`)}</p>
        <p className="mt-1.5 text-sm text-ink-500">{t(`${base}.description`)}</p>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-ink-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </Link>
  )
}
