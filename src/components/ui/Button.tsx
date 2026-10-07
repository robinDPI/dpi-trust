import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<Variant, string> = {
  danger: 'bg-rose-fg text-white border border-rose-fg hover:opacity-90',
  primary: 'bg-brand-600 text-white border border-brand-600 hover:bg-brand-700 hover:border-brand-700',
  secondary: 'bg-surface text-ink-700 border border-border hover:border-border-strong hover:bg-surface-sunken',
  ghost: 'bg-transparent text-ink-600 border border-transparent hover:bg-surface-sunken',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
}

export function Button({ variant = 'secondary', icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
