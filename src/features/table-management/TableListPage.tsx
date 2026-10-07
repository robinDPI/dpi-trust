import { ChevronRight, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { SelectInput } from '../../components/ui/Form'
import { cn } from '../../lib/utils'
import { AssetBadge, ModeBadge, SecurityBadge, StatusBadge } from './Badges'
import { fullTableName, tableSecurityLevel } from './model'
import { REQUEST_STATUSES, formatDateTime, useTableRequests, type RequestMode, type RequestStatus } from './store'

export const TABLE_MANAGEMENT_PATH = '/governance/table-management'

export function TableListPage() {
  const { t } = useTranslation()
  const tm = (key: string, options?: Record<string, unknown>) => t(`tableMgmt.${key}`, options)
  const requests = useTableRequests()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<RequestStatus | 'all'>('all')
  const [mode, setMode] = useState<RequestMode | 'all'>('all')

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: requests.length }
    REQUEST_STATUSES.forEach((s) => (result[s] = requests.filter((r) => r.status === s).length))
    return result
  }, [requests])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests
      .filter((r) => status === 'all' || r.status === status)
      .filter((r) => mode === 'all' || r.mode === mode)
      .filter(
        (r) =>
          !q ||
          [r.id, fullTableName(r.draft), r.draft.comment, r.creator].some((field) => field.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [requests, query, status, mode])

  const filters: (RequestStatus | 'all')[] = ['all', ...REQUEST_STATUSES]

  return (
    <>
      <PageHeader
        breadcrumb={tm('breadcrumb')}
        title="Table Management"
        titleSub={t('governanceModules.tableManagement.tag')}
        description={t('governanceModules.tableManagement.description')}
        actions={
          <Link
            to={`${TABLE_MANAGEMENT_PATH}/new`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-brand-600 bg-brand-600 px-3.5 text-sm font-medium text-white transition-colors hover:border-brand-700 hover:bg-brand-700"
          >
            <Plus className="size-4" />
            {tm('list.create')}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={status === f}
              onClick={() => setStatus(f)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150',
                status === f
                  ? 'border-brand-600 bg-brand-50 font-medium text-brand-700'
                  : 'border-border bg-surface text-ink-600 hover:border-border-strong hover:bg-surface-sunken',
              )}
            >
              {f === 'all' ? tm('list.allStatus') : tm(`status.${f}`)}
              <span className={cn('text-xs', status === f ? 'text-brand-700' : 'text-ink-400')}>{counts[f]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <Search className="size-4 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tm('list.searchPlaceholder')}
              className="w-64 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
          <SelectInput className="w-40" value={mode} onChange={(e) => setMode(e.target.value as RequestMode | 'all')}>
            <option value="all">{tm('list.allModes')}</option>
            <option value="standard">{tm('modeShort.standard')}</option>
            <option value="ddl">{tm('modeShort.ddl')}</option>
          </SelectInput>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
        <table className="w-full min-w-[1040px] text-left">
          <thead>
            <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.id')}</th>
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.table')}</th>
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.mode')}</th>
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.domain')}</th>
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.levels')}</th>
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.status')}</th>
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.creator')}</th>
              <th className="px-4 py-2.5 font-medium">{tm('list.columns.createdAt')}</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="group border-b border-border last:border-0 transition-colors hover:bg-surface-sunken">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-500">
                  <Link to={`${TABLE_MANAGEMENT_PATH}/${r.id}`} className="hover:text-brand-700 hover:underline">
                    {r.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to={`${TABLE_MANAGEMENT_PATH}/${r.id}`} className="block">
                    <div className="font-mono text-sm font-medium text-ink-900 group-hover:text-brand-700">{fullTableName(r.draft)}</div>
                    <div className="mt-0.5 text-xs text-ink-500">{r.draft.comment}</div>
                  </Link>
                </td>
                <td className="px-4 py-3"><ModeBadge mode={r.mode} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                  {r.draft.domain ? tm(`domains.${r.draft.domain}`) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <AssetBadge level={r.draft.assetLevel} />
                    <SecurityBadge level={tableSecurityLevel(r.draft)} />
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">{r.creator}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-ink-500">{formatDateTime(r.createdAt)}</td>
                <td className="px-2 py-3">
                  <Link
                    to={`${TABLE_MANAGEMENT_PATH}/${r.id}`}
                    aria-label={tm('list.view')}
                    className="flex size-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-surface hover:text-brand-700"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center">
                  <p className="text-sm font-medium text-ink-700">{tm('list.empty')}</p>
                  <p className="mt-1 text-xs text-ink-400">{tm('list.emptyHint')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-400">{tm('list.total', { count: rows.length })}</p>
    </>
  )
}
