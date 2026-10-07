import type { SecurityLevel } from '../table-management/model'
import { SECURITY_LEVELS } from '../table-management/model'
import type { L10n } from '../asset-inventory/data'

export type Category =
  | 'idCard'
  | 'bankAccount'
  | 'phone'
  | 'email'
  | 'address'
  | 'realName'
  | 'ip'
  | 'userId'
  | 'deviceInfo'
  | 'amount'
  | 'gender'
  | 'general'

export type IssueType = 'underrated' | 'overrated' | 'untagged'

export interface ScanColumn {
  name: string
  type: string
  comment: L10n
  /** label currently stored in the catalog; '' = never tagged */
  current: SecurityLevel | ''
  ai: { level: SecurityLevel; category: Category; confidence: number; signals: L10n[]; sample: string }
}

export interface ScanTable {
  /** full table name, also the asset name in Asset Inventory */
  id: string
  /** used when the table is not a registered inventory asset */
  fallbackOwnerId: string
  /** only appears after a re-scan finds it */
  discoveredByRescan?: boolean
  columns: ScanColumn[]
}

/** Historical Owner feedback the accuracy figure is measured against. */
export const BASELINE_FEEDBACK = { confirmed: 33, rejected: 7 }

const c = (
  name: string,
  type: string,
  comment: L10n,
  current: ScanColumn['current'],
  level: SecurityLevel,
  category: Category,
  confidence: number,
  sample: string,
  signals: L10n[] = [],
): ScanColumn => ({ name, type, comment, current, ai: { level, category, confidence, signals, sample } })

export const scanTables: ScanTable[] = [
  {
    id: 'dwd.dwd_commerce_order_di',
    fallbackOwnerId: 'alex.chen',
    columns: [
      c('order_id', 'bigint', ['订单ID', 'Order ID'], 'L0', 'L0', 'general', 0.97, '10028431', [['业务主键，不含个人信息', 'Business key with no personal data']]),
      c('user_id', 'bigint', ['用户ID', 'User ID'], 'L0', 'L1', 'userId', 0.78, '88213907', [['字段名匹配 user_id', 'Name matches user_id'], ['可与用户画像表关联到个人', 'Joinable to the customer profile to identify a person']]),
      c('user_phone', 'string', ['用户手机号', 'User phone'], 'L1', 'L2', 'phone', 0.99, '138****5678', [['字段名与注释均指向手机号', 'Name and comment both point to a phone number'], ['样本符合 11 位手机号格式', 'Samples match the 11-digit phone pattern']]),
      c('order_amount', 'decimal(18,2)', ['订单金额', 'Order amount'], 'L1', 'L1', 'amount', 0.91, '259.00', [['经营金额，属内部数据', 'Business amount, internal data']]),
      c('receiver_address', 'string', ['收货地址', 'Delivery address'], '', 'L2', 'address', 0.95, '上海市浦东新区***路12号', [['注释为收货地址', 'Comment says delivery address'], ['样本包含省市区与门牌信息', 'Samples contain province, city and street details']]),
      c('created_at', 'timestamp', ['下单时间', 'Order time'], 'L0', 'L0', 'general', 0.96, '2026-10-06 14:32:07'),
    ],
  },
  {
    id: 'dim.dim_customer_profile_df',
    fallbackOwnerId: 'jordan.wu',
    columns: [
      c('customer_id', 'bigint', ['客户ID', 'Customer ID'], 'L0', 'L0', 'general', 0.9, '5300121'),
      c('id_card_no', 'string', ['证件号', 'ID number'], 'L2', 'L3', 'idCard', 0.99, '3101**********1234', [['样本符合 18 位身份证格式并通过校验位', 'Samples match the 18-digit ID format and pass the checksum'], ['字段名包含 id_card', 'Name contains id_card']]),
      c('mobile', 'string', ['手机号', 'Mobile'], 'L2', 'L2', 'phone', 0.98, '139****0021'),
      c('email', 'string', ['邮箱', 'Email'], '', 'L2', 'email', 0.97, 'a***@mail.com', [['样本符合邮箱格式', 'Samples match the email format'], ['字段名为 email', 'Name is email']]),
      c('gender', 'string', ['性别', 'Gender'], 'L3', 'L1', 'gender', 0.64, 'M / F', [['低基数枚举，单独无法识别个人', 'Low-cardinality enum; cannot identify a person on its own']]),
      c('register_date', 'date', ['注册日期', 'Registration date'], 'L0', 'L0', 'general', 0.95, '2025-03-18'),
    ],
  },
  {
    id: 'ods.ods_risk_login_log_hi',
    fallbackOwnerId: 'ya.lin',
    columns: [
      c('user_id', 'bigint', ['用户ID', 'User ID'], 'L0', 'L1', 'userId', 0.74, '88213907', [['字段名匹配 user_id', 'Name matches user_id']]),
      c('login_ip', 'string', ['登录IP', 'Login IP'], 'L2', 'L2', 'ip', 0.96, '203.0.113.***'),
      c('device_id', 'string', ['设备ID', 'Device ID'], 'L1', 'L1', 'deviceInfo', 0.85, 'a91f…c03e'),
      c('user_agent', 'string', ['客户端 UA', 'Client user agent'], '', 'L1', 'deviceInfo', 0.66, 'Mozilla/5.0 (iPhone; CPU…', [['UA 可参与设备指纹拼接', 'The user agent can contribute to device fingerprinting']]),
      c('event_time', 'timestamp', ['登录时间', 'Login time'], 'L0', 'L0', 'general', 0.95, '2026-10-06 09:12:44'),
    ],
  },
  {
    id: 'dwd.dwd_finance_ledger_di',
    fallbackOwnerId: 'owen.li',
    columns: [
      c('voucher_no', 'string', ['凭证号', 'Voucher number'], 'L0', 'L0', 'general', 0.9, 'V20261006-0042'),
      c('account_no', 'string', ['银行账号', 'Bank account'], '', 'L3', 'bankAccount', 0.98, '6222 **** **** 3456', [['样本为 16–19 位卡号并通过 Luhn 校验', 'Samples are 16–19 digit card numbers that pass the Luhn check'], ['注释为银行账号', 'Comment says bank account']]),
      c('counterparty_name', 'string', ['对手方名称', 'Counterparty name'], '', 'L2', 'realName', 0.86, '王*明', [['样本为自然人姓名', 'Samples are personal names']]),
      c('ledger_amount', 'decimal(18,2)', ['记账金额', 'Ledger amount'], 'L3', 'L1', 'amount', 0.7, '12000.00', [['金额属内部经营数据，不含个人身份信息', 'Amounts are internal business data with no personal identifiers']]),
    ],
  },
  {
    id: 'dws.dws_marketing_user_touch_df',
    fallbackOwnerId: 'sam.park',
    columns: [
      c('user_id', 'bigint', ['用户ID', 'User ID'], '', 'L1', 'userId', 0.77, '88213907', [['字段名匹配 user_id', 'Name matches user_id']]),
      c('channel', 'string', ['触达渠道', 'Touch channel'], '', 'L0', 'general', 0.9, 'sms / push / email'),
      c('touch_phone', 'string', ['触达手机号', 'Touch phone'], '', 'L2', 'phone', 0.97, '137****8890', [['样本符合 11 位手机号格式', 'Samples match the 11-digit phone pattern']]),
      c('touch_email', 'string', ['触达邮箱', 'Touch email'], '', 'L2', 'email', 0.96, 'b***@mail.com', [['样本符合邮箱格式', 'Samples match the email format']]),
      c('touch_time', 'timestamp', ['触达时间', 'Touch time'], '', 'L0', 'general', 0.93, '2026-10-05 20:00:00'),
    ],
  },
  {
    id: 'ads.ads_marketing_campaign_roi_df',
    fallbackOwnerId: 'priya.nair',
    columns: [
      c('campaign_id', 'bigint', ['活动ID', 'Campaign ID'], 'L0', 'L0', 'general', 0.95, '7001'),
      c('cost_amount', 'decimal(18,2)', ['投入金额', 'Cost'], 'L1', 'L1', 'amount', 0.9, '50000.00'),
      c('gmv_amount', 'decimal(18,2)', ['带来 GMV', 'GMV'], 'L1', 'L1', 'amount', 0.9, '182000.00'),
      c('dt', 'string', ['分区日期', 'Partition date'], 'L0', 'L0', 'general', 0.96, '2026-10-06'),
    ],
  },
  {
    id: 'dim.dim_commerce_item_df',
    fallbackOwnerId: 'alex.chen',
    columns: [
      c('item_id', 'bigint', ['商品ID', 'Item ID'], 'L0', 'L0', 'general', 0.96, '9910021'),
      c('item_name', 'string', ['商品名称', 'Item name'], 'L0', 'L0', 'general', 0.92, '无线耳机 Pro'),
      c('category', 'string', ['类目', 'Category'], 'L0', 'L0', 'general', 0.93, '数码/耳机'),
      c('price', 'decimal(18,2)', ['售价', 'Price'], 'L1', 'L1', 'amount', 0.88, '299.00'),
    ],
  },
  {
    id: 'ods.ods_commerce_refund_log_di',
    fallbackOwnerId: 'lena.zhang',
    discoveredByRescan: true,
    columns: [
      c('refund_id', 'bigint', ['退款单ID', 'Refund ID'], '', 'L0', 'general', 0.95, '30077121'),
      c('buyer_phone', 'string', ['买家手机号', 'Buyer phone'], '', 'L2', 'phone', 0.98, '135****2210', [['样本符合 11 位手机号格式', 'Samples match the 11-digit phone pattern']]),
      c('bank_card_no', 'string', ['退款银行卡号', 'Refund bank card'], '', 'L3', 'bankAccount', 0.97, '6217 **** **** 8821', [['样本为卡号并通过 Luhn 校验', 'Samples are card numbers that pass the Luhn check']]),
      c('refund_amount', 'decimal(18,2)', ['退款金额', 'Refund amount'], '', 'L1', 'amount', 0.9, '59.00'),
    ],
  },
]

export const levelRank = (level: SecurityLevel | '') => (level ? SECURITY_LEVELS.indexOf(level) : -1)

export function issueOf(current: SecurityLevel | '', suggested: SecurityLevel): IssueType | null {
  if (!current) return 'untagged'
  if (levelRank(current) < levelRank(suggested)) return 'underrated'
  if (levelRank(current) > levelRank(suggested)) return 'overrated'
  return null
}

export const findingKey = (tableId: string, column: string) => `${tableId}.${column}`
export const ISSUE_RANK: Record<IssueType, number> = { underrated: 0, untagged: 1, overrated: 2 }

export function maxLevel(levels: (SecurityLevel | '')[]): SecurityLevel | '' {
  return levels.reduce<SecurityLevel | ''>((max, l) => (levelRank(l) > levelRank(max) ? l : max), '')
}
