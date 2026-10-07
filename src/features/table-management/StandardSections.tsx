import { useTranslation } from 'react-i18next'
import { Card } from '../../components/ui/Card'
import { ChoiceGroup, Field, SelectInput, TextArea, TextInput } from '../../components/ui/Form'
import { SecurityBadge } from './Badges'
import { MIN_BUSINESS_DESCRIPTION, MIN_COMMENT } from './checks'
import {
  ASSET_LEVELS,
  DOMAINS,
  LAYERS,
  MAX_TABLE_NAME,
  PERIODS,
  buildTableName,
  fullTableName,
  isValidSubject,
  sanitizeIdentifier,
  tableSecurityLevel,
  type TableDraft,
} from './model'

interface SectionProps {
  draft: TableDraft
  showErrors: boolean
  onChange: (patch: Partial<TableDraft>) => void
}

export function BasicSection({ draft, showErrors, onChange }: SectionProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  const subject = draft.subject.trim()
  const complete = !!buildTableName(draft)
  const subjectInvalid = !!subject && !isValidSubject(subject)
  const tooLong = complete && buildTableName(draft).length > MAX_TABLE_NAME

  return (
    <Card id="tm-basic" title={t('sections.basic.title')} description={t('sections.basic.desc')}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t('fields.layer')} required>
          <SelectInput
            value={draft.layer}
            error={showErrors && !draft.layer}
            onChange={(e) => onChange({ layer: e.target.value as TableDraft['layer'] })}
          >
            <option value="">{t('placeholders.select')}</option>
            {LAYERS.map((layer) => (
              <option key={layer} value={layer}>
                {layer} · {t(`layers.${layer}`)}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={t('fields.domain')} required>
          <SelectInput
            value={draft.domain}
            error={showErrors && !draft.domain}
            onChange={(e) => onChange({ domain: e.target.value as TableDraft['domain'] })}
          >
            <option value="">{t('placeholders.select')}</option>
            {DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain} · {t(`domains.${domain}`)}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field
          label={t('fields.subject')}
          required
          hint={t('hints.subject')}
          error={subjectInvalid ? t('naming.invalid') : undefined}
        >
          <TextInput
            className="font-mono"
            value={draft.subject}
            error={subjectInvalid || (showErrors && !subject)}
            placeholder={t('placeholders.subject')}
            onChange={(e) => onChange({ subject: sanitizeIdentifier(e.target.value) })}
          />
        </Field>

        <Field label={t('fields.period')} required>
          <SelectInput
            value={draft.period}
            error={showErrors && !draft.period}
            onChange={(e) => onChange({ period: e.target.value as TableDraft['period'] })}
          >
            <option value="">{t('placeholders.select')}</option>
            {PERIODS.map((period) => (
              <option key={period} value={period}>
                {period} · {t(`periods.${period}`)}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface-sunken px-4 py-3">
        <div className="text-xs font-medium text-ink-500">{t('naming.fullName')}</div>
        <code className="mt-1 block break-all font-mono text-md font-semibold text-ink-900">
          {fullTableName(draft, true)}
        </code>
        <p className={tooLong ? 'mt-1.5 text-xs text-rose-fg' : 'mt-1.5 text-xs text-ink-400'}>
          {tooLong ? t('naming.tooLong') : t('naming.rule')}
        </p>
      </div>

      <Field
        className="mt-4"
        label={t('fields.comment')}
        required
        hint={t('hints.comment')}
      >
        <TextInput
          value={draft.comment}
          error={showErrors && draft.comment.trim().length < MIN_COMMENT}
          placeholder={t('placeholders.comment')}
          onChange={(e) => onChange({ comment: e.target.value })}
        />
      </Field>
    </Card>
  )
}

export function LabelsSection({ draft, showErrors, onChange }: SectionProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  const tableLevel = tableSecurityLevel(draft)
  const descLength = draft.businessDescription.trim().length

  return (
    <Card id="tm-labels" title={t('sections.labels.title')} description={t('sections.labels.desc')}>
      <div className="space-y-5">
        <Field label={t('fields.assetLevel')} required>
          <ChoiceGroup
            options={ASSET_LEVELS.map((v) => ({ value: v, label: v, name: t(`asset.${v}.name`) }))}
            value={draft.assetLevel}
            error={showErrors && !draft.assetLevel}
            onChange={(assetLevel) => onChange({ assetLevel })}
            describe={(v) => t(`asset.${v}.desc`)}
          />
        </Field>

        <Field label={t('fields.securityLevel')} hint={t('levelHint.auto')}>
          <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-surface-sunken px-3 py-2">
            {tableLevel ? (
              <>
                <SecurityBadge level={tableLevel} />
                <span className="text-sm font-medium text-ink-900">{t(`security.${tableLevel}.name`)}</span>
                <span className="text-xs text-ink-500">{t(`security.${tableLevel}.desc`)}</span>
              </>
            ) : (
              <span className="text-sm text-ink-400">{t('levelHint.pending')}</span>
            )}
          </div>
        </Field>

        <Field label={t('fields.owner')} required>
          <TextInput
            value={draft.owner}
            error={showErrors && !draft.owner.trim()}
            placeholder={t('placeholders.owner')}
            onChange={(e) => onChange({ owner: e.target.value })}
          />
        </Field>

        <Field
          label={t('fields.businessDescription')}
          required
          hint={t('hints.businessDescription', { count: descLength })}
        >
          <TextArea
            rows={4}
            value={draft.businessDescription}
            error={showErrors && descLength < MIN_BUSINESS_DESCRIPTION}
            placeholder={t('placeholders.businessDescription')}
            onChange={(e) => onChange({ businessDescription: e.target.value })}
          />
        </Field>
      </div>
    </Card>
  )
}
