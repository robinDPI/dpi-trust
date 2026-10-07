import { MessageSquareShare, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { SecurityBadge } from '../table-management/Badges'
import { isActive, type FindingRow } from './model'

interface LarkDialogProps {
  rows: FindingRow[]
  onClose: () => void
  onSend: (keys: string[], ownerCount: number) => void
}

export function LarkDialog({ rows, onClose, onSend }: LarkDialogProps) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'pii' })
  const { t: root } = useTranslation()
  const lang = i18n.language.startsWith('zh') ? 0 : 1

  const sendable = rows.filter((r) => isActive(r.owner))
  const skipped = rows.filter((r) => !isActive(r.owner))

  // One Lark card per (owner, table), so an Owner confirms a whole table in one place.
  const cards = new Map<string, { owner: NonNullable<FindingRow['owner']>; tableId: string; rows: FindingRow[] }>()
  sendable.forEach((r) => {
    const id = `${r.owner!.id}|${r.table.id}`
    const card = cards.get(id) ?? { owner: r.owner!, tableId: r.table.id, rows: [] }
    card.rows.push(r)
    cards.set(id, card)
  })
  const ownerCount = new Set(sendable.map((r) => r.owner!.id)).size

  const skippedByOwner = new Map<string, FindingRow[]>()
  skipped.forEach((r) => {
    const id = r.owner?.id ?? 'unknown'
    skippedByOwner.set(id, [...(skippedByOwner.get(id) ?? []), r])
  })

  return (
    <Modal
      open
      size="lg"
      title={t('lark.title')}
      description={t('lark.desc')}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto max-w-sm text-xs text-ink-500">{t('lark.feedbackNote')}</span>
          <Button variant="secondary" onClick={onClose}>
            {t('lark.cancel')}
          </Button>
          <Button
            variant="primary"
            icon={<MessageSquareShare className="size-4" />}
            disabled={sendable.length === 0}
            onClick={() => onSend(sendable.map((r) => r.key), ownerCount)}
          >
            {t('lark.send', { count: cards.size })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {[...cards.values()].map((card) => (
          <div key={`${card.owner.id}|${card.tableId}`} className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-surface-sunken px-4 py-2 text-xs text-ink-500">
              <span>
                {t('lark.to')} <span className="font-medium text-ink-900">{card.owner.name[lang]}</span> · {card.owner.email}
              </span>
              <span>Lark</span>
            </div>
            <div className="border-l-4 border-brand-600 px-4 py-3">
              <p className="text-sm font-semibold text-ink-900">{t('lark.cardTitle')}</p>
              <p className="mt-1 text-sm text-ink-600">
                {t('lark.cardIntro', { table: card.tableId, count: card.rows.length })}
              </p>
              <ul className="mt-3 space-y-1.5">
                {card.rows.map((r) => (
                  <li key={r.key} className="flex flex-wrap items-center gap-2 rounded-md bg-surface-sunken px-3 py-1.5 text-sm">
                    <span className="font-mono font-medium text-ink-900">{r.column.name}</span>
                    {r.currentLevel ? <SecurityBadge level={r.currentLevel} /> : <span className="text-xs text-ink-400">{t('untaggedLabel')}</span>}
                    <span className="text-ink-400">→</span>
                    <SecurityBadge level={r.column.ai.level} />
                    <span className="text-xs text-ink-500">
                      {t(`categories.${r.column.ai.category}`)} · {Math.round(r.column.ai.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2" aria-hidden>
                <span className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white">{t('lark.confirmBtn')}</span>
                <span className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-ink-700">{t('lark.rejectBtn')}</span>
              </div>
            </div>
          </div>
        ))}

        {skipped.length > 0 && (
          <div className="rounded-lg border border-amber-fg/30 bg-amber-bg px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-fg">
              <TriangleAlert className="size-4" />
              {t('lark.skipped', { count: skipped.length })}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
              {[...skippedByOwner.entries()].map(([id, list]) => {
                const owner = list[0].owner
                return (
                  <li key={id} className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium">{owner ? owner.name[lang] : '—'}</span>
                    {owner && <span className="text-ink-500">({root(`inventory.status.${owner.status}`)})</span>}
                    <span className="text-ink-500">· {t('lark.skippedFields', { count: list.length })}</span>
                    {owner && (
                      <Link to={`/governance/asset-inventory?email=${owner.email}`} onClick={onClose} className="text-brand-700 hover:underline">
                        {t('lark.goTransfer')}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
