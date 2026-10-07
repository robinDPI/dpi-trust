import { useTranslation } from 'react-i18next'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import type { Employee, Grant, InventoryAsset } from './data'
import { PERMISSION_TONE, TYPE_ICON } from './shared'

interface RevokeDialogProps {
  employee: Employee
  items: (Grant & { asset: InventoryAsset })[]
  onClose: () => void
  onConfirm: () => void
}

export function RevokeDialog({ employee, items, onClose, onConfirm }: RevokeDialogProps) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'inventory' })
  const lang = i18n.language.startsWith('zh') ? 0 : 1

  return (
    <Modal
      open
      size="md"
      title={t('revoke.title')}
      description={t('revoke.desc', { count: items.length, name: employee.name[lang] })}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('revoke.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {t('revoke.confirm')}
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-border">
        {items.map(({ id, asset, permission }) => {
          const Icon = TYPE_ICON[asset.type]
          return (
            <li key={id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-center gap-1.5 font-mono text-sm text-ink-900">
                <Icon className="size-4 shrink-0 text-ink-400" />
                <span className="break-all">{asset.name}</span>
              </span>
              <Badge tone={PERMISSION_TONE[permission]}>{t(`permission.${permission}`)}</Badge>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-ink-400">{t('revoke.note')}</p>
    </Modal>
  )
}
