import { Check, MessageSquareShare, ScanSearch, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Meter } from '../../components/ui/Meter'
import { SelectInput } from '../../components/ui/Form'
import { cn } from '../../lib/utils'
import { useInventoryState } from '../asset-inventory/store'
import { dateTimeOf } from '../asset-inventory/shared'
import type { SecurityLevel } from '../table-management/model'
import { CoverageTable } from './CoverageTable'
import type { IssueType } from './data'
import { FindingsTable } from './FindingsTable'
import { LabelDialog } from './LabelDialog'
import { LarkDialog } from './LarkDialog'
import { buildCoverage, buildRows, sortRows, visibleTables, type FindingRow } from './model'
import { accuracyOf, baselineRate, completeScan, manualUpdate, markNotified, ownerReply, resetPiiScan, usePiiState } from './store'

type Tab = 'fields' | 'tables'
type StatusFilter = 'all' | 'open' | 'awaiting' | 'done'

const ISSUES: (IssueType | 'all')[] = ['all', 'underrated', 'untagged', 'overrated']
const SCAN_STEPS = 4
const STEP_MS = 650

export function PiiScanPage() {
  const { t } = useTranslation()
  const tp = (key: string, options?: Record<string, unknown>) => t(`pii.${key}`, options)
  const pii = usePiiState()
  const inv = useInventoryState()

  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'tables' ? 'tables' : 'fields'
  const issueParam = params.get('issue')
  const issueFilter: IssueType | 'all' = ISSUES.includes(issueParam as IssueType) ? (issueParam as IssueType) : 'all'
  const statusParam = params.get('status')
  const statusFilter: StatusFilter = ['open', 'awaiting', 'done'].includes(statusParam ?? '') ? (statusParam as StatusFilter) : 'all'
  const tableFilter = params.get('table') ?? ''

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [larkRows, setLarkRows] = useState<FindingRow[] | null>(null)
  const [labelRow, setLabelRow] = useState<FindingRow | null>(null)
  const [notice, setNotice] = useState('')
  const [scanStep, setScanStep] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearInterval(timer.current), [])

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)))
    setParams(next)
  }

  const allRows = useMemo(() => buildRows(pii, inv), [pii, inv])
  const coverage = useMemo(() => buildCoverage(pii, inv), [pii, inv])
  const tables = visibleTables(pii)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortRows(
      allRows
        .filter((r) => issueFilter === 'all' || r.issue === issueFilter)
        .filter((r) => !tableFilter || r.table.id === tableFilter)
        .filter((r) => {
          if (statusFilter === 'all') return true
          if (statusFilter === 'done') return r.status !== 'open' && r.status !== 'awaiting'
          return r.status === statusFilter
        })
        .filter((r) => !q || `${r.table.id}.${r.column.name}`.toLowerCase().includes(q) || r.owner?.name.some((n) => n.toLowerCase().includes(q))),
    )
  }, [allRows, issueFilter, statusFilter, tableFilter, query])

  const open = allRows.filter((r) => r.status === 'open')
  const awaiting = allRows.filter((r) => r.status === 'awaiting')
  const accuracy = accuracyOf(pii.feedback)
  const deltaPoints = (accuracy.rate - baselineRate) * 100
  const issueCount = (issue: IssueType | 'all') => allRows.filter((r) => issue === 'all' || r.issue === issue).length
  const selectedRows = rows.filter((r) => selected.has(r.key) && r.status === 'open')
  const scanning = scanStep !== null

  const startScan = () => {
    if (scanning) return
    setNotice('')
    setScanStep(0)
    let step = 0
    timer.current = window.setInterval(() => {
      step += 1
      if (step >= SCAN_STEPS) {
        window.clearInterval(timer.current)
        setScanStep(null)
        const found = completeScan()
        setNotice(found ? tp('scan.done.found', { count: found }) : tp('scan.done.none'))
      } else {
        setScanStep(step)
      }
    }, STEP_MS)
  }

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const toggleAll = (keys: string[], checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => (checked ? next.add(k) : next.delete(k)))
      return next
    })

  const sendLark = (keys: string[], owners: number) => {
    markNotified(keys)
    setSelected((prev) => new Set([...prev].filter((k) => !keys.includes(k))))
    setLarkRows(null)
    setNotice(tp('notice.notified', { owners, count: keys.length }))
  }
  const reply = (key: string, decision: 'confirm' | 'reject') => {
    const row = allRows.find((r) => r.key === key)
    ownerReply(key, decision)
    setNotice(decision === 'confirm' ? tp('notice.confirmed', { level: row?.column.ai.level }) : tp('notice.rejected'))
  }
  const applyLabel = (level: SecurityLevel) => {
    if (!labelRow) return
    manualUpdate(labelRow.key, level)
    setLabelRow(null)
    setNotice(tp('notice.updated', { level }))
  }

  const statusOptions: StatusFilter[] = ['all', 'open', 'awaiting', 'done']
  const total = tables.reduce((n, x) => n + x.columns.length, 0)

  return (
    <>
      <PageHeader
        breadcrumb={tp('breadcrumb')}
        title="PII Scan"
        titleSub={t('governanceModules.piiScan.tag')}
        description={t('governanceModules.piiScan.description')}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-400">{tp('scan.last', { time: dateTimeOf(pii.lastScanAt) })}</span>
            <Button variant="primary" icon={<ScanSearch className="size-4" />} onClick={startScan} disabled={scanning}>
              {scanning ? tp('scan.running') : tp('scan.run')}
            </Button>
          </div>
        }
      />

      {scanning && (
        <Card className="mb-6" bodyClassName="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink-900">{tp(`scan.step${scanStep}`)}</span>
            <span className="text-xs text-ink-400">
              {scanStep + 1} / {SCAN_STEPS}
            </span>
          </div>
          <div className="mt-2">
            <Meter value={((scanStep + 1) / SCAN_STEPS) * 100} />
          </div>
        </Card>
      )}

      {notice && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-green-fg/30 bg-green-bg px-4 py-2.5 text-sm text-green-fg">
          {notice}
          <button type="button" aria-label="dismiss" onClick={() => setNotice('')} className="rounded p-1 hover:bg-surface/60">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <p className="text-sm text-ink-500">{tp('kpi.scanned')}</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{tp('kpi.scannedValue', { tables: tables.length, columns: total })}</p>
          <p className="mt-1 text-xs text-ink-400">{tp('kpi.scannedSub', { count: coverage.filter((c) => c.state === 'untagged').length })}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <p className="text-sm text-ink-500">{tp('kpi.open')}</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{open.length}</p>
          <p className="mt-1 text-xs text-ink-400">
            {tp('kpi.openSub', { mislabeled: open.filter((r) => r.issue !== 'untagged').length, untagged: open.filter((r) => r.issue === 'untagged').length })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <p className="text-sm text-ink-500">{tp('kpi.awaiting')}</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{awaiting.length}</p>
          <p className="mt-1 text-xs text-ink-400">{tp('kpi.awaitingSub')}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <p className="text-sm text-ink-500">{tp('kpi.accuracy')}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink-900" data-testid="accuracy">{(accuracy.rate * 100).toFixed(1)}%</span>
            <span className={cn('text-xs font-medium', deltaPoints > 0.05 ? 'text-green-fg' : deltaPoints < -0.05 ? 'text-rose-fg' : 'text-ink-400')}>
              {deltaPoints > 0.05 ? '↑' : deltaPoints < -0.05 ? '↓' : ''} {tp('kpi.accuracyDelta', { delta: `${deltaPoints >= 0 ? '+' : ''}${deltaPoints.toFixed(1)}` })}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-400">{tp('kpi.accuracySub', { total: accuracy.total, confirmed: accuracy.confirmed, rejected: accuracy.rejected })}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 border-b border-border" role="tablist">
        {(['fields', 'tables'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => patchParams({ tab: id === 'fields' ? null : id, table: null })}
            className={cn(
              'relative -mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
              tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-700',
            )}
          >
            {tp(`tabs.${id}`)}
            <span className="ml-1.5 text-xs text-ink-400">{id === 'fields' ? allRows.length : coverage.length}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === 'tables' ? (
          <CoverageTable rows={coverage} onView={(id) => patchParams({ tab: null, table: id })} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {ISSUES.map((issue) => (
                  <button
                    key={issue}
                    type="button"
                    aria-pressed={issueFilter === issue}
                    onClick={() => patchParams({ issue: issue === 'all' ? null : issue })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                      issueFilter === issue ? 'border-brand-600 bg-brand-50 font-medium text-brand-700' : 'border-border bg-surface text-ink-600 hover:border-border-strong hover:bg-surface-sunken',
                    )}
                  >
                    {tp(`issue.${issue}`)}
                    <span className={cn('text-xs', issueFilter === issue ? 'text-brand-700' : 'text-ink-400')}>{issueCount(issue)}</span>
                  </button>
                ))}
                {tableFilter && (
                  <button
                    type="button"
                    onClick={() => patchParams({ table: null })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-600 bg-brand-50 px-3 py-1.5 font-mono text-xs text-brand-700"
                  >
                    {tableFilter}
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                  <Search className="size-4 text-ink-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tp('search')}
                    className="w-52 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                  />
                </div>
                <SelectInput className="w-36" value={statusFilter} onChange={(e) => patchParams({ status: e.target.value === 'all' ? null : e.target.value })}>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {tp(`statusFilter.${s}`)}
                    </option>
                  ))}
                </SelectInput>
                {selectedRows.length > 0 && (
                  <Button variant="primary" icon={<MessageSquareShare className="size-4" />} onClick={() => setLarkRows(selectedRows)}>
                    {tp('actions.notifySelected', { count: selectedRows.length })}
                  </Button>
                )}
              </div>
            </div>

            <FindingsTable
              rows={rows}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onNotify={(r) => setLarkRows([r])}
              onUpdate={setLabelRow}
              onReply={reply}
            />
            <p className="text-xs text-ink-400">{tp('total', { count: rows.length })} · {tp('flowNote')}</p>
          </>
        )}

        <Card
          title={tp('log.title')}
          actions={
            <Button
              variant="ghost"
              className="h-8 px-2.5 text-xs"
              onClick={() => {
                resetPiiScan()
                setSelected(new Set())
                setNotice(tp('notice.reset'))
              }}
            >
              {tp('log.reset')}
            </Button>
          }
        >
          {pii.log.length === 0 ? (
            <p className="text-sm text-ink-400">{tp('log.empty')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {pii.log.slice(0, 8).map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className="w-36 shrink-0 text-xs tabular-nums text-ink-400">{dateTimeOf(entry.at)}</span>
                  <Badge tone={entry.kind === 'rejected' ? 'neutral' : entry.kind === 'notified' ? 'brand' : 'green'}>{tp(`log.kind.${entry.kind}`)}</Badge>
                  <span className="font-mono text-ink-900">{entry.key}</span>
                  {entry.level && <span className="flex items-center gap-1 text-ink-500"><Check className="size-3.5" /> {entry.level}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {larkRows && <LarkDialog rows={larkRows} onClose={() => setLarkRows(null)} onSend={sendLark} />}
      {labelRow && <LabelDialog row={labelRow} onClose={() => setLabelRow(null)} onConfirm={applyLabel} />}
    </>
  )
}
