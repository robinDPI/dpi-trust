import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ControlProps {
  error?: boolean
  compact?: boolean
}

function controlClass({ error, compact }: ControlProps, extra?: string) {
  return cn(
    'w-full rounded-md border bg-surface px-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400',
    'focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-sunken disabled:text-ink-400',
    compact ? 'h-8 px-2.5' : 'h-9',
    error ? 'border-rose-fg bg-rose-bg/30' : 'border-border-strong hover:border-ink-400',
    extra,
  )
}

export function TextInput({ error, compact, className, ...props }: InputHTMLAttributes<HTMLInputElement> & ControlProps) {
  return <input className={controlClass({ error, compact }, className)} {...props} />
}

export function SelectInput({ error, compact, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & ControlProps) {
  return (
    <select className={controlClass({ error, compact }, className)} {...props}>
      {children}
    </select>
  )
}

export function TextArea({ error, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={controlClass({ error }, cn('h-auto resize-y py-2 leading-relaxed', className))} {...props} />
}

interface FieldProps {
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
}

export function Field({ label, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-700">
        {label}
        {required && <span className="text-rose-fg">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-fg">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  )
}

interface ChoiceOption<T extends string> {
  value: T
  label: string
  name: string
}

interface ChoiceGroupProps<T extends string> {
  options: ChoiceOption<T>[]
  value: T | ''
  onChange: (value: T) => void
  error?: boolean
  describe?: (value: T) => string
}

export function ChoiceGroup<T extends string>({ options, value, onChange, error, describe }: ChoiceGroupProps<T>) {
  return (
    <div>
      <div role="radiogroup" className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', error && 'rounded-md ring-1 ring-rose-fg')}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors duration-150',
                selected
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border-strong bg-surface text-ink-700 hover:border-ink-400 hover:bg-surface-sunken',
              )}
            >
              <span className="text-sm font-semibold">{option.label}</span>
              <span className={cn('text-xs', selected ? 'text-brand-700' : 'text-ink-400')}>{option.name}</span>
            </button>
          )
        })}
      </div>
      {describe && value && <p className="mt-2 text-xs text-ink-500">{describe(value)}</p>}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  options: { value: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-md border border-border bg-surface-sunken p-0.5" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
            option.value === value ? 'bg-surface text-brand-700 shadow-xs' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
