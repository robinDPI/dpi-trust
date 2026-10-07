import { ArrowLeft, Hammer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { IconTile } from '../components/ui/IconTile'
import { allModules, navRoutes } from '../lib/data'

export function ModulePlaceholder({ moduleId }: { moduleId: string }) {
  const { t } = useTranslation()
  const mod = allModules.find((m) => m.id === moduleId)
  if (!mod) return null

  const navLabel = t(`nav.${mod.nav}`)

  return (
    <>
      <PageHeader
        breadcrumb={`TRUST / ${navLabel} / ${t(`${mod.i18nKey}.name`)}`}
        title={t(`${mod.i18nKey}.name`)}
        titleSub={t(`${mod.i18nKey}.tag`)}
        description={t(`${mod.i18nKey}.description`)}
      />

      <div className="flex flex-col items-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
        <IconTile icon={mod.icon} tint={mod.tint} />
        <div className="mt-4 flex items-center gap-1.5 text-md font-semibold text-ink-900">
          <Hammer className="size-4 text-ink-400" />
          {t('placeholder.title')}
        </div>
        <p className="mt-2 max-w-md text-sm text-ink-500">{t('placeholder.body')}</p>
        <Link
          to={navRoutes[mod.nav]}
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-ink-700 transition-colors hover:border-border-strong hover:bg-surface-sunken"
        >
          <ArrowLeft className="size-4" />
          {t('placeholder.back', { nav: navLabel })}
        </Link>
      </div>
    </>
  )
}
