import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SelectInput, TextInput } from '../../components/ui/Form'
import {
  COLUMN_TYPES,
  SECURITY_LEVELS,
  duplicateColumnNames,
  isValidColumnName,
  newColumn,
  sanitizeIdentifier,
  suggestSecurity,
  type ColumnDraft,
} from './model'

interface ColumnsEditorProps {
  columns: ColumnDraft[]
  showErrors: boolean
  onChange: (columns: ColumnDraft[]) => void
}

export function ColumnsEditor({ columns, showErrors, onChange }: ColumnsEditorProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt' })
  const [suggestMessage, setSuggestMessage] = useState('')
  const duplicates = duplicateColumnNames(columns)

  const update = (id: string, patch: Partial<ColumnDraft>) =>
    onChange(columns.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const suggestAll = () => {
    let filled = 0
    onChange(
      columns.map((c) => {
        const suggestion = c.security ? '' : suggestSecurity(c.name)
        if (!suggestion) return c
        filled += 1
        return { ...c, security: suggestion }
      }),
    )
    setSuggestMessage(filled ? t('columns.suggested', { count: filled }) : t('columns.noSuggestion'))
  }

  const nameError = (c: ColumnDraft) => {
    const name = c.name.trim()
    if (!name) return showErrors ? t('columns.invalidName') : ''
    if (duplicates.has(name)) return t('columns.duplicateName')
    return isValidColumnName(name) ? '' : t('columns.invalidName')
  }

  return (
    <Card
      id="tm-columns"
      title={t('sections.columns.title')}
      description={t('sections.columns.desc')}
      actions={
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" icon={<Sparkles className="size-4" />} onClick={suggestAll}>
            {t('actions.suggestSecurity')}
          </Button>
          <Button
            variant="secondary"
            icon={<Plus className="size-4" />}
            onClick={() => onChange([...columns, newColumn()])}
          >
            {t('actions.addColumn')}
          </Button>
        </div>
      }
      bodyClassName="p-0"
    >
      <datalist id="tm-column-types">
        {COLUMN_TYPES.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>

      {suggestMessage && <p className="border-b border-border bg-brand-50/50 px-5 py-2 text-xs text-brand-700">{suggestMessage}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
              <th className="w-10 px-3 py-2 font-medium">#</th>
              <th className="w-48 px-2 py-2 font-medium">{t('columns.name')}</th>
              <th className="w-40 px-2 py-2 font-medium">{t('columns.type')}</th>
              <th className="px-2 py-2 font-medium">{t('columns.comment')}</th>
              <th className="w-32 px-2 py-2 font-medium">{t('columns.security')}</th>
              <th className="w-14 px-2 py-2 text-center font-medium">{t('columns.pk')}</th>
              <th className="w-14 px-2 py-2 text-center font-medium">{t('columns.partition')}</th>
              <th className="w-14 px-2 py-2 text-center font-medium">{t('columns.nullable')}</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {columns.map((c, index) => {
              const error = nameError(c)
              return (
                <tr key={c.id} className="border-b border-border align-top last:border-0">
                  <td className="px-3 py-2.5 text-xs text-ink-400">{index + 1}</td>
                  <td className="px-2 py-2">
                    <TextInput
                      compact
                      className="font-mono"
                      value={c.name}
                      error={!!error}
                      placeholder={t('columns.namePlaceholder')}
                      onChange={(e) => update(c.id, { name: sanitizeIdentifier(e.target.value) })}
                    />
                    {error && <p className="mt-1 text-2xs text-rose-fg">{error}</p>}
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      compact
                      className="font-mono"
                      list="tm-column-types"
                      value={c.type}
                      onChange={(e) => update(c.id, { type: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      compact
                      value={c.comment}
                      error={showErrors && !c.comment.trim()}
                      placeholder={t('columns.commentPlaceholder')}
                      onChange={(e) => update(c.id, { comment: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SelectInput
                      compact
                      value={c.security}
                      error={showErrors && !c.security}
                      onChange={(e) => update(c.id, { security: e.target.value as ColumnDraft['security'] })}
                    >
                      <option value="">{t('placeholders.select')}</option>
                      {SECURITY_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level} · {t(`security.${level}.name`)}
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={t('columns.pk')}
                      className="mt-2 size-4 accent-brand-600"
                      checked={c.primaryKey}
                      onChange={(e) =>
                        update(c.id, { primaryKey: e.target.checked, nullable: e.target.checked ? false : c.nullable })
                      }
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={t('columns.partition')}
                      className="mt-2 size-4 accent-brand-600"
                      checked={c.partition}
                      onChange={(e) => update(c.id, { partition: e.target.checked })}
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={t('columns.nullable')}
                      className="mt-2 size-4 accent-brand-600 disabled:opacity-40"
                      checked={c.nullable && !c.primaryKey}
                      disabled={c.primaryKey}
                      onChange={(e) => update(c.id, { nullable: e.target.checked })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      title={t('actions.removeColumn')}
                      onClick={() => onChange(columns.filter((x) => x.id !== c.id))}
                      className="mt-0.5 rounded-md p-1.5 text-ink-400 transition-colors hover:bg-rose-bg hover:text-rose-fg"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {columns.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sm text-ink-400">
                  {t('columns.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
