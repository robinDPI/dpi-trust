import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const options: { code: 'zh' | 'en'; label: string }[] = [
    { code: 'zh', label: '中' },
    { code: 'en', label: 'EN' },
  ]

  return (
    <div className="flex items-center rounded-md border border-border bg-surface-sunken p-0.5">
      {options.map((option) => (
        <button
          key={option.code}
          onClick={() => i18n.changeLanguage(option.code)}
          className={cn(
            'rounded-[7px] px-2.5 py-1 text-xs font-semibold transition-colors duration-150',
            i18n.language === option.code ? 'bg-surface text-brand-700 shadow-xs' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
