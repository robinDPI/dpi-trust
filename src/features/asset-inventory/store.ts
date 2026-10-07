import { useSyncExternalStore } from 'react'
import { assetById, assets, grants, type Grant, type InventoryAsset, type Permission } from './data'

export interface LogEntry {
  id: string
  at: string
  kind: 'transfer' | 'revoke'
  /** the employee the inventory was run for (previous Owner, or the permission holder) */
  subjectId: string
  assetId: string
  toId?: string
  permission?: Permission
}

interface InventoryState {
  owners: Record<string, string>
  revoked: string[]
  log: LogEntry[]
}

const STORAGE_KEY = 'trust-asset-inventory-v1'
const EMPTY: InventoryState = { owners: {}, revoked: [], log: [] }
const listeners = new Set<() => void>()
let state: InventoryState | null = null

function load(): InventoryState {
  if (state) return state
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    state = raw ? ({ ...EMPTY, ...JSON.parse(raw) } as InventoryState) : EMPTY
  } catch {
    state = EMPTY
  }
  return state
}

function commit(next: InventoryState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable: keep the in-memory copy
  }
  listeners.forEach((l) => l())
}

let logSeq = 0
const entry = (partial: Omit<LogEntry, 'id' | 'at'>): LogEntry => ({
  id: `log-${Date.now()}-${(logSeq += 1)}`,
  at: new Date().toISOString(),
  ...partial,
})

export function transferAssets(fromId: string, moves: { assetId: string; toId: string }[]) {
  const current = load()
  commit({
    ...current,
    owners: { ...current.owners, ...Object.fromEntries(moves.map((m) => [m.assetId, m.toId])) },
    log: [...moves.map((m) => entry({ kind: 'transfer', subjectId: fromId, assetId: m.assetId, toId: m.toId })), ...current.log],
  })
}

export function revokeGrants(grantIds: string[]) {
  const current = load()
  const revoking = grants.filter((x) => grantIds.includes(x.id))
  commit({
    ...current,
    revoked: [...current.revoked, ...grantIds],
    log: [
      ...revoking.map((x) => entry({ kind: 'revoke', subjectId: x.employeeId, assetId: x.assetId, permission: x.permission })),
      ...current.log,
    ],
  })
}

export function resetInventory() {
  commit(EMPTY)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInventoryState() {
  return useSyncExternalStore(subscribe, load)
}

export const ownerOf = (asset: InventoryAsset, s: InventoryState) => s.owners[asset.id] ?? asset.ownerId

export function ownedBy(employeeId: string, s: InventoryState) {
  return assets.filter((x) => ownerOf(x, s) === employeeId)
}

/** Active grants: not revoked, and not on an asset the person now owns. */
export function grantsOf(employeeId: string, s: InventoryState): (Grant & { asset: InventoryAsset })[] {
  return grants
    .filter((x) => x.employeeId === employeeId && !s.revoked.includes(x.id))
    .flatMap((x) => {
      const asset = assetById(x.assetId)
      return asset && ownerOf(asset, s) !== employeeId ? [{ ...x, asset }] : []
    })
}
