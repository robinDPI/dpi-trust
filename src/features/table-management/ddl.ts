import {
  DOMAINS,
  LAYERS,
  PERIODS,
  buildTableName,
  fullTableName,
  newColumn,
  emptyDraft,
  tableSecurityLevel,
  type ColumnDraft,
  type Domain,
  type Layer,
  type Period,
  type TableDraft,
} from './model'

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`

export function generateDdl(draft: TableDraft): string {
  const name = fullTableName(draft, true)
  const columns = draft.columns.filter((c) => c.name.trim())

  const lines = columns.map((c) => {
    let line = `  ${c.name.trim()} ${(c.type.trim() || 'string').toUpperCase()}`
    if (!c.nullable || c.primaryKey) line += ' NOT NULL'
    if (c.comment.trim()) line += ` COMMENT ${quote(c.comment.trim())}`
    return line
  })
  const primaryKeys = columns.filter((c) => c.primaryKey).map((c) => c.name.trim())
  if (primaryKeys.length) {
    lines.push(`  CONSTRAINT pk_${buildTableName(draft) || 'table'} PRIMARY KEY (${primaryKeys.join(', ')})`)
  }

  const out = [`CREATE TABLE IF NOT EXISTS ${name} (`, lines.length ? lines.join(',\n') : '  -- add columns', ')', 'USING DELTA']

  const partitions = columns.filter((c) => c.partition).map((c) => c.name.trim())
  if (partitions.length) out.push(`PARTITIONED BY (${partitions.join(', ')})`)
  if (draft.comment.trim()) out.push(`COMMENT ${quote(draft.comment.trim())}`)

  const props: [string, string][] = [
    ['governance.domain', draft.domain],
    ['governance.asset_level', draft.assetLevel],
    ['governance.security_level', tableSecurityLevel(draft)],
    ['governance.owner', draft.owner.trim()],
    ['governance.business_description', draft.businessDescription.trim()],
  ]
  const setProps = props.filter(([, v]) => v)
  if (setProps.length) {
    out.push(`TBLPROPERTIES (\n${setProps.map(([k, v]) => `  ${quote(k)} = ${quote(v)}`).join(',\n')}\n)`)
  }

  const tags = columns
    .filter((c) => c.security)
    .map((c) => `ALTER TABLE ${name} ALTER COLUMN ${c.name.trim()} SET TAGS (${quote('security_level')} = ${quote(c.security)});`)

  return `${out.join('\n')};${tags.length ? `\n\n${tags.join('\n')}` : ''}`
}

export type DdlErrorCode = 'noCreate' | 'unbalanced' | 'noColumns'

export interface DdlWarning {
  code: 'nameNormalized' | 'nameIncomplete' | 'noTableComment' | 'missingColumnComments'
  params?: Record<string, string | number>
}

export type ParseResult =
  | { ok: true; draft: TableDraft; warnings: DdlWarning[] }
  | { ok: false; error: DdlErrorCode }

function stripComments(sql: string) {
  let out = ''
  let quoteChar: string | null = null
  for (let i = 0; i < sql.length; i += 1) {
    const c = sql[i]
    if (quoteChar) {
      out += c
      if (c === quoteChar) quoteChar = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quoteChar = c
      out += c
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1
      out += '\n'
    } else if (c === '/' && sql[i + 1] === '*') {
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1
      i += 1
    } else {
      out += c
    }
  }
  return out
}

function splitTopLevel(body: string) {
  const parts: string[] = []
  let depth = 0
  let quoteChar: string | null = null
  let current = ''
  for (const c of body) {
    if (quoteChar) {
      current += c
      if (c === quoteChar) quoteChar = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') quoteChar = c
    if (c === '(' || c === '<') depth += 1
    if (c === ')' || c === '>') depth -= 1
    if (c === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += c
    }
  }
  if (current.trim()) parts.push(current)
  return parts.map((p) => p.trim()).filter(Boolean)
}

const unquote = (s: string) => s.replace(/[`"]/g, '').trim()
const listOf = (s: string) => s.split(',').map((x) => unquote(x.trim().split(/\s+/)[0] ?? '').toLowerCase()).filter(Boolean)

function readComment(text: string) {
  const m = /\bcomment\s+(?:'((?:[^']|'')*)'|"((?:[^"]|"")*)")/i.exec(text)
  if (!m) return ''
  return (m[1] ?? m[2] ?? '').replace(/''/g, "'").replace(/""/g, '"')
}

export function parseDdl(sql: string): ParseResult {
  const text = stripComments(sql)
  const head = /create\s+(?:or\s+replace\s+)?(?:external\s+)?table\s+(?:if\s+not\s+exists\s+)?([`"\w.-]+)\s*\(/i.exec(text)
  if (!head) return { ok: false, error: 'noCreate' }

  const open = head.index + head[0].length - 1
  let depth = 0
  let quoteChar: string | null = null
  let close = -1
  for (let i = open; i < text.length; i += 1) {
    const c = text[i]
    if (quoteChar) {
      if (c === quoteChar) quoteChar = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') quoteChar = c
    else if (c === '(') depth += 1
    else if (c === ')') {
      depth -= 1
      if (depth === 0) {
        close = i
        break
      }
    }
  }
  if (close < 0) return { ok: false, error: 'unbalanced' }

  const body = text.slice(open + 1, close)
  const tail = text.slice(close + 1)

  const primaryKeys = new Set<string>()
  const columns: ColumnDraft[] = []

  for (const part of splitTopLevel(body)) {
    const pk = /^(?:constraint\s+\S+\s+)?primary\s+key\s*\(([^)]*)\)/i.exec(part)
    if (pk) {
      listOf(pk[1]).forEach((c) => primaryKeys.add(c))
      continue
    }
    if (/^(constraint|foreign\s+key|unique|check|index|key)\b/i.test(part)) continue

    const col = /^[`"]?([A-Za-z_]\w*)[`"]?\s+([\s\S]+)$/.exec(part)
    if (!col) continue
    const rest = col[2]
    const typeMatch = /^([\s\S]*?)(?=\s+(?:not\s+null|null|comment|default|primary\s+key|generated|constraint)\b|$)/i.exec(rest)
    const type = (typeMatch?.[1] ?? rest).trim().replace(/\s*,\s*/g, ',')
    const inlinePk = /\bprimary\s+key\b/i.test(rest)
    const notNull = /\bnot\s+null\b/i.test(rest)
    const name = col[1].toLowerCase()
    if (inlinePk) primaryKeys.add(name)
    columns.push(newColumn({ name, type, comment: readComment(rest), nullable: !notNull }))
  }

  if (columns.length === 0) return { ok: false, error: 'noColumns' }

  const partitionMatch = /partitioned\s+by\s*\(([^)]*)\)/i.exec(tail)
  const partitions = new Set(partitionMatch ? listOf(partitionMatch[1]) : [])
  columns.forEach((c) => {
    if (primaryKeys.has(c.name)) {
      c.primaryKey = true
      c.nullable = false
    }
    if (partitions.has(c.name)) c.partition = true
  })

  const draft = emptyDraft()
  draft.columns = columns
  draft.comment = readComment(tail)

  const segments = unquote(head[1]).split('.')
  const rawTable = segments[segments.length - 1].toLowerCase()
  const schema = segments.length > 1 ? segments[segments.length - 2].toLowerCase() : ''
  const tokens = rawTable.split('_')

  if (tokens.length && (LAYERS as readonly string[]).includes(tokens[0])) draft.layer = tokens.shift() as Layer
  else if ((LAYERS as readonly string[]).includes(schema)) draft.layer = schema as Layer
  if (tokens.length && (DOMAINS as readonly string[]).includes(tokens[0])) draft.domain = tokens.shift() as Domain
  if (tokens.length > 1 && (PERIODS as readonly string[]).includes(tokens[tokens.length - 1])) {
    draft.period = tokens.pop() as Period
  }
  draft.subject = tokens.join('_')

  const warnings: DdlWarning[] = []
  const built = buildTableName(draft)
  if (!built) warnings.push({ code: 'nameIncomplete', params: { raw: rawTable } })
  else if (built !== rawTable) warnings.push({ code: 'nameNormalized', params: { raw: rawTable, name: built } })
  if (!draft.comment) warnings.push({ code: 'noTableComment' })
  const missing = columns.filter((c) => !c.comment).length
  if (missing) warnings.push({ code: 'missingColumnComments', params: { count: missing } })

  return { ok: true, draft, warnings }
}

export const SAMPLE_DDL = `CREATE TABLE IF NOT EXISTS dwd.dwd_commerce_order_di (
  order_id     BIGINT NOT NULL COMMENT '订单ID',
  user_id      BIGINT COMMENT '用户ID',
  user_phone   STRING COMMENT '用户手机号',
  order_amount DECIMAL(18, 2) COMMENT '订单金额',
  order_status STRING,
  created_at   TIMESTAMP COMMENT '下单时间',
  dt           STRING COMMENT '分区日期',
  PRIMARY KEY (order_id)
)
USING DELTA
PARTITIONED BY (dt)
COMMENT '订单明细表（日增量）';`
