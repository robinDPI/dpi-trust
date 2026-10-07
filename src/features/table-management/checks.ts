import {
  MAX_TABLE_NAME,
  buildTableName,
  duplicateColumnNames,
  isValidColumnName,
  isValidSubject,
  type TableDraft,
} from './model'

export type CheckId =
  | 'name'
  | 'domain'
  | 'comment'
  | 'businessDescription'
  | 'assetLevel'
  | 'owner'
  | 'columns'
  | 'columnNames'
  | 'columnComments'
  | 'columnSecurity'

export interface CheckResult {
  id: CheckId
  ok: boolean
  anchor: 'tm-basic' | 'tm-labels' | 'tm-columns'
  count?: number
}

export const MIN_COMMENT = 6
export const MIN_BUSINESS_DESCRIPTION = 20

export function runChecks(draft: TableDraft): CheckResult[] {
  const { columns } = draft
  const duplicates = duplicateColumnNames(columns)
  const badNames = columns.filter((c) => !isValidColumnName(c.name.trim()) || duplicates.has(c.name.trim())).length
  const missingComments = columns.filter((c) => !c.comment.trim()).length
  const missingSecurity = columns.filter((c) => !c.security).length
  const tableName = buildTableName(draft)

  return [
    {
      id: 'name',
      ok: !!draft.layer && !!draft.period && isValidSubject(draft.subject.trim()) && tableName.length <= MAX_TABLE_NAME,
      anchor: 'tm-basic',
    },
    { id: 'domain', ok: !!draft.domain, anchor: 'tm-basic' },
    { id: 'comment', ok: draft.comment.trim().length >= MIN_COMMENT, anchor: 'tm-basic' },
    {
      id: 'businessDescription',
      ok: draft.businessDescription.trim().length >= MIN_BUSINESS_DESCRIPTION,
      anchor: 'tm-labels',
    },
    { id: 'assetLevel', ok: !!draft.assetLevel, anchor: 'tm-labels' },
    { id: 'owner', ok: draft.owner.trim().length > 0, anchor: 'tm-labels' },
    { id: 'columns', ok: columns.length > 0, anchor: 'tm-columns' },
    { id: 'columnNames', ok: columns.length > 0 && badNames === 0, anchor: 'tm-columns', count: badNames },
    { id: 'columnComments', ok: columns.length > 0 && missingComments === 0, anchor: 'tm-columns', count: missingComments },
    { id: 'columnSecurity', ok: columns.length > 0 && missingSecurity === 0, anchor: 'tm-columns', count: missingSecurity },
  ]
}

export function scoreOf(checks: CheckResult[]) {
  return Math.round((checks.filter((c) => c.ok).length / checks.length) * 100)
}
