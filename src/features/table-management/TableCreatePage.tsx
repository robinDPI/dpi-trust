import { ArrowLeft, CircleCheck, FileCode2, Info, RotateCcw, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Segmented } from '../../components/ui/Form'
import { runChecks } from './checks'
import { ColumnsEditor } from './ColumnsEditor'
import { generateDdl, parseDdl, SAMPLE_DDL, type DdlErrorCode, type DdlWarning } from './ddl'
import { DdlPanel } from './DdlPanel'
import { emptyDraft, fullTableName, type TableDraft } from './model'
import { SidePanel } from './SidePanel'
import { BasicSection, LabelsSection } from './StandardSections'
import { addRequest, type TableRequest } from './store'
import { TABLE_MANAGEMENT_PATH } from './TableListPage'

type Mode = 'standard' | 'ddl'

interface ParsedInfo {
  count: number
  warnings: DdlWarning[]
}

export function TableCreatePage() {
  const { t } = useTranslation()
  const tm = (key: string, options?: Record<string, unknown>) => t(`tableMgmt.${key}`, options)

  const [mode, setMode] = useState<Mode>('standard')
  const [draft, setDraft] = useState<TableDraft>(emptyDraft)
  const [ddlText, setDdlText] = useState('')
  const [ddlError, setDdlError] = useState<DdlErrorCode | 'empty' | ''>('')
  const [parsed, setParsed] = useState<ParsedInfo | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [origin, setOrigin] = useState<Mode>('standard')
  const [submitted, setSubmitted] = useState<TableRequest | null>(null)

  const checks = useMemo(() => runChecks(draft), [draft])
  const ddl = useMemo(() => generateDdl(draft), [draft])

  const patch = (partial: Partial<TableDraft>) => setDraft((d) => ({ ...d, ...partial }))

  const reset = () => {
    setDraft(emptyDraft())
    setDdlText('')
    setDdlError('')
    setParsed(null)
    setShowErrors(false)
    setSubmitted(null)
    setOrigin('standard')
  }

  const parse = () => {
    if (!ddlText.trim()) {
      setDdlError('empty')
      return
    }
    const result = parseDdl(ddlText)
    if (!result.ok) {
      setDdlError(result.error)
      return
    }
    setDdlError('')
    setDraft(result.draft)
    setParsed({ count: result.draft.columns.length, warnings: result.warnings })
    setOrigin('ddl')
    setShowErrors(false)
    setMode('standard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = () => {
    const firstFailing = checks.find((c) => !c.ok)
    if (firstFailing) {
      setShowErrors(true)
      document.getElementById(firstFailing.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setSubmitted(addRequest({ draft, ddl, mode: origin }))
  }

  const header = (
    <PageHeader
      breadcrumb={tm('create.breadcrumb')}
      title={tm('create.title')}
      titleSub="Table Management"
      description={t('governanceModules.tableManagement.description')}
      actions={
        <>
          <Link
            to={TABLE_MANAGEMENT_PATH}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-ink-700 transition-colors hover:border-border-strong hover:bg-surface-sunken"
          >
            <ArrowLeft className="size-4" />
            {tm('detail.back')}
          </Link>
          {!submitted && (
            <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={reset}>
              {tm('actions.reset')}
            </Button>
          )}
        </>
      }
    />
  )

  if (submitted) {
    return (
      <>
        {header}
        <Card className="mx-auto max-w-3xl" bodyClassName="p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-green-bg text-green-fg">
              <CircleCheck className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink-900">{tm('success.title')}</h2>
            <p className="mt-1 max-w-lg text-sm text-ink-500">{tm('success.desc', { name: fullTableName(submitted.draft), id: submitted.id })}</p>
          </div>
          <pre className="mt-6 max-h-80 overflow-auto rounded-md bg-navy-900 p-4 font-mono text-xs leading-relaxed text-brand-100">
            {submitted.ddl}
          </pre>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`${TABLE_MANAGEMENT_PATH}/${submitted.id}`}
              className="inline-flex h-10 items-center rounded-md border border-brand-600 bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:border-brand-700 hover:bg-brand-700"
            >
              {tm('success.view')}
            </Link>
            <Link
              to={TABLE_MANAGEMENT_PATH}
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink-700 transition-colors hover:border-border-strong hover:bg-surface-sunken"
            >
              {tm('success.list')}
            </Link>
            <Button variant="ghost" className="h-10" onClick={reset}>
              {tm('actions.again')}
            </Button>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      {header}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'standard', label: tm('modes.standard'), icon: <SlidersHorizontal className="size-4" /> },
            { value: 'ddl', label: tm('modes.ddl'), icon: <FileCode2 className="size-4" /> },
          ]}
        />
        <p className="text-sm text-ink-500">{tm(`modeHint.${mode}`)}</p>
      </div>

      {mode === 'ddl' ? (
        <div className="mx-auto max-w-4xl">
          <DdlPanel
            value={ddlText}
            error={ddlError}
            onChange={(value) => {
              setDdlText(value)
              setDdlError('')
            }}
            onParse={parse}
            onLoadSample={() => {
              setDdlText(SAMPLE_DDL)
              setDdlError('')
            }}
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {parsed && (
              <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-brand-700" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-800">{tm('ddl.parsed.title', { count: parsed.count })}</p>
                  <p className="mt-0.5 text-sm text-brand-700">{tm('ddl.parsed.body')}</p>
                  {parsed.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {parsed.warnings.map((w) => (
                        <li key={w.code} className="flex items-start gap-1.5 text-sm text-amber-fg">
                          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                          {tm(`ddl.warnings.${w.code}`, w.params)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={tm('ddl.parsed.dismiss')}
                  onClick={() => setParsed(null)}
                  className="rounded-md p-1 text-brand-700 transition-colors hover:bg-brand-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <BasicSection draft={draft} showErrors={showErrors} onChange={patch} />
            <LabelsSection draft={draft} showErrors={showErrors} onChange={patch} />
            <ColumnsEditor columns={draft.columns} showErrors={showErrors} onChange={(columns) => patch({ columns })} />
          </div>

          <aside className="xl:sticky xl:top-32 xl:max-h-[calc(100vh-9rem)] xl:self-start xl:overflow-y-auto">
            <SidePanel checks={checks} ddl={ddl} showErrors={showErrors} onSubmit={submit} />
          </aside>
        </div>
      )}
    </>
  )
}
