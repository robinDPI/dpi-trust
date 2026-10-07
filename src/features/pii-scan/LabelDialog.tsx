import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { ChoiceGroup } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Modal'
import { SECURITY_LEVELS, type SecurityLevel } from '../table-management/model'
import type { FindingRow } from './model'

interface LabelDialogProps {
  row: FindingRow
  onClose: () => void
  onConfirm: (level: SecurityLevel) => void
}

export function LabelDialog({ row, onClose, onConfirm }: LabelDialogProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'pii' })
  const { t: root } = useTranslation()
  const [level, setLevel] = useState<SecurityLevel | ''>(row.column.ai.level)

  return (
    <Modal
      open
      size="md"
      title={t('label.title')}
      description={t('label.desc', { field: `${row.table.id}.${row.column.name}` })}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('label.cancel')}
          </Button>
          <Button variant="primary" disabled={!level} onClick={() => level && onConfirm(level)}>
            {t('label.confirm')}
          </Button>
        </>
      }
    >
      <ChoiceGroup
        options={SECURITY_LEVELS.map((v) => ({ value: v, label: v, name: root(`tableMgmt.security.${v}.name`) }))}
        value={level}
        onChange={setLevel}
        describe={(v) => root(`tableMgmt.security.${v}.desc`)}
      />
      <p className="mt-4 text-sm text-ink-600">{t('label.aiSuggests', { level: row.column.ai.level })}</p>
      <p className="mt-3 text-xs text-ink-400">{t('label.note')}</p>
    </Modal>
  )
}
