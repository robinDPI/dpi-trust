import { Link2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GovernanceDashboard } from '../components/dashboard/GovernanceDashboard'
import { GovernanceMetricsCatalog } from '../components/dashboard/GovernanceMetricsCatalog'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'

export function Home() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        breadcrumb={t('home.breadcrumb')}
        title={t('home.title')}
        titleSub={t('home.titleSub')}
        description={t('home.description')}
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw className="size-4" />}>
              {t('home.refresh')}
            </Button>
            <Button variant="secondary" icon={<Link2 className="size-4" />}>
              {t('home.configureEntry')}
            </Button>
          </>
        }
      />

      <div className="mb-10">
        <GovernanceDashboard />
      </div>

      <GovernanceMetricsCatalog />
    </>
  )
}
