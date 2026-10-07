import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-6 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span>{t('modulePage.footerEnv')}</span>
        <span>
          {t('modulePage.synced')} · {t('modulePage.revision')} 18
        </span>
      </div>
    </footer>
  )
}
