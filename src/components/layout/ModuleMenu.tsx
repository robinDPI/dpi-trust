import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useModuleGroups } from '../../lib/useModuleGroups'
import { Badge } from '../ui/Badge'
import { IconTile } from '../ui/IconTile'
import { Logo } from './Logo'

interface ModuleMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function ModuleMenu({ isOpen, onClose }: ModuleMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const groups = useModuleGroups()

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function goTo(to: string) {
    navigate(to)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-ink-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-r border-border bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 pt-5 pb-4">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-ink-500">{t('moduleMenu.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-surface-sunken hover:text-ink-600"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-7">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="mb-3 flex items-center justify-between text-2xs font-semibold uppercase tracking-wide text-ink-400">
                  <span>{group.label}</span>
                  <span>{t('command.moduleCount', { count: group.entries.length })}</span>
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => goTo(entry.to)}
                      className="group flex items-start gap-3 rounded-md border border-border p-3 text-left transition-colors duration-150 hover:border-border-strong hover:bg-surface-sunken"
                    >
                      <IconTile icon={entry.icon} tint={entry.tint} size="sm" />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-ink-900">{entry.name}</span>
                          {entry.badge && <Badge tone="rose">{entry.badge}</Badge>}
                        </div>
                        <p className="truncate text-xs text-ink-500">{entry.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-sunken px-6 py-3 text-xs text-ink-400">
          <span>{t('moduleMenu.footerHint')}</span>
          <span>⌘K {t('command.shortcuts')}</span>
        </div>
      </div>
    </div>
  )
}
