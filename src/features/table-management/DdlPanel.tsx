import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { DdlErrorCode } from './ddl'

interface DdlPanelProps {
  value: string
  error: DdlErrorCode | 'empty' | ''
  onChange: (value: string) => void
  onParse: () => void
  onLoadSample: () => void
}

export function DdlPanel({ value, error, onChange, onParse, onLoadSample }: DdlPanelProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })

  return (
    <Card
      title={t('ddl.title')}
      description={t('ddl.desc')}
      actions={
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" onClick={onLoadSample}>
            {t('ddl.sample')}
          </Button>
          <Button variant="ghost" onClick={() => onChange('')} disabled={!value}>
            {t('ddl.clear')}
          </Button>
        </div>
      }
    >
      <textarea
        value={value}
        spellCheck={false}
        rows={16}
        placeholder={t('ddl.placeholder')}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-md border border-border-strong bg-navy-900 p-4 font-mono text-xs leading-relaxed text-brand-100 outline-none placeholder:text-brand-300/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {error && <p className="mt-2 text-sm text-rose-fg">{t(`ddl.errors.${error}`)}</p>}
      <div className="mt-4 flex justify-end">
        <Button variant="primary" className="h-10" icon={<ArrowRight className="size-4" />} onClick={onParse}>
          {t('ddl.parse')}
        </Button>
      </div>
    </Card>
  )
}
