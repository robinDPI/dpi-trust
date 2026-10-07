import { useSyncExternalStore } from 'react'
import { runChecks, scoreOf } from './checks'
import { generateDdl } from './ddl'
import { emptyDraft, newColumn, type ColumnDraft, type TableDraft } from './model'

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'created'
export type RequestMode = 'standard' | 'ddl'

export const REQUEST_STATUSES: RequestStatus[] = ['pending', 'approved', 'rejected', 'created']
export const CURRENT_USER = 'Alex Chen'

export interface TableRequest {
  id: string
  draft: TableDraft
  ddl: string
  mode: RequestMode
  status: RequestStatus
  creator: string
  createdAt: string
  updatedAt: string
  reviewer?: string
  rejectReason?: string
  score: number
}

const STORAGE_KEY = 'trust-table-requests-v1'
const listeners = new Set<() => void>()
let cache: TableRequest[] | null = null

const DAY = 24 * 60 * 60 * 1000

function col(name: string, type: string, comment: string, security: ColumnDraft['security'], extra: Partial<ColumnDraft> = {}) {
  return newColumn({ name, type, comment, security, ...extra })
}

function seedRequests(): TableRequest[] {
  const now = Date.now()
  const base = (partial: Partial<TableDraft>): TableDraft => ({ ...emptyDraft(), columns: [], ...partial })

  const make = (
    n: number,
    daysAgo: number,
    meta: Pick<TableRequest, 'mode' | 'status' | 'creator' | 'reviewer' | 'rejectReason'>,
    draft: TableDraft,
    reviewedAfterHours = 5,
  ): TableRequest => {
    const createdAt = new Date(now - daysAgo * DAY)
    const updatedAt = meta.status === 'pending' ? createdAt : new Date(createdAt.getTime() + reviewedAfterHours * 3600 * 1000)
    return {
      id: `TR-${String(n).padStart(4, '0')}`,
      ...meta,
      draft,
      ddl: generateDdl(draft),
      score: scoreOf(runChecks(draft)),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }
  }

  return [
    make(
      5,
      0.2,
      { mode: 'ddl', status: 'pending', creator: CURRENT_USER },
      base({
        layer: 'dws', domain: 'finance', subject: 'revenue', period: 'df',
        comment: '财务收入汇总表（日全量）', assetLevel: 'P2', owner: 'finance.data@company.com',
        businessDescription: '按日汇总各渠道确认收入，供财务月报与经营分析使用，口径与总账保持一致。',
        columns: [
          col('channel', 'string', '渠道', 'L0', { primaryKey: true, nullable: false }),
          col('revenue_amount', 'decimal(18,2)', '确认收入', 'L1'),
          col('dt', 'string', '分区日期', 'L0', { partition: true }),
        ],
      }),
    ),
    make(
      4,
      1.5,
      { mode: 'standard', status: 'approved', creator: 'Jordan Wu', reviewer: 'Maya Lin' },
      base({
        layer: 'ads', domain: 'marketing', subject: 'campaign_roi', period: 'df',
        comment: '营销活动 ROI 应用表（日全量）', assetLevel: 'P2', owner: 'jordan.wu@company.com',
        businessDescription: '按活动维度统计投入与带来的 GMV，用于营销看板的 ROI 展示与预算复盘。',
        columns: [
          col('campaign_id', 'bigint', '活动ID', 'L0', { primaryKey: true, nullable: false }),
          col('cost_amount', 'decimal(18,2)', '投入金额', 'L1'),
          col('gmv_amount', 'decimal(18,2)', '带来 GMV', 'L1'),
          col('dt', 'string', '分区日期', 'L0', { partition: true }),
        ],
      }),
    ),
    make(
      3,
      3,
      { mode: 'ddl', status: 'rejected', creator: 'Priya Nair', reviewer: 'Maya Lin', rejectReason: '业务描述过于简略，请补充数据来源与统计口径后重新提交。' },
      base({
        layer: 'ods', domain: 'risk', subject: 'login_log', period: 'hi',
        comment: '登录行为日志贴源表（小时增量）', assetLevel: 'P1', owner: 'risk.platform@company.com',
        businessDescription: '风控登录日志，用于异常登录识别与账号安全分析。',
        columns: [
          col('user_id', 'bigint', '用户ID', 'L0'),
          col('login_ip', 'string', '登录IP', 'L2'),
          col('device_id', 'string', '设备ID', 'L1'),
          col('event_time', 'timestamp', '登录时间', 'L0'),
        ],
      }),
      2,
    ),
    make(
      2,
      6,
      { mode: 'standard', status: 'created', creator: CURRENT_USER, reviewer: 'Maya Lin' },
      base({
        layer: 'dwd', domain: 'commerce', subject: 'order', period: 'di',
        comment: '订单明细表（日增量）', assetLevel: 'P3', owner: 'alex.chen@company.com',
        businessDescription: '订单明细事实表，一行一个订单，是营收统计、转化分析与风控建模的核心数据来源。',
        columns: [
          col('order_id', 'bigint', '订单ID', 'L0', { primaryKey: true, nullable: false }),
          col('user_id', 'bigint', '用户ID', 'L0'),
          col('user_phone', 'string', '用户手机号', 'L2'),
          col('order_amount', 'decimal(18,2)', '订单金额', 'L1'),
          col('created_at', 'timestamp', '下单时间', 'L0'),
          col('dt', 'string', '分区日期', 'L0', { partition: true }),
        ],
      }),
      3,
    ),
    make(
      1,
      9,
      { mode: 'standard', status: 'created', creator: 'Jordan Wu', reviewer: 'Maya Lin' },
      base({
        layer: 'dim', domain: 'customer', subject: 'profile', period: 'df',
        comment: '客户画像维度表（日全量）', assetLevel: 'P3', owner: 'customer.data@company.com',
        businessDescription: '客户基础画像维度表，含身份与联系方式，是各业务线关联客户的统一维度来源。',
        columns: [
          col('customer_id', 'bigint', '客户ID', 'L0', { primaryKey: true, nullable: false }),
          col('id_card_no', 'string', '证件号', 'L3'),
          col('mobile', 'string', '手机号', 'L2'),
          col('register_date', 'date', '注册日期', 'L0'),
        ],
      }),
      8,
    ),
  ]
}

function notify() {
  listeners.forEach((l) => l())
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // storage unavailable (private mode / quota): keep the in-memory copy only
  }
}

function load(): TableRequest[] {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cache = JSON.parse(raw) as TableRequest[]
      return cache
    }
  } catch {
    // fall through to seeding
  }
  cache = seedRequests()
  persist()
  return cache
}

export function addRequest(input: { draft: TableDraft; ddl: string; mode: RequestMode }): TableRequest {
  const all = load()
  const next = Math.max(0, ...all.map((r) => Number(r.id.replace(/\D/g, '')))) + 1
  const now = new Date().toISOString()
  const request: TableRequest = {
    id: `TR-${String(next).padStart(4, '0')}`,
    ...input,
    status: 'pending',
    creator: CURRENT_USER,
    createdAt: now,
    updatedAt: now,
    score: scoreOf(runChecks(input.draft)),
  }
  cache = [request, ...all]
  persist()
  notify()
  return request
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTableRequests() {
  return useSyncExternalStore(subscribe, load)
}

export function useTableRequest(id: string | undefined) {
  return useTableRequests().find((r) => r.id === id)
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
