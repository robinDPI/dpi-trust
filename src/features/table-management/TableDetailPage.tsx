import { ArrowLeft, Check, CircleCheck, CircleX, Clock, Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Meter, scoreTone } from '../../components/ui/Meter'
import { cn } from '../../lib/utils'
import { AssetBadge, ModeBadge, SecurityBadge, StatusBadge } from './Badges'
import { fullTableName, tableSecurityLevel } from './model'
import { formatDateTime, useTableRequest, type TableRequest } from './store'
import { TABLE_MANAGEMENT_PATH } from './TableListPage'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2 text-sm">
      <dt className="text-ink-400">{label}</dt>
      <dd className="min-w-0 break-words text-ink-900">{children}</dd>
    </div>
  )
}

function Progress({ request }: { request: TableRequest }) {
  const { t } = useTranslation('translation', { keyPrefix: 'tableMgmt.detail.progress' })
  const { status } = request

  const steps: { key: string; state: 'done' | 'current' | 'rejected' | 'todo'; title: string; meta?: string; note?: string }[] = [
    { key: 'submit', state: 'done', title: t('submitted'), meta: `${request.creator} · ${formatDateTime(request.createdAt)}` },
    status === 'pending'
      ? { key: 'review', state: 'current', title: t('review'), meta: t('waiting') }
      : status === 'rejected'
        ? {
            key: 'review',
            state: 'rejected',
            title: t('rejectedBy', { name: request.reviewer }),
            meta: formatDateTime(request.updatedAt),
            note: request.rejectReason,
          }
        : { key: 'review', state: 'done', title: t('approvedBy', { name: request.reviewer }), meta: formatDateTime(request.updatedAt) },
    status === 'created'
      ? { key: 'create', state: 'done', title: t('created'), meta: formatDateTime(request.updatedAt) }
      : { key: 'create', state: 'todo', title: t('create'), meta: status === 'rejected' ? t('notCreated') : t('pendingCreate') },
  ]

  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px bg-border-strong" />}
          <span
            className={cn(
              'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full',
              step.state === 'done' && 'bg-green-bg text-green-fg',
              step.state === 'current' && 'bg-amber-bg text-amber-fg',
              step.state === 'rejected' && 'bg-rose-bg text-rose-fg',
              step.state === 'todo' && 'border border-border-strong bg-surface text-ink-400',
            )}
          >
            {step.state === 'done' && <CircleCheck className="size-4" />}
            {step.state === 'current' && <Clock className="size-4" />}
            {step.state === 'rejected' && <CircleX className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-medium', step.state === 'todo' ? 'text-ink-400' : 'text-ink-900')}>{step.title}</p>
            {step.meta && <p className="mt-0.5 text-xs text-ink-500">{step.meta}</p>}
            {step.note && (
              <p className="mt-2 rounded-md border border-rose-fg/20 bg-rose-bg px-3 py-2 text-xs text-rose-fg">{step.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function TableDetailPage() {
  const { t } = useTranslation()
  const tm = (key: string, options?: Record<string, unknown>) => t(`tableMgmt.${key}`, options)
  const { requestId } = useParams()
  const request = useTableRequest(requestId)
  const [copied, setCopied] = useState(false)

  const backLink = (
    <Link
      to={TABLE_MANAGEMENT_PATH}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-ink-700 transition-colors hover:border-border-strong hover:bg-surface-sunken"
    >
      <ArrowLeft className="size-4" />
      {tm('detail.back')}
    </Link>
  )

  if (!request) {
    return (
      <>
        <PageHeader
          breadcrumb={`${tm('breadcrumb')} / ${requestId ?? ''}`}
          title={tm('detail.notFound')}
          description={tm('detail.notFoundBody', { id: requestId })}
          actions={backLink}
        />
      </>
    )
  }

  const { draft } = request
  const tableLevel = tableSecurityLevel(draft)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request.ddl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <PageHeader
        breadcrumb={`${tm('breadcrumb')} / ${request.id}`}
        title={fullTableName(draft)}
        description={draft.comment}
        actions={backLink}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title={tm('detail.sections.summary')}>
            <dl className="grid gap-x-10 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
              <div className="divide-y divide-border">
                <Row label={tm('detail.fields.id')}><span className="font-mono text-xs">{request.id}</span></Row>
                <Row label={tm('detail.fields.status')}><StatusBadge status={request.status} /></Row>
                <Row label={tm('detail.fields.mode')}><ModeBadge mode={request.mode} /></Row>
                <Row label={tm('detail.fields.creator')}>{request.creator}</Row>
                <Row label={tm('detail.fields.createdAt')}><span className="tabular-nums">{formatDateTime(request.createdAt)}</span></Row>
                <Row label={tm('detail.fields.updatedAt')}><span className="tabular-nums">{formatDateTime(request.updatedAt)}</span></Row>
              </div>
              <div className="divide-y divide-border">
                <Row label={tm('fields.layer')}>{draft.layer} · {draft.layer && tm(`layers.${draft.layer}`)}</Row>
                <Row label={tm('fields.domain')}>{draft.domain} · {draft.domain && tm(`domains.${draft.domain}`)}</Row>
                <Row label={tm('fields.subject')}><span className="font-mono">{draft.subject}</span></Row>
                <Row label={tm('fields.period')}>{draft.period} · {draft.period && tm(`periods.${draft.period}`)}</Row>
                <Row label={tm('fields.owner')}>{draft.owner}</Row>
                <Row label={tm('detail.fields.score')}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{request.score}</span>
                    <div className="w-24"><Meter value={request.score} tone={scoreTone(request.score)} size="sm" /></div>
                  </div>
                </Row>
              </div>
            </dl>
          </Card>

          <Card title={tm('sections.labels.title')}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-500">{tm('fields.assetLevel')}</p>
                <div className="flex items-center gap-2">
                  <AssetBadge level={draft.assetLevel} />
                  <span className="text-sm font-medium text-ink-900">{draft.assetLevel && tm(`asset.${draft.assetLevel}.name`)}</span>
                </div>
                <p className="mt-1.5 text-xs text-ink-500">{draft.assetLevel && tm(`asset.${draft.assetLevel}.desc`)}</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-500">{tm('fields.securityLevel')}</p>
                <div className="flex items-center gap-2">
                  <SecurityBadge level={tableLevel} />
                  <span className="text-sm font-medium text-ink-900">{tableLevel && tm(`security.${tableLevel}.name`)}</span>
                </div>
                <p className="mt-1.5 text-xs text-ink-500">{tableLevel && tm(`security.${tableLevel}.desc`)}</p>
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-1.5 text-xs font-medium text-ink-500">{tm('fields.businessDescription')}</p>
              <p className="text-sm leading-relaxed text-ink-900">{draft.businessDescription}</p>
            </div>
          </Card>

          <Card title={tm('detail.sections.columns')} description={tm('detail.columnCount', { count: draft.columns.length })} bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-xs text-ink-400">
                    <th className="w-10 px-4 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">{tm('columns.name')}</th>
                    <th className="px-3 py-2 font-medium">{tm('columns.type')}</th>
                    <th className="px-3 py-2 font-medium">{tm('columns.comment')}</th>
                    <th className="px-3 py-2 font-medium">{tm('columns.security')}</th>
                    <th className="px-3 py-2 font-medium">{tm('detail.fields.flags')}</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.columns.map((c, i) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-xs text-ink-400">{i + 1}</td>
                      <td className="px-3 py-2.5 font-mono text-sm text-ink-900">{c.name}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-ink-600">{c.type}</td>
                      <td className="px-3 py-2.5 text-sm text-ink-700">{c.comment}</td>
                      <td className="px-3 py-2.5"><SecurityBadge level={c.security} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {c.primaryKey && <Badge tone="brand">{tm('columns.pk')}</Badge>}
                          {c.partition && <Badge tone="neutral">{tm('columns.partition')}</Badge>}
                          {!c.nullable && !c.primaryKey && <Badge tone="neutral">NOT NULL</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-32 xl:self-start">
          <Card title={tm('detail.sections.progress')}>
            <Progress request={request} />
          </Card>

          <Card
            title={tm('detail.sections.ddl')}
            actions={
              <Button variant="ghost" className="h-8 px-2.5" icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={copy}>
                {copied ? tm('actions.copied') : tm('actions.copy')}
              </Button>
            }
            bodyClassName="p-0"
          >
            <pre className="max-h-96 overflow-auto rounded-b-lg bg-navy-900 p-4 font-mono text-xs leading-relaxed text-brand-100">
              {request.ddl}
            </pre>
          </Card>
        </aside>
      </div>
    </>
  )
}
