import { useTranslation } from 'react-i18next'
import type { ModuleItem } from '../../lib/data'
import { ModuleCard } from './ModuleCard'

interface ModuleSectionProps {
  titleKey: string
  items: ModuleItem[]
  showTitle?: boolean
}

export function ModuleSection({ titleKey, items, showTitle = true }: ModuleSectionProps) {
  const { t } = useTranslation()
  return (
    <section>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">{t(titleKey)}</h2>
          <span className="text-xs text-ink-400">{t('command.moduleCount', { count: items.length })}</span>
        </div>
      )}
      <div className={showTitle ? 'mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        {items.map((item) => (
          <ModuleCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
