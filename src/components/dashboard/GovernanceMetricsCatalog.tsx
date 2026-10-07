import { ArrowUpDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Meter, scoreTone } from '../ui/Meter'

interface MetricRow {
  id: string
  categoryKey: string
  score: number
}

const metrics: MetricRow[] = [
  { id: 'ownerCoverage', categoryKey: 'security', score: 86 },
  { id: 'descriptionCompleteness', categoryKey: 'quality', score: 100 },
  { id: 'fieldClassificationCoverage', categoryKey: 'security', score: 96 },
  { id: 'lineageCoverage', categoryKey: 'asset', score: 71 },
  { id: 'piiClassificationAccuracy', categoryKey: 'quality', score: 92 },
  { id: 'approvalSla', categoryKey: 'process', score: 88 },
  { id: 'leastPrivilegeCompliance', categoryKey: 'security', score: 90 },
  { id: 'sensitiveOwnerCoverage', categoryKey: 'security', score: 78 },
  { id: 'qualityCheckPassRate', categoryKey: 'quality', score: 83 },
  { id: 'auditTrailCompleteness', categoryKey: 'compliance', score: 97 },
]

export function GovernanceMetricsCatalog() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = metrics.filter((m) => {
      if (!q) return true
      const name = t(`dashboard.catalog.metrics.${m.id}.name`).toLowerCase()
      return name.includes(q)
    })
    return [...filtered].sort((a, b) => (sortDir === 'asc' ? a.score - b.score : b.score - a.score))
  }, [query, sortDir, t])

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('dashboard.catalog.title')}</h2>
          <p className="mt-1 text-sm text-ink-500">{t('dashboard.catalog.subtitle', { count: metrics.length })}</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search className="size-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('dashboard.catalog.searchPlaceholder')}
            className="w-56 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">{t('dashboard.catalog.columns.metric')}</th>
              <th className="px-4 py-2.5 font-medium">{t('dashboard.catalog.columns.description')}</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">
                <button
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="flex items-center gap-1 transition-colors hover:text-ink-600"
                >
                  {t('dashboard.catalog.columns.score')}
                  <ArrowUpDown className="size-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 align-top">
                  <div className="text-sm font-medium text-ink-900">{t(`dashboard.catalog.metrics.${row.id}.name`)}</div>
                  <div className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-ink-400">
                    {t(`dashboard.catalog.categories.${row.categoryKey}`)}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-sm text-ink-500">
                  {t(`dashboard.catalog.metrics.${row.id}.description`)}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-3">
                    <span className="w-8 shrink-0 text-sm font-semibold text-ink-900">{row.score}</span>
                    <div className="w-28">
                      <Meter value={row.score} tone={scoreTone(row.score)} size="sm" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-400">
                  {t('dashboard.catalog.noResults')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
