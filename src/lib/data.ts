import {
  Activity,
  BarChart3,
  Cloud,
  Code2,
  FileClock,
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  Layers,
  ListChecks,
  PackageSearch,
  Share2,
  Sparkles,
  Table2,
  UploadCloud,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export type Tint = 'blue' | 'green' | 'purple' | 'cyan' | 'amber' | 'slate'

export type NavKey = 'home' | 'governance' | 'analytics' | 'ai'

export interface ModuleItem {
  id: string
  i18nKey: string
  icon: LucideIcon
  tint: Tint
  path: string
}

export interface ModuleGroup {
  id: string
  categoryKey: string
  nav: NavKey
  items: ModuleItem[]
}

export interface RegisteredModule extends ModuleItem {
  nav: NavKey
}

export const navRoutes: Record<NavKey, string> = {
  home: '/',
  governance: '/governance',
  analytics: '/analytics',
  ai: '/ai',
}

export const moduleGroups: ModuleGroup[] = [
  {
    id: 'governance-overview',
    categoryKey: 'categories.governanceOverview',
    nav: 'governance',
    items: [
      {
        id: 'governanceOverview',
        i18nKey: 'categories.governanceOverviewItem',
        icon: LayoutDashboard,
        tint: 'slate',
        path: '/governance/overview',
      },
    ],
  },
  {
    id: 'data-security',
    categoryKey: 'categories.dataSecurity',
    nav: 'governance',
    items: [
      { id: 'accessCenter', i18nKey: 'governanceModules.accessCenter', icon: KeyRound, tint: 'slate', path: '/governance/access-center' },
      { id: 's3AccessCenter', i18nKey: 'governanceModules.s3AccessCenter', icon: Cloud, tint: 'cyan', path: '/governance/s3-access-center' },
      { id: 'auditLog', i18nKey: 'governanceModules.auditLog', icon: FileClock, tint: 'slate', path: '/governance/audit-log' },
      { id: 'piiScan', i18nKey: 'governanceModules.piiScan', icon: Fingerprint, tint: 'amber', path: '/governance/pii-scan' },
    ],
  },
  {
    id: 'data-quality',
    categoryKey: 'categories.dataQuality',
    nav: 'governance',
    items: [{ id: 'dqc', i18nKey: 'governanceModules.dqc', icon: ListChecks, tint: 'green', path: '/governance/dqc' }],
  },
  {
    id: 'data-asset',
    categoryKey: 'categories.dataAsset',
    nav: 'governance',
    items: [
      { id: 'dataMap', i18nKey: 'governanceModules.dataMap', icon: Share2, tint: 'blue', path: '/governance/data-map' },
      { id: 'assetInventory', i18nKey: 'governanceModules.assetInventory', icon: PackageSearch, tint: 'blue', path: '/governance/asset-inventory' },
      { id: 'featureStore', i18nKey: 'products.featureStore', icon: Layers, tint: 'amber', path: '/governance/feature-store' },
    ],
  },
  {
    id: 'data-tool',
    categoryKey: 'categories.dataTool',
    nav: 'governance',
    items: [
      { id: 'fileSheetIngestion', i18nKey: 'governanceModules.fileSheetIngestion', icon: UploadCloud, tint: 'blue', path: '/governance/file-sheet-ingestion' },
      { id: 'tableManagement', i18nKey: 'governanceModules.tableManagement', icon: Table2, tint: 'blue', path: '/governance/table-management' },
      { id: 'realtimePlatform', i18nKey: 'governanceModules.realtimePlatform', icon: Activity, tint: 'green', path: '/governance/realtime-platform' },
    ],
  },
  {
    id: 'analytics',
    categoryKey: 'nav.analytics',
    nav: 'analytics',
    items: [
      { id: 'datawind', i18nKey: 'products.datawind', icon: BarChart3, tint: 'blue', path: '/analytics/datawind' },
      { id: 'dataQuery', i18nKey: 'products.dataQuery', icon: Code2, tint: 'green', path: '/analytics/data-query' },
    ],
  },
  {
    id: 'ai-apps',
    categoryKey: 'nav.ai',
    nav: 'ai',
    items: [
      { id: 'purposeGate', i18nKey: 'products.purposeGate', icon: Workflow, tint: 'purple', path: '/ai/purpose-gate' },
      { id: 'intelligentWorkspace', i18nKey: 'products.intelligentWorkspace', icon: Sparkles, tint: 'purple', path: '/ai/intelligent-workspace' },
    ],
  },
]

export const allModules: RegisteredModule[] = moduleGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, nav: group.nav })),
)

export function findModuleByPath(pathname: string): RegisteredModule | undefined {
  return allModules.find((m) => pathname === m.path || pathname.startsWith(`${m.path}/`))
}

export function navKeyForPath(pathname: string): NavKey {
  const match = (Object.keys(navRoutes) as NavKey[]).find((k) => k !== 'home' && pathname.startsWith(navRoutes[k]))
  return match ?? 'home'
}
