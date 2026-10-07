import { Link2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ModuleSection } from '../components/ui/ModuleSection'
import { moduleGroups, type NavKey } from '../lib/data'

export function ModulePage({ navKey }: { navKey: NavKey }) {
  const { t } = useTranslation()
  const groups = moduleGroups.filter((g) => g.nav === navKey)

  return (
    <>
      <PageHeader
        breadcrumb={`TRUST / ${t(`nav.${navKey}`)}`}
        title={t(`nav.${navKey}`)}
        description={t(`modulePage.descriptions.${navKey}`)}
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw className="size-4" />}>
              {t('modulePage.refresh')}
            </Button>
            <Button variant="secondary" icon={<Link2 className="size-4" />}>
              {t('modulePage.configureEntry')}
            </Button>
          </>
        }
      />

      <div className="space-y-10">
        {groups.map((group) => (
          <ModuleSection key={group.id} titleKey={group.categoryKey} items={group.items} showTitle={groups.length > 1} />
        ))}
      </div>
    </>
  )
}
