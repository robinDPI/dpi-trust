import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AssetInventoryPage } from './features/asset-inventory/AssetInventoryPage'
import { PiiScanPage } from './features/pii-scan/PiiScanPage'
import { TableCreatePage } from './features/table-management/TableCreatePage'
import { TableDetailPage } from './features/table-management/TableDetailPage'
import { TableListPage } from './features/table-management/TableListPage'
import { allModules } from './lib/data'
import { Home } from './pages/Home'
import { ModulePage } from './pages/ModulePage'
import { ModulePlaceholder } from './pages/ModulePlaceholder'

const modulePages: Record<string, ReactElement> = {
  tableManagement: <TableListPage />,
  assetInventory: <AssetInventoryPage />,
  piiScan: <PiiScanPage />,
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="governance" element={<ModulePage navKey="governance" />} />
        <Route path="analytics" element={<ModulePage navKey="analytics" />} />
        <Route path="ai" element={<ModulePage navKey="ai" />} />
        {allModules.map((m) => (
          <Route
            key={m.id}
            path={m.path.slice(1)}
            element={modulePages[m.id] ?? <ModulePlaceholder moduleId={m.id} />}
          />
        ))}
        <Route path="governance/table-management/new" element={<TableCreatePage />} />
        <Route path="governance/table-management/:requestId" element={<TableDetailPage />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
