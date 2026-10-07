import { ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Meter } from '../../components/ui/Meter'
import { cn } from '../../lib/utils'
import { SecurityBadge } from '../table-management/Badges'
import { isActive, type FindingRow } from './model'
import type { IssueType } from './data'

const ISSUE_TONE: Record<IssueType, 'rose' | 'amber' | 'neutral'> = { underrated: 'rose', untagged: 'amber', overrated: 'neutral' }
const STATUS_TONE = { open: 'amber', awaiting: 'brand', confirmed: 'green', rejected: 'neutral', updated: 'green' } as const

interface FindingsTableProps {
  rows: FindingRow[]
  selected: Set<string>
  onToggle: (key: string) => void
  onToggleAll: (keys: string[], checked: boolean) => void
  onNotify: (row: FindingRow) => void
  onUpdate: (row: FindingRow) => void
  onReply: (key: string, decision: 'confirm' | 'reject') => void
}

const th = 'px-3 py-2.5 font-medium'

export function FindingsTable({ rows, selected, onToggle, onToggleAll, onNotify, onUpdate, onReply }: FindingsTableProps) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'pii' })
  const { t: root } = useTranslation()
  const lang = i18n.language.startsWith('zh') ? 0 : 1
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const selectable = rows.filter((r) => r.status === 'open').map((r) => r.key)
  const allSelected = selectable.length > 0 && selectable.every((k) => selected.has(k))

  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[1180px] text-left">
        <thead>
          <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
            <th className="w-10 px-3 py-2.5">
              <input
                type="checkbox"
                aria-label="select all"
                className="size-4 accent-brand-600"
                checked={allSelected}
                disabled={selectable.length === 0}
                onChange={(e) => onToggleAll(selectable, e.target.checked)}
              />
            </th>
            <th className={th}>{t('columns.field')}</th>
            <th className={th}>{t('columns.issue')}</th>
            <th className={th}>{t('columns.level')}</th>
            <th className={th}>{t('columns.category')}</th>
            <th className={th}>{t('columns.owner')}</th>
            <th className={th}>{t('columns.status')}</th>
            <th className={cn(th, 'text-right')}>{t('columns.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const open = expanded.has(r.key)
            const canNotify = isActive(r.owner)
            return (
              <Fragment key={r.key}>
                <tr className={cn('border-b border-border transition-colors hover:bg-surface-sunken', open && 'bg-surface-sunken', !open && 'last:border-0')}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`${r.table.id}.${r.column.name}`}
                      className="size-4 accent-brand-600 disabled:opacity-30"
                      checked={selected.has(r.key)}
                      disabled={r.status !== 'open'}
                      onChange={() => onToggle(r.key)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => toggleExpanded(r.key)} aria-expanded={open} className="flex items-start gap-1.5 text-left">
                      <ChevronRight className={cn('mt-0.5 size-4 shrink-0 text-ink-400 transition-transform', open && 'rotate-90')} />
                      <span>
                        <span className="block font-mono text-sm font-semibold text-ink-900">{r.column.name}</span>
                        <span className="block font-mono text-xs text-ink-500">{r.table.id}</span>
                        <span className="block text-xs text-ink-400">
                          {r.column.type} · {r.column.comment[lang]}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={ISSUE_TONE[r.issue]}>{t(`issue.${r.issue}`)}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {r.currentLevel ? <SecurityBadge level={r.currentLevel} /> : <span className="text-xs text-ink-400">{t('untaggedLabel')}</span>}
                      <span className="text-ink-400">→</span>
                      <SecurityBadge level={r.column.ai.level} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-ink-900">{t(`categories.${r.column.ai.category}`)}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-14">
                        <Meter value={r.column.ai.confidence * 100} size="sm" tone={r.column.ai.confidence >= 0.9 ? 'good' : r.column.ai.confidence >= 0.75 ? 'brand' : 'warning'} />
                      </div>
                      <span className="text-xs tabular-nums text-ink-500">{Math.round(r.column.ai.confidence * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <div className="text-ink-900">{r.owner ? r.owner.name[lang] : '—'}</div>
                    {r.owner && !canNotify && <Badge tone="amber">{root(`inventory.status.${r.owner.status}`)}</Badge>}
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_TONE[r.status]}>{t(`status.${r.status}`)}</Badge>
                    {r.status !== 'open' && r.status !== 'awaiting' && r.status !== 'rejected' && r.currentLevel && (
                      <div className="mt-1 text-xs text-ink-500">→ {r.currentLevel}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {r.status === 'open' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          className="h-8 px-3"
                          disabled={!canNotify}
                          title={canNotify ? undefined : t('owner.cannotNotify')}
                          onClick={() => onNotify(r)}
                        >
                          {t('actions.notify')}
                        </Button>
                        <Button variant="secondary" className="h-8 px-3" onClick={() => onUpdate(r)}>
                          {t('actions.update')}
                        </Button>
                      </div>
                    )}
                    {r.status === 'awaiting' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="mr-1 rounded bg-surface-sunken px-1.5 py-0.5 text-2xs font-medium text-ink-500" title={t('actions.demoTip')}>
                          {t('actions.demo')}
                        </span>
                        <Button variant="secondary" className="h-8 px-2.5" onClick={() => onReply(r.key, 'confirm')}>
                          {t('actions.confirm')}
                        </Button>
                        <Button variant="ghost" className="h-8 px-2.5" onClick={() => onReply(r.key, 'reject')}>
                          {t('actions.reject')}
                        </Button>
                      </div>
                    )}
                    {r.status === 'rejected' && <span className="text-xs text-ink-500">{t('states.rejected', { level: r.currentLevel || t('untaggedLabel') })}</span>}
                    {(r.status === 'confirmed' || r.status === 'updated') && <span className="text-xs text-ink-500">{t(`states.${r.status}`, { level: r.currentLevel })}</span>}
                  </td>
                </tr>
                {open && (
                  <tr className="border-b border-border bg-surface-sunken last:border-0">
                    <td />
                    <td colSpan={7} className="px-3 pb-4 pt-1">
                      <div className="grid gap-4 rounded-md border border-border bg-surface p-4 md:grid-cols-[1fr_auto]">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('evidence.title')}</p>
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-ink-700">
                            {r.column.ai.signals.length ? r.column.ai.signals.map((s, i) => <li key={i}>{s[lang]}</li>) : <li>{t('evidence.none')}</li>}
                          </ul>
                          <p className="mt-2 text-xs text-ink-400">{t(`issueHint.${r.issue}`)}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('evidence.sample')}</p>
                          <code className="mt-2 block rounded bg-navy-900 px-3 py-1.5 font-mono text-xs text-brand-100">{r.column.ai.sample}</code>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-sm text-ink-400">
                {t('empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
