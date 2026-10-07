import type { AssetLevel, Domain, SecurityLevel } from '../table-management/model'

export type AssetType = 'table' | 'task' | 'report' | 'dataset' | 'metric'
export type AssetStatus = 'active' | 'stale' | 'scheduled' | 'paused' | 'failed' | 'published' | 'draft'
export type EmployeeStatus = 'resigned' | 'transferred' | 'active'
export type Priority = 'high' | 'medium' | 'low'
export type Permission = 'read' | 'write' | 'admin'
/** [zh, en] */
export type L10n = [string, string]

export const ASSET_TYPES: AssetType[] = ['table', 'task', 'report', 'dataset', 'metric']

export interface Employee {
  id: string
  name: L10n
  email: string
  deptKey: string
  title: L10n
  status: EmployeeStatus
  /** days relative to today; negative = already effective */
  effectiveOffsetDays?: number
  toDeptKey?: string
}

export interface InventoryAsset {
  id: string
  /** initial Owner; the effective Owner also depends on transfers made in the UI */
  ownerId: string
  type: AssetType
  name: string
  desc: L10n
  domain: Domain
  assetLevel: AssetLevel
  securityLevel: SecurityLevel
  status: AssetStatus
  /** downstream consumers: tables, tasks, subscribers or references depending on type */
  impact: number
  updatedDaysAgo: number
}

/** An access permission held by someone who is not the asset's Owner. */
export interface Grant {
  id: string
  employeeId: string
  assetId: string
  permission: Permission
  grantedDaysAgo: number
  lastUsedDaysAgo: number
  expiresInDays?: number
}

export const IDLE_DAYS = 60

export const employees: Employee[] = [
  { id: 'kai.zhou', name: ['周凯', 'Kai Zhou'], email: 'kai.zhou@company.com', deptKey: 'ecommerce', title: ['高级数据工程师', 'Senior Data Engineer'], status: 'resigned', effectiveOffsetDays: -6 },
  { id: 'ya.lin', name: ['林雅', 'Ya Lin'], email: 'ya.lin@company.com', deptKey: 'risk', title: ['数据分析师', 'Data Analyst'], status: 'transferred', effectiveOffsetDays: 1, toDeptKey: 'marketing' },
  { id: 'marcus.reed', name: ['马库斯·里德', 'Marcus Reed'], email: 'marcus.reed@company.com', deptKey: 'finance', title: ['数据开发工程师', 'Data Engineer'], status: 'resigned', effectiveOffsetDays: 5 },
  { id: 'priya.nair', name: ['普里娅·奈尔', 'Priya Nair'], email: 'priya.nair@company.com', deptKey: 'marketing', title: ['数据分析师', 'Data Analyst'], status: 'transferred', effectiveOffsetDays: -2, toDeptKey: 'platform' },
  { id: 'alex.chen', name: ['陈亚历', 'Alex Chen'], email: 'alex.chen@company.com', deptKey: 'ecommerce', title: ['数据治理负责人', 'Data Governance Lead'], status: 'active' },
  { id: 'jordan.wu', name: ['吴乔丹', 'Jordan Wu'], email: 'jordan.wu@company.com', deptKey: 'customer', title: ['数据工程师', 'Data Engineer'], status: 'active' },
  { id: 'sam.park', name: ['朴山姆', 'Sam Park'], email: 'sam.park@company.com', deptKey: 'platform', title: ['数据平台工程师', 'Data Platform Engineer'], status: 'active' },
  { id: 'lena.zhang', name: ['张莉娜', 'Lena Zhang'], email: 'lena.zhang@company.com', deptKey: 'ecommerce', title: ['数据开发工程师', 'Data Engineer'], status: 'active' },
  { id: 'owen.li', name: ['李欧文', 'Owen Li'], email: 'owen.li@company.com', deptKey: 'finance', title: ['数据分析师', 'Data Analyst'], status: 'active' },
]

export function findEmployeeByEmail(email: string) {
  const q = email.trim().toLowerCase()
  return employees.find((e) => e.email.toLowerCase() === q)
}

const a = (
  ownerId: string,
  type: AssetType,
  name: string,
  desc: L10n,
  domain: Domain,
  assetLevel: AssetLevel,
  securityLevel: SecurityLevel,
  status: AssetStatus,
  impact: number,
  updatedDaysAgo: number,
): InventoryAsset => ({ id: `${type}:${name}`, ownerId, type, name, desc, domain, assetLevel, securityLevel, status, impact, updatedDaysAgo })

export const assets: InventoryAsset[] = [
  // Kai Zhou — resigned, e-commerce
  a('kai.zhou', 'table', 'dwd.dwd_commerce_order_di', ['订单明细表（日增量）', 'Order detail (daily incremental)'], 'commerce', 'P3', 'L2', 'active', 23, 1),
  a('kai.zhou', 'table', 'dws.dws_commerce_gmv_df', ['GMV 汇总表（日全量）', 'GMV summary (daily full)'], 'commerce', 'P2', 'L1', 'active', 12, 1),
  a('kai.zhou', 'table', 'ods.ods_commerce_cart_log_hi', ['购物车行为日志（小时增量）', 'Cart behavior log (hourly)'], 'commerce', 'P1', 'L1', 'stale', 2, 41),
  a('kai.zhou', 'task', 'dwd_commerce_order_di_etl', ['订单明细每日加工任务', 'Daily order detail ETL'], 'commerce', 'P3', 'L1', 'scheduled', 9, 1),
  a('kai.zhou', 'task', 'dws_commerce_gmv_daily', ['GMV 日汇总任务', 'Daily GMV rollup'], 'commerce', 'P2', 'L1', 'scheduled', 4, 1),
  a('kai.zhou', 'task', 'commerce_cart_sync_hourly', ['购物车日志小时同步', 'Hourly cart log sync'], 'commerce', 'P1', 'L1', 'failed', 1, 3),
  a('kai.zhou', 'report', '电商经营日报 / E-commerce Daily', ['每日经营核心指标报表', 'Daily core business metrics'], 'commerce', 'P2', 'L1', 'published', 36, 2),
  a('kai.zhou', 'report', '大促实时看板 / Promo Live Board', ['大促期间实时交易看板', 'Realtime trading board for promotions'], 'commerce', 'P1', 'L1', 'draft', 0, 19),
  a('kai.zhou', 'dataset', 'ds_order_analysis', ['订单分析数据集', 'Order analysis dataset'], 'commerce', 'P2', 'L1', 'active', 6, 4),
  a('kai.zhou', 'metric', 'gmv_daily', ['GMV（日）', 'GMV (daily)'], 'commerce', 'P3', 'L1', 'active', 14, 5),
  a('kai.zhou', 'metric', 'avg_order_value', ['客单价', 'Average order value'], 'commerce', 'P2', 'L1', 'active', 5, 12),

  // Ya Lin — transferring out of risk
  a('ya.lin', 'table', 'ods.ods_risk_login_log_hi', ['登录行为日志贴源表', 'Raw login behavior log'], 'risk', 'P1', 'L2', 'active', 3, 1),
  a('ya.lin', 'table', 'dwd.dwd_risk_device_di', ['设备明细表（日增量）', 'Device detail (daily incremental)'], 'risk', 'P2', 'L2', 'active', 7, 2),
  a('ya.lin', 'task', 'risk_login_log_ingest', ['登录日志小时入库', 'Hourly login log ingestion'], 'risk', 'P1', 'L2', 'scheduled', 2, 1),
  a('ya.lin', 'task', 'device_fingerprint_daily', ['设备指纹日加工', 'Daily device fingerprint build'], 'risk', 'P2', 'L2', 'paused', 3, 23),
  a('ya.lin', 'report', '登录异常监控 / Login Anomaly Monitor', ['异常登录趋势与明细', 'Abnormal login trend and detail'], 'risk', 'P2', 'L2', 'published', 18, 6),
  a('ya.lin', 'dataset', 'ds_risk_feature_wide', ['风控特征宽表', 'Risk feature wide table'], 'risk', 'P3', 'L3', 'active', 9, 3),
  a('ya.lin', 'metric', 'abnormal_login_rate', ['异常登录率', 'Abnormal login rate'], 'risk', 'P2', 'L1', 'active', 4, 8),
  a('ya.lin', 'metric', 'device_link_score', ['设备关联度', 'Device linkage score'], 'risk', 'P1', 'L2', 'stale', 1, 66),

  // Marcus Reed — resigning, finance
  a('marcus.reed', 'table', 'dwd.dwd_finance_ledger_di', ['总账明细表（日增量）', 'General ledger detail (daily)'], 'finance', 'P3', 'L3', 'active', 15, 1),
  a('marcus.reed', 'table', 'dws.dws_finance_revenue_df', ['收入汇总表（日全量）', 'Revenue summary (daily full)'], 'finance', 'P2', 'L1', 'active', 8, 2),
  a('marcus.reed', 'task', 'finance_ledger_etl', ['总账每日加工任务', 'Daily ledger ETL'], 'finance', 'P3', 'L3', 'scheduled', 11, 1),
  a('marcus.reed', 'report', '月度收入报表 / Monthly Revenue', ['面向管理层的月度收入报表', 'Monthly revenue report for leadership'], 'finance', 'P3', 'L1', 'published', 42, 9),
  a('marcus.reed', 'report', '预算执行看板 / Budget Tracker', ['预算执行跟踪（草稿）', 'Budget execution tracking (draft)'], 'finance', 'P1', 'L1', 'draft', 0, 14),
  a('marcus.reed', 'metric', 'recognized_revenue', ['确认收入', 'Recognized revenue'], 'finance', 'P3', 'L1', 'active', 12, 7),

  // Priya Nair — transferred, marketing
  a('priya.nair', 'table', 'ads.ads_marketing_campaign_roi_df', ['营销活动 ROI 应用表', 'Campaign ROI application table'], 'marketing', 'P2', 'L1', 'active', 5, 2),
  a('priya.nair', 'task', 'campaign_roi_daily', ['活动 ROI 日加工', 'Daily campaign ROI build'], 'marketing', 'P2', 'L1', 'scheduled', 3, 1),
  a('priya.nair', 'report', '活动 ROI 看板 / Campaign ROI Board', ['营销活动投入产出看板', 'Campaign spend vs. return board'], 'marketing', 'P2', 'L1', 'published', 21, 4),
  a('priya.nair', 'dataset', 'ds_user_touch_detail', ['用户触达明细数据集', 'User touchpoint detail dataset'], 'marketing', 'P2', 'L2', 'active', 4, 10),
  a('priya.nair', 'metric', 'campaign_conversion_rate', ['活动转化率', 'Campaign conversion rate'], 'marketing', 'P2', 'L1', 'active', 6, 5),

  // Alex Chen — active
  a('alex.chen', 'table', 'dim.dim_commerce_item_df', ['商品维度表（日全量）', 'Item dimension (daily full)'], 'commerce', 'P2', 'L0', 'active', 10, 3),
  a('alex.chen', 'task', 'dim_item_sync_daily', ['商品维度日同步', 'Daily item dimension sync'], 'commerce', 'P2', 'L0', 'scheduled', 4, 1),
  a('alex.chen', 'report', '商品分析 / Item Analysis', ['商品动销与库存分析', 'Item sell-through and inventory analysis'], 'commerce', 'P1', 'L0', 'published', 11, 7),
  a('alex.chen', 'metric', 'sell_through_rate', ['动销率', 'Sell-through rate'], 'commerce', 'P1', 'L0', 'active', 2, 15),

  // Jordan Wu — active
  a('jordan.wu', 'table', 'dim.dim_customer_profile_df', ['客户画像维度表', 'Customer profile dimension'], 'customer', 'P3', 'L3', 'active', 19, 2),
  a('jordan.wu', 'task', 'customer_profile_daily', ['客户画像日加工', 'Daily customer profile build'], 'customer', 'P3', 'L3', 'scheduled', 8, 1),
  a('jordan.wu', 'report', '客户增长周报 / Customer Growth Weekly', ['客户规模与增长周报', 'Weekly customer growth report'], 'customer', 'P2', 'L1', 'published', 27, 5),
  a('jordan.wu', 'dataset', 'ds_customer_tags', ['客户标签宽表', 'Customer tag wide table'], 'customer', 'P2', 'L2', 'active', 5, 11),
]

const g = (
  employeeId: string,
  assetId: string,
  permission: Permission,
  grantedDaysAgo: number,
  lastUsedDaysAgo: number,
  expiresInDays?: number,
): Grant => ({ id: `${employeeId}>${assetId}`, employeeId, assetId, permission, grantedDaysAgo, lastUsedDaysAgo, expiresInDays })

export const grants: Grant[] = [
  // Kai Zhou
  g('kai.zhou', 'table:dwd.dwd_finance_ledger_di', 'read', 300, 90),
  g('kai.zhou', 'table:ods.ods_risk_login_log_hi', 'write', 150, 30),
  g('kai.zhou', 'dataset:ds_risk_feature_wide', 'read', 80, 12, 40),
  g('kai.zhou', 'report:月度收入报表 / Monthly Revenue', 'read', 20, 1),
  g('kai.zhou', 'table:dim.dim_commerce_item_df', 'write', 400, 200),
  g('kai.zhou', 'task:finance_ledger_etl', 'admin', 100, 70),
  // Ya Lin
  g('ya.lin', 'table:dwd.dwd_commerce_order_di', 'read', 130, 2),
  g('ya.lin', 'report:电商经营日报 / E-commerce Daily', 'read', 90, 75),
  g('ya.lin', 'dataset:ds_customer_tags', 'read', 60, 60, 30),
  g('ya.lin', 'table:dim.dim_customer_profile_df', 'read', 200, 4),
  g('ya.lin', 'metric:recognized_revenue', 'read', 45, 9),
  // Marcus Reed
  g('marcus.reed', 'table:dwd.dwd_commerce_order_di', 'read', 50, 8),
  g('marcus.reed', 'metric:gmv_daily', 'read', 70, 22),
  g('marcus.reed', 'report:活动 ROI 看板 / Campaign ROI Board', 'read', 12, 5),
  g('marcus.reed', 'table:dim.dim_customer_profile_df', 'read', 33, 33),
  // Priya Nair
  g('priya.nair', 'table:dws.dws_commerce_gmv_df', 'read', 110, 14),
  g('priya.nair', 'report:登录异常监控 / Login Anomaly Monitor', 'read', 75, 80),
  g('priya.nair', 'dataset:ds_order_analysis', 'write', 40, 6),
  // Alex Chen
  g('alex.chen', 'table:dwd.dwd_finance_ledger_di', 'read', 25, 10),
  g('alex.chen', 'metric:abnormal_login_rate', 'read', 90, 90),
  g('alex.chen', 'task:customer_profile_daily', 'admin', 60, 5),
  // Jordan Wu
  g('jordan.wu', 'table:dwd.dwd_commerce_order_di', 'read', 15, 2),
  g('jordan.wu', 'report:月度收入报表 / Monthly Revenue', 'read', 30, 28),
]

export function assetById(id: string) {
  return assets.find((x) => x.id === id)
}

export function priorityOf(asset: InventoryAsset): Priority {
  if (asset.assetLevel === 'P3' || asset.impact >= 10 || (asset.type === 'task' && asset.status === 'failed')) return 'high'
  if (asset.assetLevel === 'P2' || asset.securityLevel === 'L2' || asset.securityLevel === 'L3' || asset.status === 'scheduled') {
    return 'medium'
  }
  return 'low'
}

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
export const PERMISSION_RANK: Record<Permission, number> = { admin: 0, write: 1, read: 2 }
