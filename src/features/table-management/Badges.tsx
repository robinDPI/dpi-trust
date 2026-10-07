import { useTranslation } from 'react-i18next'
import { Badge } from '../../components/ui/Badge'
import type { AssetLevel, SecurityLevel } from './model'
import type { RequestMode, RequestStatus } from './store'

const statusTone = { pending: 'amber', approved: 'brand', rejected: 'rose', created: 'green' } as const
const securityTone = { L0: 'neutral', L1: 'brand', L2: 'amber', L3: 'rose' } as const

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  return <Badge tone={statusTone[status]}>{t(`status.${status}`)}</Badge>
}

export function ModeBadge({ mode }: { mode: RequestMode }) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  return <Badge tone="neutral">{t(`modeShort.${mode}`)}</Badge>
}

export function SecurityBadge({ level }: { level: SecurityLevel | '' }) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  if (!level) return <span className="text-ink-400">—</span>
  return (
    <span title={t(`security.${level}.name`)}>
      <Badge tone={securityTone[level]}>{level}</Badge>
    </span>
  )
}

export function AssetBadge({ level }: { level: AssetLevel | '' }) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  if (!level) return <span className="text-ink-400">—</span>
  return (
    <span title={t(`asset.${level}.name`)}>
      <Badge tone={level === 'P3' ? 'brand' : 'neutral'}>{level}</Badge>
    </span>
  )
}
