import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { findModuleByPath, navKeyForPath } from '../../lib/data'
import { useModuleGroups } from '../../lib/useModuleGroups'
import { Badge } from '../ui/Badge'
import { IconTile } from '../ui/IconTile'
import { useCommandPalette } from './CommandPaletteContext'

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const groups = useModuleGroups()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({
        ...group,
        entries: group.entries.filter((entry) =>
          [entry.name, entry.subtitle, entry.description].some((field) => field.toLowerCase().includes(q)),
        ),
      }))
      .filter((group) => group.entries.length > 0)
  }, [groups, query])

  const totalResults = filteredGroups.reduce((sum, g) => sum + g.entries.length, 0)

  if (!isOpen) return null

  function goTo(to: string) {
    navigate(to)
    close()
  }

  const currentModule = findModuleByPath(pathname)
  const currentPageLabel = currentModule ? t(`${currentModule.i18nKey}.name`) : t(`nav.${navKeyForPath(pathname)}`)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/40 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="flex max-h-[72vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{t('command.title')}</h2>
            <p className="mt-0.5 text-sm text-ink-500">{t('command.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="amber">{t('topbar.sandbox')}</Badge>
            <button
              onClick={close}
              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-surface-sunken hover:text-ink-600"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <Search className="size-4 text-ink-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('command.placeholder')}
              className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
            <kbd className="rounded-sm border border-border px-1.5 py-0.5 text-2xs text-ink-400">⌘K</kbd>
          </div>
          <p className="mt-2 text-xs text-ink-400">{t('command.hint')}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {totalResults === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">{t('command.noResults')}</p>
          ) : (
            <div className="space-y-5">
              {filteredGroups.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-400">
                    {group.label} · {t('command.moduleCount', { count: group.entries.length })}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-sunken px-6 py-3 text-xs text-ink-400">
          <span>
            {t('command.currentPage')}: {currentPageLabel}
          </span>
          <span>⌘K {t('command.shortcuts')}</span>
        </div>
      </div>
    </div>
  )
}
