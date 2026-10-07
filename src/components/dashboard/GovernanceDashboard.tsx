import { ClipboardCheck, Database, Fingerprint, Table2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { Meter } from '../ui/Meter'
import { StatTile } from '../ui/StatTile'

const sensitivityTiers = [
  { key: 'public', value: 420, tint: 'bg-brand-300' },
  { key: 'internal', value: 540, tint: 'bg-brand-500' },
  { key: 'confidential', value: 260, tint: 'bg-brand-700' },
  { key: 'pii', value: 64, tint: 'bg-brand-800' },
] as const

const trendValues = [12, 18, 9, 24, 31, 15, 22]

export function GovernanceDashboard() {
  const { t } = useTranslation()
  const maxTierValue = Math.max(...sensitivityTiers.map((tier) => tier.value))
  const maxTrend = Math.max(...trendValues)
  const trendDays = t('dashboard.trend.days', { returnObjects: true }) as string[]

  return (
    <section>
      <h2 className="text-lg font-semibold text-ink-900">{t('dashboard.title')}</h2>
      <p className="mt-1 text-sm text-ink-500">{t('dashboard.subtitle')}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Database}
          tint="blue"
          label={t('dashboard.stats.totalAssets.label')}
          value="1,284"
          delta={{ label: t('dashboard.stats.totalAssets.delta'), direction: 'up', tone: 'good' }}
        />
        <StatTile
          icon={Table2}
          tint="green"
          label={t('dashboard.stats.governedTables.label')}
          value="862"
          delta={{ label: t('dashboard.stats.governedTables.delta'), direction: 'up', tone: 'good' }}
        />
        <StatTile
          icon={ClipboardCheck}
          tint="slate"
          label={t('dashboard.stats.pendingApprovals.label')}
          value="3"
          status={t('dashboard.stats.pendingApprovals.status')}
        />
        <StatTile
          icon={Fingerprint}
          tint="cyan"
          label={t('dashboard.stats.piiCoverage.label')}
          value="92%"
          delta={{ label: t('dashboard.stats.piiCoverage.delta'), direction: 'up', tone: 'good' }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-ink-900">{t('dashboard.health.title')}</h3>
            <span className="text-xs font-medium text-green-fg">{t('dashboard.health.status')}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-ink-900">88</span>
            <span className="text-sm text-ink-400">/100</span>
          </div>
          <div className="mt-3">
            <Meter value={88} tone="good" />
          </div>
          <p className="mt-2 text-xs text-ink-400">{t('dashboard.health.description')}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-ink-900">{t('dashboard.sensitivity.title')}</h3>
          <div className="mt-4 space-y-3">
            {sensitivityTiers.map((tier) => (
              <div key={tier.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-ink-500">{t(`dashboard.sensitivity.tiers.${tier.key}`)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className={`h-full rounded-full ${tier.tint}`}
                    style={{ width: `${(tier.value / maxTierValue) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-medium text-ink-600">{tier.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-ink-900">{t('dashboard.trend.title')}</h3>
          <p className="mt-1 text-xs text-ink-400">{t('dashboard.trend.subtitle')}</p>
          <div className="mt-4 flex items-end gap-2">
            {trendValues.map((value, i) => {
              const pct = Math.max(6, (value / maxTrend) * 100)
              const isPeak = value === maxTrend
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-20 w-full items-end" title={String(value)}>
                    <div
                      className={cn('w-full rounded-t', isPeak ? 'bg-brand-600' : 'bg-brand-300')}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-2xs text-ink-400">{trendDays[i]}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
