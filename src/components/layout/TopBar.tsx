import { BookOpen, ChevronDown, Menu, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCommandPalette } from '../command/CommandPaletteContext'
import { Badge } from '../ui/Badge'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { t } = useTranslation()
  const { open } = useCommandPalette()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          title={t('topbar.allModules')}
          className="rounded-md p-2 text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-700"
        >
          <Menu className="size-5" />
        </button>

        <Logo />

        <button
          onClick={open}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface-sunken px-3.5 py-2 text-left text-ink-400 transition-colors hover:border-border-strong"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate text-sm">{t('topbar.searchPlaceholder')}</span>
          <kbd className="hidden shrink-0 rounded-sm border border-border bg-surface px-1.5 py-0.5 text-2xs font-medium text-ink-400 sm:inline-block">
            ⌘K
          </kbd>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <Badge tone="amber">{t('topbar.sandbox')}</Badge>

          <LanguageSwitcher />

          <button className="flex items-center gap-2 rounded-md border border-border py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-border-strong hover:bg-surface-sunken">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-2xs font-bold text-brand-700">
              AC
            </span>
            <span className="hidden flex-col leading-tight text-left sm:flex">
              <span className="text-xs font-semibold text-ink-700">{t('user.name')}</span>
              <span className="text-2xs text-ink-400">
                {t('topbar.roleLabel')} · {t('user.role')}
              </span>
            </span>
            <ChevronDown className="size-3.5 text-ink-400" />
          </button>

          <button
            className="rounded-md p-2 text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-700"
            title={t('topbar.docs')}
          >
            <BookOpen className="size-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
