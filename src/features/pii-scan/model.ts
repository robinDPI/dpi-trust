import { assetById, employees, type Employee } from '../asset-inventory/data'
import { ownerOf } from '../asset-inventory/store'
import type { SecurityLevel } from '../table-management/model'
import { ISSUE_RANK, findingKey, issueOf, maxLevel, scanTables, type IssueType, type ScanColumn, type ScanTable } from './data'
import type { FindingStatus, PiiState } from './store'

type InventoryState = Parameters<typeof ownerOf>[1]

export interface FindingRow {
  key: string
  table: ScanTable
  column: ScanColumn
  issue: IssueType
  currentLevel: SecurityLevel | ''
  status: 'open' | FindingStatus
  owner: Employee | undefined
}

export const isActive = (e: Employee | undefined) => e?.status === 'active'

export function visibleTables(pii: PiiState) {
  return scanTables.filter((t) => !t.discoveredByRescan || pii.discovered)
}

/** The Owner follows Asset Inventory, so transferring a leaver's table there immediately re-routes the Lark notice. */
export function ownerOfTable(table: ScanTable, inv: InventoryState): Employee | undefined {
  const asset = assetById(`table:${table.id}`)
  const ownerId = asset ? ownerOf(asset, inv) : table.fallbackOwnerId
  return employees.find((e) => e.id === ownerId)
}

export function buildRows(pii: PiiState, inv: InventoryState): FindingRow[] {
  return visibleTables(pii).flatMap((table) => {
    const owner = ownerOfTable(table, inv)
    return table.columns.flatMap((column) => {
      const issue = issueOf(column.current, column.ai.level)
      if (!issue) return []
      const key = findingKey(table.id, column.name)
      return [{ key, table, column, issue, currentLevel: pii.levels[key] ?? column.current, status: pii.status[key] ?? 'open', owner }]
    })
  })
}

const STATUS_RANK = { open: 0, awaiting: 1, confirmed: 2, rejected: 2, updated: 2 } as const

export function sortRows(rows: FindingRow[]) {
  return [...rows].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      ISSUE_RANK[a.issue] - ISSUE_RANK[b.issue] ||
      b.column.ai.confidence - a.column.ai.confidence,
  )
}

export interface CoverageRow {
  table: ScanTable
  owner: Employee | undefined
  total: number
  tagged: number
  currentTier: SecurityLevel | ''
  aiTier: SecurityLevel | ''
  open: number
  state: 'untagged' | 'partial' | 'complete'
}

export function buildCoverage(pii: PiiState, inv: InventoryState): CoverageRow[] {
  return visibleTables(pii)
    .map((table) => {
      const levels = table.columns.map((c) => pii.levels[findingKey(table.id, c.name)] ?? c.current)
      const tagged = levels.filter(Boolean).length
      const open = table.columns.filter((c) => issueOf(c.current, c.ai.level) && !pii.status[findingKey(table.id, c.name)]).length
      return {
        table,
        owner: ownerOfTable(table, inv),
        total: table.columns.length,
        tagged,
        currentTier: maxLevel(levels),
        aiTier: maxLevel(table.columns.map((c) => c.ai.level)),
        open,
        state: tagged === 0 ? ('untagged' as const) : tagged < table.columns.length ? ('partial' as const) : ('complete' as const),
      }
    })
    .sort((a, b) => ['untagged', 'partial', 'complete'].indexOf(a.state) - ['untagged', 'partial', 'complete'].indexOf(b.state) || b.open - a.open)
}
