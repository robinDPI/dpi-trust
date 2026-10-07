import { ArrowRightLeft, Download, Search, ShieldOff, UserSearch, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { cn } from '../../lib/utils'
import { AccessTable, OwnedTable, type GrantRow } from './AssetTables'
import {
  ASSET_TYPES,
  PERMISSION_RANK,
  PRIORITY_RANK,
  assetById,
  employees,
  findEmployeeByEmail,
  priorityOf,
  type AssetType,
  type Employee,
  type InventoryAsset,
} from './data'
import { RevokeDialog } from './RevokeDialog'
import { EMPLOYEE_TONE, TYPE_ICON, dateOf, dateTimeOf, downloadCsv, initials } from './shared'
import { grantsOf, ownedBy, ownerOf, resetInventory, revokeGrants, transferAssets, useInventoryState } from './store'
import { TransferDialog } from './TransferDialog'

type Tab = 'owned' | 'access'

const DEMO_EMAILS = ['kai.zhou@company.com', 'ya.lin@company.com', 'marcus.reed@company.com']

export function AssetInventoryPage() {
  const { t, i18n } = useTranslation()
  const tm = (key: string, options?: Record<string, unknown>) => t(`inventory.${key}`, options)
  const lang = i18n.language.startsWith('zh') ? 0 : 1
  const state = useInventoryState()

  const [params, setParams] = useSearchParams()
  const emailParam = params.get('email') ?? ''
  const employee = emailParam ? findEmployeeByEmail(emailParam) : undefined
  const tab: Tab = params.get('tab') === 'access' ? 'access' : 'owned'
  const requestedType = params.get('type')
  const typeFilter: AssetType | 'all' = ASSET_TYPES.includes(requestedType as AssetType) ? (requestedType as AssetType) : 'all'

  const [input, setInput] = useState(emailParam)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [transferItems, setTransferItems] = useState<InventoryAsset[] | null>(null)
  const [revokeItems, setRevokeItems] = useState<GrantRow[] | null>(null)
  const [notice, setNotice] = useState('')

  const search = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setParams({ email: input.trim() })
    setSelected(new Set())
    setNotice('')
  }
  const searchFor = (email: string) => {
    setInput(email)
    setParams({ email })
    setSelected(new Set())
    setNotice('')
  }
  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)))
    setParams(next)
  }
  const selectTab = (next: Tab) => {
    patchParams({ tab: next === 'owned' ? null : next, type: null })
    setSelected(new Set())
  }

  const owned = useMemo(() => (employee ? ownedBy(employee.id, state) : []), [employee, state])
  const access = useMemo<GrantRow[]>(
    () =>
      employee
        ? grantsOf(employee.id, state).map((g) => {
            const owner = employees.find((e) => e.id === ownerOf(g.asset, state))
            return { ...g, ownerName: owner ? owner.name[lang] : '—' }
          })
        : [],
    [employee, state, lang],
  )
  const highCount = owned.filter((a) => priorityOf(a) === 'high').length

  const ownedRows = useMemo(
    () =>
      owned
        .filter((a) => typeFilter === 'all' || a.type === typeFilter)
        .sort((a, b) => PRIORITY_RANK[priorityOf(a)] - PRIORITY_RANK[priorityOf(b)] || b.impact - a.impact),
    [owned, typeFilter],
  )
  const accessRows = useMemo(
    () =>
      access
        .filter((g) => typeFilter === 'all' || g.asset.type === typeFilter)
        .sort((a, b) => PERMISSION_RANK[a.permission] - PERMISSION_RANK[b.permission] || b.lastUsedDaysAgo - a.lastUsedDaysAgo),
    [access, typeFilter],
  )

  const typeCount = (type: AssetType | 'all') => {
    const types: AssetType[] = tab === 'owned' ? owned.map((x) => x.type) : access.map((x) => x.asset.type)
    return type === 'all' ? types.length : types.filter((x) => x === type).length
  }

  const visibleIds = (tab === 'owned' ? ownedRows : accessRows).map((r) => r.id)
  const selectedIds = visibleIds.filter((id) => selected.has(id))
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = (ids: string[], checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })

  const confirmTransfer = (moves: { assetId: string; toId: string }[]) => {
    if (!employee) return
    transferAssets(employee.id, moves)
    setSelected((prev) => new Set([...prev].filter((id) => !moves.some((m) => m.assetId === id))))
    setTransferItems(null)
    setNotice(tm('notice.transferred', { count: moves.length }))
  }
  const confirmRevoke = () => {
    if (!revokeItems) return
    const ids = revokeItems.map((g) => g.id)
    revokeGrants(ids)
    setSelected((prev) => new Set([...prev].filter((id) => !ids.includes(id))))
    setNotice(tm('notice.revoked', { count: ids.length }))
    setRevokeItems(null)
  }

  const effectiveText = (e: Employee) => {
    if (e.status === 'active' || e.effectiveOffsetDays === undefined) return tm('effective.active')
    return tm(`effective.${e.status}${e.effectiveOffsetDays > 0 ? 'Future' : ''}`, {
      date: dateOf(e.effectiveOffsetDays),
      dept: e.toDeptKey ? tm(`departments.${e.toDeptKey}`) : '',
    })
  }

  const exportCsv = () => {
    if (!employee) return
    if (tab === 'owned') {
      downloadCsv(`asset-inventory-owned-${employee.id}.csv`, [
        [tm('columns.name'), tm('columns.type'), tm('columns.domain'), t('tableMgmt.fields.assetLevel'), t('tableMgmt.fields.securityLevel'), tm('columns.status'), tm('columns.impact'), tm('columns.priority'), tm('columns.updatedAt'), tm('columns.owner')],
        ...ownedRows.map((a) => [
          a.name, tm(`types.${a.type}`), t(`tableMgmt.domains.${a.domain}`), a.assetLevel, a.securityLevel, tm(`runStatus.${a.status}`),
          `${a.impact} ${tm(`impactUnit.${a.type}`)}`, tm(`priority.${priorityOf(a)}`), dateOf(-a.updatedDaysAgo), employee.email,
        ]),
      ])
    } else {
      downloadCsv(`asset-inventory-access-${employee.id}.csv`, [
        [tm('columns.name'), tm('columns.type'), tm('columns.owner'), tm('columns.permission'), tm('columns.security'), tm('columns.grantedAt'), tm('columns.lastUsed'), tm('columns.expires'), tm('columns.holder')],
        ...accessRows.map((g) => [
          g.asset.name, tm(`types.${g.asset.type}`), g.ownerName, tm(`permission.${g.permission}`), g.asset.securityLevel, dateOf(-g.grantedDaysAgo),
          g.lastUsedDaysAgo === 0 ? tm('lastUsed.today') : tm('lastUsed.daysAgo', { count: g.lastUsedDaysAgo }),
          g.expiresInDays === undefined ? tm('expires.never') : dateOf(g.expiresInDays), employee.email,
        ]),
      ])
    }
  }

  const log = employee ? state.log.filter((l) => l.subjectId === employee.id).slice(0, 8) : []
  const notFound = !!emailParam && !employee

  return (
    <>
      <PageHeader
        breadcrumb={tm('breadcrumb')}
        title="Asset Inventory"
        titleSub={t('governanceModules.assetInventory.tag')}
        description={t('governanceModules.assetInventory.description')}
      />

      <Card>
        <form onSubmit={search} className="flex flex-wrap items-end gap-3">
          <div className="min-w-72 flex-1">
            <label htmlFor="inventory-email" className="mb-1.5 block text-xs font-medium text-ink-700">
              {tm('search.label')}
            </label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <Search className="size-4 text-ink-400" />
              <input
                id="inventory-email"
                type="email"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tm('search.placeholder')}
                className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="h-10 px-5" disabled={!input.trim()}>
            {tm('search.button')}
          </Button>
        </form>
        <p className="mt-3 text-xs text-ink-400">
          {tm('search.demo')}{' '}
          {DEMO_EMAILS.map((email) => (
            <button key={email} type="button" onClick={() => searchFor(email)} className="mr-3 font-mono text-brand-700 hover:underline">
              {email}
            </button>
          ))}
        </p>
        {notFound && <p className="mt-3 text-sm text-rose-fg">{tm('search.notFound', { email: emailParam })}</p>}
      </Card>

      {!employee ? (
        !notFound && (
          <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
            <UserSearch className="size-8 text-ink-400" />
            <p className="mt-3 text-md font-semibold text-ink-900">{tm('search.empty.title')}</p>
            <p className="mt-1 max-w-lg text-sm text-ink-500">{tm('search.empty.body')}</p>
          </div>
        )
      ) : (
        <div className="mt-6 space-y-6">
          {notice && (
            <div className="flex items-center justify-between rounded-lg border border-green-fg/30 bg-green-bg px-4 py-2.5 text-sm text-green-fg">
              {notice}
              <button type="button" aria-label="dismiss" onClick={() => setNotice('')} className="rounded p-1 hover:bg-surface/60">
                <X className="size-4" />
              </button>
            </div>
          )}

          <Card bodyClassName="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {initials(employee.name[1])}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink-900">{employee.name[lang]}</h2>
                  <Badge tone={EMPLOYEE_TONE[employee.status]}>{tm(`status.${employee.status}`)}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-ink-500">
                  {employee.email} · {tm(`departments.${employee.deptKey}`)} · {employee.title[lang]}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">{effectiveText(employee)}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs text-ink-400">{tm('summary.owned')}</div>
                <div className="text-2xl font-semibold text-ink-900">{owned.length}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400">{tm('summary.access')}</div>
                <div className="text-2xl font-semibold text-ink-900">{access.length}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400">{tm('summary.high')}</div>
                <div className={cn('text-2xl font-semibold', highCount ? 'text-rose-fg' : 'text-ink-900')}>{highCount}</div>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-2" role="tablist">
            {(['owned', 'access'] as const).map((id) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(id)}
                  className={cn(
                    'flex items-start justify-between gap-4 rounded-lg border px-5 py-4 text-left transition-colors duration-150',
                    active ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600' : 'border-border bg-surface hover:border-border-strong',
                  )}
                >
                  <span>
                    <span className="flex items-center gap-2 text-md font-semibold text-ink-900">
                      {id === 'owned' ? <ArrowRightLeft className="size-4 text-brand-600" /> : <ShieldOff className="size-4 text-brand-600" />}
                      {tm(`tabs.${id}.title`)}
                    </span>
                    <span className="mt-1 block text-xs text-ink-500">{tm(`tabs.${id}.desc`)}</span>
                  </span>
                  <span className="text-2xl font-semibold text-ink-900">{id === 'owned' ? owned.length : access.length}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', ...ASSET_TYPES] as const).map((type) => {
                const Icon = type === 'all' ? null : TYPE_ICON[type]
                const active = typeFilter === type
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patchParams({ type: type === 'all' ? null : type })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150',
                      active ? 'border-brand-600 bg-brand-50 font-medium text-brand-700' : 'border-border bg-surface text-ink-600 hover:border-border-strong hover:bg-surface-sunken',
                    )}
                  >
                    {Icon && <Icon className="size-3.5" />}
                    {tm(`types.${type}`)}
                    <span className={cn('text-xs', active ? 'text-brand-700' : 'text-ink-400')}>{typeCount(type)}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 &&
                (tab === 'owned' ? (
                  <Button
                    variant="primary"
                    icon={<ArrowRightLeft className="size-4" />}
                    onClick={() => setTransferItems(ownedRows.filter((r) => selected.has(r.id)))}
                  >
                    {tm('actions.transferSelected', { count: selectedIds.length })}
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    icon={<ShieldOff className="size-4" />}
                    onClick={() => setRevokeItems(accessRows.filter((r) => selected.has(r.id)))}
                  >
                    {tm('actions.revokeSelected', { count: selectedIds.length })}
                  </Button>
                ))}
              <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv} disabled={visibleIds.length === 0}>
                {tm('summary.export')}
              </Button>
            </div>
          </div>

          {tab === 'owned' ? (
            <OwnedTable rows={ownedRows} selected={selected} onToggle={toggle} onToggleAll={toggleAll} onTransfer={(a) => setTransferItems([a])} />
          ) : (
            <AccessTable rows={accessRows} selected={selected} onToggle={toggle} onToggleAll={toggleAll} onRevoke={(g) => setRevokeItems([g])} />
          )}

          <p className="text-xs text-ink-400">{tab === 'owned' ? tm('priorityRule') : tm('idleRule', { days: 60 })}</p>

          <Card
            title={tm('log.title')}
            actions={
              <Button
                variant="ghost"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  resetInventory()
                  setSelected(new Set())
                  setNotice(tm('notice.reset'))
                }}
              >
                {tm('log.reset')}
              </Button>
            }
          >
            {log.length === 0 ? (
              <p className="text-sm text-ink-400">{tm('log.empty')}</p>
            ) : (
              <ul className="divide-y divide-border">
                {log.map((entry) => {
                  const asset = assetById(entry.assetId)
                  const to = entry.toId ? employees.find((e) => e.id === entry.toId) : undefined
                  return (
                    <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                      <span className="w-36 shrink-0 tabular-nums text-xs text-ink-400">{dateTimeOf(entry.at)}</span>
                      <Badge tone={entry.kind === 'transfer' ? 'brand' : 'rose'}>{tm(`log.kind.${entry.kind}`)}</Badge>
                      <span className="font-mono text-ink-900">{asset?.name ?? entry.assetId}</span>
                      <span className="text-ink-500">
                        {entry.kind === 'transfer' && to
                          ? tm('log.transferTo', { name: to.name[lang], email: to.email })
                          : entry.permission && tm('log.revoked', { permission: tm(`permission.${entry.permission}`) })}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      {employee && transferItems && (
        <TransferDialog from={employee} items={transferItems} onClose={() => setTransferItems(null)} onConfirm={confirmTransfer} />
      )}
      {employee && revokeItems && (
        <RevokeDialog employee={employee} items={revokeItems} onClose={() => setRevokeItems(null)} onConfirm={confirmRevoke} />
      )}
    </>
  )
}
