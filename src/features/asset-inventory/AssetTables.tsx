import { useTranslation } from 'react-i18next'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { AssetBadge, SecurityBadge } from '../table-management/Badges'
import { IDLE_DAYS, priorityOf, type Grant, type InventoryAsset } from './data'
import { PERMISSION_TONE, PRIORITY_TONE, STATUS_TONE, TYPE_ICON, dateOf } from './shared'

interface SelectionProps {
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], checked: boolean) => void
}

function HeaderCheckbox({ ids, selected, onToggleAll }: { ids: string[] } & Pick<SelectionProps, 'selected' | 'onToggleAll'>) {
  const all = ids.length > 0 && ids.every((id) => selected.has(id))
  return (
    <input
      type="checkbox"
      aria-label="select all"
      className="size-4 accent-brand-600"
      checked={all}
      disabled={ids.length === 0}
      onChange={(e) => onToggleAll(ids, e.target.checked)}
    />
  )
}

function useLang() {
  const { i18n } = useTranslation()
  return i18n.language.startsWith('zh') ? 0 : 1
}

const th = 'px-4 py-2.5 font-medium'

export function OwnedTable({
  rows,
  onTransfer,
  ...selection
}: { rows: InventoryAsset[]; onTransfer: (asset: InventoryAsset) => void } & SelectionProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'inventory' })
  const { t: root } = useTranslation()
  const lang = useLang()

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[1120px] text-left">
        <thead>
          <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
            <th className="w-10 px-4 py-2.5">
              <HeaderCheckbox ids={rows.map((r) => r.id)} selected={selection.selected} onToggleAll={selection.onToggleAll} />
            </th>
            <th className={th}>{t('columns.name')}</th>
            <th className={th}>{t('columns.type')}</th>
            <th className={th}>{t('columns.domain')}</th>
            <th className={th}>{t('columns.levels')}</th>
            <th className={th}>{t('columns.status')}</th>
            <th className={th}>{t('columns.impact')}</th>
            <th className={th}>{t('columns.priority')}</th>
            <th className={th}>{t('columns.updatedAt')}</th>
            <th className="w-24 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const Icon = TYPE_ICON[a.type]
            const priority = priorityOf(a)
            return (
              <tr key={a.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-sunken">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={a.name}
                    className="size-4 accent-brand-600"
                    checked={selection.selected.has(a.id)}
                    onChange={() => selection.onToggle(a.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-sm font-medium text-ink-900">{a.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{a.desc[lang]}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink-700">
                    <Icon className="size-4 text-ink-400" />
                    {t(`types.${a.type}`)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">{root(`tableMgmt.domains.${a.domain}`)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <AssetBadge level={a.assetLevel} />
                    <SecurityBadge level={a.securityLevel} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[a.status]}>{t(`runStatus.${a.status}`)}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                  <span className="font-semibold text-ink-900">{a.impact}</span> {t(`impactUnit.${a.type}`)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={PRIORITY_TONE[priority]}>{t(`priority.${priority}`)}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-ink-500">{dateOf(-a.updatedDaysAgo)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" className="h-8 px-3" onClick={() => onTransfer(a)}>
                    {t('actions.transfer')}
                  </Button>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-sm text-ink-400">
                {t('ownedEmpty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export type GrantRow = Grant & { asset: InventoryAsset; ownerName: string }

export function AccessTable({
  rows,
  onRevoke,
  ...selection
}: { rows: GrantRow[]; onRevoke: (grant: GrantRow) => void } & SelectionProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'inventory' })
  const lang = useLang()

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[1120px] text-left">
        <thead>
          <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
            <th className="w-10 px-4 py-2.5">
              <HeaderCheckbox ids={rows.map((r) => r.id)} selected={selection.selected} onToggleAll={selection.onToggleAll} />
            </th>
            <th className={th}>{t('columns.name')}</th>
            <th className={th}>{t('columns.type')}</th>
            <th className={th}>{t('columns.owner')}</th>
            <th className={th}>{t('columns.permission')}</th>
            <th className={th}>{t('columns.security')}</th>
            <th className={th}>{t('columns.grantedAt')}</th>
            <th className={th}>{t('columns.lastUsed')}</th>
            <th className={th}>{t('columns.expires')}</th>
            <th className="w-24 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => {
            const Icon = TYPE_ICON[g.asset.type]
            const idle = g.lastUsedDaysAgo >= IDLE_DAYS
            return (
              <tr key={g.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-sunken">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={g.asset.name}
                    className="size-4 accent-brand-600"
                    checked={selection.selected.has(g.id)}
                    onChange={() => selection.onToggle(g.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-sm font-medium text-ink-900">{g.asset.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{g.asset.desc[lang]}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink-700">
                    <Icon className="size-4 text-ink-400" />
                    {t(`types.${g.asset.type}`)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">{g.ownerName}</td>
                <td className="px-4 py-3">
                  <Badge tone={PERMISSION_TONE[g.permission]}>{t(`permission.${g.permission}`)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <AssetBadge level={g.asset.assetLevel} />
                    <SecurityBadge level={g.asset.securityLevel} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-ink-500">{dateOf(-g.grantedDaysAgo)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                  <span className="mr-1.5">{g.lastUsedDaysAgo === 0 ? t('lastUsed.today') : t('lastUsed.daysAgo', { count: g.lastUsedDaysAgo })}</span>
                  {idle && <Badge tone="amber">{t('lastUsed.idle')}</Badge>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-ink-500">
                  {g.expiresInDays === undefined ? t('expires.never') : dateOf(g.expiresInDays)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" className="h-8 px-3 hover:border-rose-fg hover:text-rose-fg" onClick={() => onRevoke(g)}>
                    {t('actions.revoke')}
                  </Button>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-sm text-ink-400">
                {t('accessEmpty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
