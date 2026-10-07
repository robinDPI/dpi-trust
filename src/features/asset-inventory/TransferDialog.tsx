import { CircleAlert, CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Modal'
import { employees, type Employee, type InventoryAsset } from './data'
import { TYPE_ICON, resolveTarget } from './shared'

interface TransferDialogProps {
  from: Employee
  items: InventoryAsset[]
  onClose: () => void
  onConfirm: (moves: { assetId: string; toId: string }[]) => void
}

export function TransferDialog({ from, items, onClose, onConfirm }: TransferDialogProps) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'inventory' })
  const lang = i18n.language.startsWith('zh') ? 0 : 1
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [bulk, setBulk] = useState('')

  const results = items.map((item) => ({ item, result: resolveTarget(targets[item.id] ?? '', from.id) }))
  const allValid = results.every((r) => r.result.ok)
  const distinctTargets = new Set(results.flatMap((r) => (r.result.ok ? [r.result.employee.id] : []))).size

  const applyBulk = () => setTargets(Object.fromEntries(items.map((item) => [item.id, bulk])))
  const confirm = () =>
    onConfirm(results.flatMap((r) => (r.result.ok ? [{ assetId: r.item.id, toId: r.result.employee.id }] : [])))

  return (
    <Modal
      open
      size="xl"
      title={t('transfer.title')}
      description={t('transfer.desc', { count: items.length, name: from.name[lang] })}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-ink-500">
            {allValid ? t('transfer.summary', { count: items.length, people: distinctTargets }) : t('transfer.incomplete')}
          </span>
          <Button variant="secondary" onClick={onClose}>
            {t('transfer.cancel')}
          </Button>
          <Button variant="primary" disabled={!allValid} onClick={confirm}>
            {t('transfer.confirm')}
          </Button>
        </>
      }
    >
      <datalist id="transfer-targets">
        {employees
          .filter((e) => e.status === 'active' && e.id !== from.id)
          .map((e) => (
            <option key={e.id} value={e.email} label={e.name[lang]} />
          ))}
      </datalist>

      {items.length > 1 && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface-sunken p-3">
          <div className="min-w-64 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('transfer.bulkLabel')}</label>
            <TextInput
              list="transfer-targets"
              value={bulk}
              placeholder={t('transfer.emailPlaceholder')}
              onChange={(e) => setBulk(e.target.value)}
            />
          </div>
          <Button variant="secondary" disabled={!bulk.trim()} onClick={applyBulk}>
            {t('transfer.applyAll')}
          </Button>
        </div>
      )}

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-xs text-ink-400">
            <th className="py-2 pr-3 font-medium">{t('columns.name')}</th>
            <th className="w-[46%] py-2 font-medium">{t('transfer.newOwner')}</th>
          </tr>
        </thead>
        <tbody>
          {results.map(({ item, result }) => {
            const Icon = TYPE_ICON[item.type]
            const touched = !!(targets[item.id] ?? '').trim()
            return (
              <tr key={item.id} className="border-b border-border align-top last:border-0">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-1.5 font-mono text-sm font-medium text-ink-900">
                    <Icon className="size-4 shrink-0 text-ink-400" />
                    <span className="break-all">{item.name}</span>
                  </div>
                  <div className="mt-0.5 pl-[22px] text-xs text-ink-500">{item.desc[lang]}</div>
                </td>
                <td className="py-3">
                  <TextInput
                    compact
                    list="transfer-targets"
                    value={targets[item.id] ?? ''}
                    error={touched && !result.ok}
                    placeholder={t('transfer.emailPlaceholder')}
                    onChange={(e) => setTargets((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                  {touched &&
                    (result.ok ? (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-green-fg">
                        <CircleCheck className="size-3.5" />
                        {result.employee.name[lang]} · {t(`departments.${result.employee.deptKey}`)}
                      </p>
                    ) : (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-fg">
                        <CircleAlert className="size-3.5" />
                        {t(`transfer.errors.${result.reason}`)}
                      </p>
                    ))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-ink-400">{t('transfer.note')}</p>
    </Modal>
  )
}
