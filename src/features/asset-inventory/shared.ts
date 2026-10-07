import { CalendarClock, ChartColumn, Database, Gauge, Table2, type LucideIcon } from 'lucide-react'
import { employees, type AssetStatus, type AssetType, type Employee, type EmployeeStatus, type Permission, type Priority } from './data'

const DAY = 24 * 60 * 60 * 1000

export const TYPE_ICON: Record<AssetType, LucideIcon> = {
  table: Table2,
  task: CalendarClock,
  report: ChartColumn,
  dataset: Database,
  metric: Gauge,
}

export const STATUS_TONE: Record<AssetStatus, 'green' | 'amber' | 'rose' | 'neutral'> = {
  active: 'green',
  scheduled: 'green',
  published: 'green',
  stale: 'amber',
  paused: 'amber',
  draft: 'neutral',
  failed: 'rose',
}
export const EMPLOYEE_TONE: Record<EmployeeStatus, 'rose' | 'amber' | 'green'> = { resigned: 'rose', transferred: 'amber', active: 'green' }
export const PRIORITY_TONE: Record<Priority, 'rose' | 'amber' | 'neutral'> = { high: 'rose', medium: 'amber', low: 'neutral' }
export const PERMISSION_TONE: Record<Permission, 'rose' | 'amber' | 'neutral'> = { admin: 'rose', write: 'amber', read: 'neutral' }

export const dateOf = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * DAY)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const dateTimeOf = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export type TransferTargetError = 'empty' | 'notFound' | 'self' | 'inactive'

export function resolveTarget(
  email: string,
  fromId: string,
): { ok: true; employee: Employee } | { ok: false; reason: TransferTargetError } {
  const value = email.trim().toLowerCase()
  if (!value) return { ok: false, reason: 'empty' }
  const employee = employees.find((e) => e.email.toLowerCase() === value)
  if (!employee) return { ok: false, reason: 'notFound' }
  if (employee.id === fromId) return { ok: false, reason: 'self' }
  if (employee.status !== 'active') return { ok: false, reason: 'inactive' }
  return { ok: true, employee }
}

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

/** Excel-friendly CSV download (UTF-8 BOM so Chinese text is not garbled). */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([`﻿${rows.map((r) => r.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
