import type { LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { moduleGroups, navRoutes, type Tint } from './data'

export interface ModuleEntry {
  id: string
  icon: LucideIcon
  tint: Tint
  name: string
  subtitle: string
  description: string
  badge?: string
  to: string
}

export interface ModuleEntryGroup {
  id: string
  label: string
  to: string
  entries: ModuleEntry[]
}

export function useModuleGroups(): ModuleEntryGroup[] {
  const { t } = useTranslation()

  return useMemo(
    () =>
      moduleGroups.map((group) => ({
        id: group.id,
        label: t(group.categoryKey),
        to: navRoutes[group.nav],
        entries: group.items.map((item) => ({
          id: item.id,
          icon: item.icon,
          tint: item.tint,
          name: t(`${item.i18nKey}.name`),
          subtitle: t(`${item.i18nKey}.tag`),
          description: t(`${item.i18nKey}.description`),
          badge: t(`${item.i18nKey}.badge`, { defaultValue: '' }),
          to: item.path,
        })),
      })),
    [t],
  )
}
