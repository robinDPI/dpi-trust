import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const items = [
  { to: '/', key: 'nav.home' },
  { to: '/governance', key: 'nav.governance' },
  { to: '/analytics', key: 'nav.analytics' },
  { to: '/ai', key: 'nav.ai' },
]

export function SecondaryNav() {
  const { t } = useTranslation()

  return (
    <nav className="sticky top-16 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-6 lg:px-8">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'relative whitespace-nowrap px-3.5 py-3.5 text-sm font-medium transition-colors duration-150',
                isActive ? 'text-brand-700' : 'text-ink-500 hover:text-ink-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                {t(item.key)}
                {isActive && <span className="absolute inset-x-3.5 bottom-0 h-[2px] rounded-full bg-brand-600" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
