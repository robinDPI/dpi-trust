import { Check, Circle, CircleCheck, Copy, Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Meter, scoreTone } from '../../components/ui/Meter'
import { cn } from '../../lib/utils'
import { scoreOf, type CheckResult } from './checks'

interface SidePanelProps {
  checks: CheckResult[]
  ddl: string
  showErrors: boolean
  onSubmit: () => void
}

export function SidePanel({ checks, ddl, showErrors, onSubmit }: SidePanelProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  const [copied, setCopied] = useState(false)

  const passed = checks.filter((c) => c.ok).length
  const failing = checks.length - passed
  const score = scoreOf(checks)

  const jumpTo = (anchor: string) =>
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ddl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card title={t('checks.title')} bodyClassName="p-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-ink-900">{score}</span>
            <span className="text-sm text-ink-400">/100</span>
          </div>
          <span className="text-xs text-ink-500">{t('checks.summary', { passed, total: checks.length })}</span>
        </div>
        <div className="mt-2">
          <Meter value={score} tone={scoreTone(score)} />
        </div>

        <ul className="mt-4 space-y-0.5">
          {checks.map((check) => {
            const flagged = !check.ok && showErrors
            return (
              <li key={check.id}>
                <button
                  type="button"
                  onClick={() => jumpTo(check.anchor)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-sunken"
                >
                  {check.ok ? (
                    <CircleCheck className="size-4 shrink-0 text-green-fg" />
                  ) : (
                    <Circle className={cn('size-4 shrink-0', flagged ? 'text-rose-fg' : 'text-ink-400')} />
                  )}
                  <span className={cn('flex-1 text-sm', check.ok ? 'text-ink-500' : flagged ? 'text-rose-fg' : 'text-ink-900')}>
                    {t(`checks.items.${check.id}`)}
                  </span>
                  {!check.ok && !!check.count && (
                    <span className="rounded-full bg-surface-sunken px-1.5 text-2xs font-medium text-ink-500">{check.count}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card
        title={t('preview.title')}
        description={t('preview.desc')}
        actions={
          <Button variant="ghost" className="h-8 px-2.5" icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={copy}>
            {copied ? t('actions.copied') : t('actions.copy')}
          </Button>
        }
        bodyClassName="p-0"
      >
        <pre className="max-h-72 overflow-auto rounded-b-lg bg-navy-900 p-4 font-mono text-xs leading-relaxed text-brand-100">
          {ddl}
        </pre>
      </Card>

      <div>
        <Button variant="primary" className="h-10 w-full justify-center" icon={<Send className="size-4" />} onClick={onSubmit}>
          {t('actions.submit')}
        </Button>
        <p className={cn('mt-2 text-xs', showErrors && failing > 0 ? 'text-rose-fg' : 'text-ink-400')}>
          {showErrors && failing > 0
            ? t('submit.failed', { count: failing })
            : failing === 0
              ? t('checks.allPassed')
              : t('submit.sandbox')}
        </p>
        {!(showErrors && failing > 0) && failing === 0 && <p className="mt-1 text-xs text-ink-400">{t('submit.sandbox')}</p>}
      </div>
    </div>
  )
}
