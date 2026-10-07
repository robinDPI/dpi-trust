import { useTranslation } from 'react-i18next'

export function Logo() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-[9px] bg-navy-900">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2.5 20 5.75v6.1c0 5.2-3.4 8.9-8 9.65-4.6-.75-8-4.45-8-9.65v-6.1L12 2.5Z"
            fill="#fff"
            fillOpacity="0.16"
          />
          <path
            d="M12 2.5 20 5.75v6.1c0 5.2-3.4 8.9-8 9.65-4.6-.75-8-4.45-8-9.65v-6.1L12 2.5Z"
            stroke="#fff"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8.5 12.2 11 14.7l4.8-5.1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-md font-bold tracking-tight text-ink-900">{t('app.name')}</div>
        <div className="text-2xs font-medium text-ink-400">{t('app.caption')}</div>
      </div>
    </div>
  )
}
