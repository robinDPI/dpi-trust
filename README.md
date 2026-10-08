# DPI Trust 数据治理门户

基于 React 19 + TypeScript + Vite 8 + Tailwind CSS 4 构建的纯前端数据治理门户。当前没有后端服务,所有业务数据为前端 mock,状态持久化在浏览器 `localStorage` 中。

## 快速开始

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器(Vite,默认 http://localhost:5173,支持 HMR)
npm run build        # 类型检查 (tsc -b) + 生产构建,产物输出到 dist/
npm run preview      # 本地预览 dist/ 中的生产构建
npm run lint         # 使用 Oxlint 检查代码
```

## 服务运行流程

### 1. 启动与构建流程

```
npm run dev
  └─ Vite 读取 vite.config.ts(插件:@vitejs/plugin-react + @tailwindcss/vite)
      └─ 以 index.html 为入口,加载 src/main.tsx
          └─ 浏览器按需编译并热更新(HMR)

npm run build
  ├─ tsc -b           按 tsconfig.app.json / tsconfig.node.json 做类型检查
  └─ vite build       打包压缩,输出 dist/(静态文件,可部署到任意静态服务器 / CDN)
```

生产环境部署时,由于使用 `BrowserRouter`,静态服务器需要把所有未匹配路径回退到 `index.html`(SPA fallback)。

### 2. 前端运行时流程

```
index.html (#root)
  └─ src/main.tsx
      ├─ import './i18n'        初始化 i18next(中英文,语言偏好存于 localStorage: dpi-portal-lang)
      ├─ import './index.css'   Tailwind 样式
      └─ <BrowserRouter><App/></BrowserRouter>
          └─ src/App.tsx  路由表
              └─ <AppShell/>  公共布局:TopBar / SecondaryNav / Breadcrumb / Footer / 命令面板
                  └─ <Outlet/> 按路由渲染页面
```

### 3. 路由与页面

路由由 [src/App.tsx](src/App.tsx) 与模块清单 [src/lib/data.ts](src/lib/data.ts) 共同生成:

| 路由 | 页面 |
| --- | --- |
| `/` | 首页 `Home` |
| `/governance` `/analytics` `/ai` | 分类入口页 `ModulePage`,展示该分类下的模块卡片 |
| `/governance/table-management` | 建表申请列表 `TableListPage` |
| `/governance/table-management/new` | 新建建表申请 `TableCreatePage` |
| `/governance/table-management/:requestId` | 建表申请详情 `TableDetailPage` |
| `/governance/asset-inventory` | 资产盘点 `AssetInventoryPage` |
| `/governance/pii-scan` | PII 扫描 `PiiScanPage` |
| 其余模块路径 | `ModulePlaceholder`(占位页,尚未实现) |
| `*` | 回退到首页 |

新增一个模块的步骤:
1. 在 `src/lib/data.ts` 中注册模块(id、i18n key、图标、路径)。
2. 在 `src/App.tsx` 的 `modulePages` 中把模块 id 映射到页面组件;未映射的会自动显示占位页。
3. 在 `src/i18n/locales/` 下补充中英文文案。

### 4. 数据与状态流程

各业务模块(位于 `src/features/*`)采用同一套模式:

```
data.ts / model.ts   类型定义与 mock 初始数据
        │
store.ts             模块级 store:内存 state + listeners,
        │            通过 useSyncExternalStore 供组件订阅
        ▼
页面 / 组件           读取 state、触发 store 动作(提交、确认、驳回、转移等)
        │
        ▼
localStorage         每次状态变更后持久化,刷新页面后恢复
```

各模块使用的 localStorage key:

| 模块 | Key |
| --- | --- |
| 建表管理 | `trust-table-requests-v1` |
| 资产盘点 | `trust-asset-inventory-v1` |
| PII 扫描 | `trust-pii-scan-v1` |
| 语言偏好 | `dpi-portal-lang` |

> 如需重置某个模块的演示数据,在浏览器开发者工具中删除对应 key 并刷新即可。

### 5. 典型业务流程

- **建表管理**:新建申请(填写表信息、字段、安全等级)→ 规范检查 (`checks.ts`) → 生成 DDL (`ddl.ts`) → 提交 → 在详情页查看状态与审批流转。
- **资产盘点**:查看名下资产 → 发起转移 (`TransferDialog`) 或回收 (`RevokeDialog`) → 更新资产归属与记录。
- **PII 扫描**:扫描发现疑似敏感字段 → 通知责任人(可通过 `LarkDialog` 发送飞书通知)→ 责任人确认 / 驳回 / 修改安全等级 (`LabelDialog`) → 记录日志并累计反馈、覆盖率统计。

## 目录结构

```
src/
├─ main.tsx / App.tsx      入口与路由
├─ components/             layout(外壳)、ui(基础组件)、command(命令面板)、dashboard
├─ features/               业务模块:table-management / asset-inventory / pii-scan
├─ pages/                  Home、ModulePage、ModulePlaceholder
├─ lib/                    模块清单 data.ts、工具函数、hooks
└─ i18n/                   i18next 初始化与 zh / en 文案
```

## 开发说明

- Lint 使用 Oxlint(`npm run lint`);如需类型感知规则,可安装 `oxlint-tsgolint` 并在 `.oxlintrc.json` 中开启 `typeAware`。
- 未启用 React Compiler,如需启用参见 [官方文档](https://react.dev/learn/react-compiler/installation)。
