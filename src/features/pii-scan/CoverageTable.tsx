import { useTranslation } from 'react-i18next'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Meter } from '../../components/ui/Meter'
import { SecurityBadge } from '../table-management/Badges'
import { isActive, type CoverageRow } from './model'

const STATE_TONE = { untagged: 'rose', partial: 'amber', complete: 'green' } as const

export function CoverageTable({ rows, onView }: { rows: CoverageRow[]; onView: (tableId: string) => void }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'pii' })
  const { t: root } = useTranslation()
  const lang = i18n.language.startsWith('zh') ? 0 : 1
  const th = 'px-4 py-2.5 font-medium'

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
            <th className={th}>{t('coverage.table')}</th>
            <th className={th}>{t('coverage.state.title')}</th>
            <th className={th}>{t('coverage.tagged')}</th>
            <th className={th}>{t('coverage.currentTier')}</th>
            <th className={th}>{t('coverage.aiTier')}</th>
            <th className={th}>{t('coverage.owner')}</th>
            <th className={th}>{t('coverage.open')}</th>
            <th className="w-28 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.table.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-sunken">
              <td className="px-4 py-3 font-mono text-sm font-medium text-ink-900">{r.table.id}</td>
              <td className="px-4 py-3">
                <Badge tone={STATE_TONE[r.state]}>{t(`coverage.state.${r.state}`)}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Meter value={(r.tagged / r.total) * 100} size="sm" tone={r.state === 'complete' ? 'good' : r.state === 'partial' ? 'warning' : 'critical'} />
                  </div>
                  <span className="text-xs tabular-nums text-ink-500">
                    {r.tagged} / {r.total}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">{r.currentTier ? <SecurityBadge level={r.currentTier} /> : <span className="text-xs text-ink-400">{t('untaggedLabel')}</span>}</td>
              <td className="px-4 py-3"><SecurityBadge level={r.aiTier} /></td>
              <td className="px-4 py-3 text-sm text-ink-700">
                {r.owner ? r.owner.name[lang] : '—'}
                {r.owner && !isActive(r.owner) && <span className="ml-1.5 text-xs text-amber-fg">({root(`inventory.status.${r.owner.status}`)})</span>}
              </td>
              <td className="px-4 py-3 text-sm tabular-nums text-ink-900">{r.open}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="secondary" className="h-8 px-3" disabled={r.open === 0 && r.state === 'complete'} onClick={() => onView(r.table.id)}>
                  {t('coverage.view')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border bg-surface-sunken px-4 py-2 text-xs text-ink-400">{t('coverage.tierNote')}</p>
    </div>
  )
}
