export const LAYERS = ['ods', 'dwd', 'dws', 'ads', 'dim'] as const
export const DOMAINS = ['commerce', 'customer', 'finance', 'risk', 'marketing', 'supply'] as const
export const PERIODS = ['di', 'df', 'hi', 'mi', 'rt'] as const
export const SECURITY_LEVELS = ['L0', 'L1', 'L2', 'L3'] as const
export const ASSET_LEVELS = ['P0', 'P1', 'P2', 'P3'] as const
export const COLUMN_TYPES = [
  'string',
  'int',
  'bigint',
  'double',
  'decimal(18,2)',
  'boolean',
  'date',
  'timestamp',
  'array<string>',
  'map<string,string>',
]

export type Layer = (typeof LAYERS)[number]
export type Domain = (typeof DOMAINS)[number]
export type Period = (typeof PERIODS)[number]
export type SecurityLevel = (typeof SECURITY_LEVELS)[number]
export type AssetLevel = (typeof ASSET_LEVELS)[number]

export interface ColumnDraft {
  id: string
  name: string
  type: string
  comment: string
  security: SecurityLevel | ''
  nullable: boolean
  primaryKey: boolean
  partition: boolean
}

export interface TableDraft {
  layer: Layer | ''
  domain: Domain | ''
  subject: string
  period: Period | ''
  comment: string
  businessDescription: string
  assetLevel: AssetLevel | ''
  owner: string
  columns: ColumnDraft[]
}

let columnSeq = 0

export function newColumn(partial: Partial<ColumnDraft> = {}): ColumnDraft {
  columnSeq += 1
  return {
    id: `col-${columnSeq}`,
    name: '',
    type: 'string',
    comment: '',
    security: '',
    nullable: true,
    primaryKey: false,
    partition: false,
    ...partial,
  }
}

export function emptyDraft(): TableDraft {
  return {
    layer: '',
    domain: '',
    subject: '',
    period: '',
    comment: '',
    businessDescription: '',
    assetLevel: '',
    owner: '',
    columns: [newColumn()],
  }
}

export const NAME_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
export const MAX_TABLE_NAME = 64
export const MAX_SUBJECT = 32
export const MAX_COLUMN_NAME = 64

export const isValidSubject = (value: string) => NAME_RE.test(value) && value.length <= MAX_SUBJECT
export const isValidColumnName = (value: string) => NAME_RE.test(value) && value.length <= MAX_COLUMN_NAME

export function sanitizeIdentifier(value: string) {
  return value.toLowerCase().replace(/\s+/g, '_')
}

type NameParts = Pick<TableDraft, 'layer' | 'domain' | 'subject' | 'period'>

/** `{layer}_{domain}_{subject}_{period}`; returns '' when incomplete unless placeholders are requested. */
export function buildTableName(parts: NameParts, placeholders = false) {
  const values = [parts.layer, parts.domain, parts.subject.trim(), parts.period]
  const labels = ['layer', 'domain', 'subject', 'period']
  if (!placeholders) return values.every(Boolean) ? values.join('_') : ''
  return values.map((v, i) => v || `<${labels[i]}>`).join('_')
}

/** Schema mirrors the warehouse layer: `{layer}.{table}`. */
export function fullTableName(parts: NameParts, placeholders = false) {
  const name = buildTableName(parts, placeholders)
  if (!name) return ''
  return `${parts.layer || '<layer>'}.${name}`
}

export const securityRank = (level: SecurityLevel | '') => (level ? SECURITY_LEVELS.indexOf(level) : -1)

export function maxColumnSecurity(columns: ColumnDraft[]): SecurityLevel | '' {
  return columns.reduce<SecurityLevel | ''>(
    (max, c) => (securityRank(c.security) > securityRank(max) ? c.security : max),
    '',
  )
}

/** The table tier is never entered by hand: it is the highest tier among its columns. */
export const tableSecurityLevel = (draft: Pick<TableDraft, 'columns'>) => maxColumnSecurity(draft.columns)

/** Heuristic suggestion from the column name; never overrides an explicit choice. */
export function suggestSecurity(columnName: string): SecurityLevel | '' {
  const n = columnName.toLowerCase()
  if (/(id_?card|passport|bank|ssn|credential|password)/.test(n)) return 'L3'
  if (/(phone|mobile|email|address|real_?name|birth|account_?no)/.test(n)) return 'L2'
  if (/(amount|price|fee|salary|balance|revenue|cost)/.test(n)) return 'L1'
  return ''
}

export function duplicateColumnNames(columns: ColumnDraft[]) {
  const seen = new Map<string, number>()
  columns.forEach((c) => {
    const name = c.name.trim()
    if (name) seen.set(name, (seen.get(name) ?? 0) + 1)
  })
  return new Set([...seen].filter(([, count]) => count > 1).map(([name]) => name))
}
