import { useSyncExternalStore } from 'react'
import type { SecurityLevel } from '../table-management/model'
import { BASELINE_FEEDBACK, findingKey, issueOf, scanTables } from './data'

export type FindingStatus = 'awaiting' | 'confirmed' | 'rejected' | 'updated'

export interface PiiLog {
  id: string
  at: string
  kind: 'notified' | 'confirmed' | 'rejected' | 'updated'
  key: string
  level?: SecurityLevel
}

export interface PiiState {
  levels: Record<string, SecurityLevel>
  status: Record<string, FindingStatus>
  feedback: { confirmed: number; rejected: number }
  log: PiiLog[]
  discovered: boolean
  lastScanAt: string
}

const STORAGE_KEY = 'trust-pii-scan-v1'
const HOUR = 60 * 60 * 1000
const listeners = new Set<() => void>()
let state: PiiState | null = null

const fresh = (): PiiState => ({
  levels: {},
  status: {},
  feedback: { confirmed: 0, rejected: 0 },
  log: [],
  discovered: false,
  lastScanAt: new Date(Date.now() - 2 * HOUR).toISOString(),
})

function load(): PiiState {
  if (state) return state
  let next: PiiState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    next = raw ? { ...fresh(), ...(JSON.parse(raw) as Partial<PiiState>) } : fresh()
  } catch {
    next = fresh()
  }
  state = next
  return next
}

function commit(next: PiiState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable: keep the in-memory copy
  }
  listeners.forEach((l) => l())
}

let seq = 0
const entry = (kind: PiiLog['kind'], key: string, level?: SecurityLevel): PiiLog => ({
  id: `pii-${Date.now()}-${(seq += 1)}`,
  at: new Date().toISOString(),
  kind,
  key,
  level,
})

const aiLevelOf = (key: string) => {
  for (const t of scanTables) {
    const col = t.columns.find((x) => findingKey(t.id, x.name) === key)
    if (col) return col.ai.level
  }
  return undefined
}

export function markNotified(keys: string[]) {
  const s = load()
  commit({
    ...s,
    status: { ...s.status, ...Object.fromEntries(keys.map((k) => [k, 'awaiting' as const])) },
    log: [...keys.map((k) => entry('notified', k)), ...s.log],
  })
}

/** Simulates the Owner's reply on Lark. A confirmation applies the AI suggestion and counts as positive feedback. */
export function ownerReply(key: string, decision: 'confirm' | 'reject') {
  const s = load()
  if (decision === 'confirm') {
    const level = aiLevelOf(key)
    if (!level) return
    commit({
      ...s,
      levels: { ...s.levels, [key]: level },
      status: { ...s.status, [key]: 'confirmed' },
      feedback: { ...s.feedback, confirmed: s.feedback.confirmed + 1 },
      log: [entry('confirmed', key, level), ...s.log],
    })
  } else {
    commit({
      ...s,
      status: { ...s.status, [key]: 'rejected' },
      feedback: { ...s.feedback, rejected: s.feedback.rejected + 1 },
      log: [entry('rejected', key), ...s.log],
    })
  }
}

export function manualUpdate(key: string, level: SecurityLevel) {
  const s = load()
  commit({
    ...s,
    levels: { ...s.levels, [key]: level },
    status: { ...s.status, [key]: 'updated' },
    log: [entry('updated', key, level), ...s.log],
  })
}

/** Returns how many new findings the scan surfaced. */
export function completeScan(): number {
  const s = load()
  const added = s.discovered
    ? 0
    : scanTables
        .filter((t) => t.discoveredByRescan)
        .flatMap((t) => t.columns)
        .filter((col) => issueOf(col.current, col.ai.level)).length
  commit({ ...s, discovered: true, lastScanAt: new Date().toISOString() })
  return added
}

export function resetPiiScan() {
  commit(fresh())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePiiState() {
  return useSyncExternalStore(subscribe, load)
}

export function accuracyOf(feedback: PiiState['feedback']) {
  const confirmed = BASELINE_FEEDBACK.confirmed + feedback.confirmed
  const rejected = BASELINE_FEEDBACK.rejected + feedback.rejected
  return { rate: confirmed / (confirmed + rejected), confirmed, rejected, total: confirmed + rejected }
}

export const baselineRate = BASELINE_FEEDBACK.confirmed / (BASELINE_FEEDBACK.confirmed + BASELINE_FEEDBACK.rejected)
