# 飞书多维表格数据助手插件

这是一个飞书多维表格侧边栏插件，帮助用户通过可配置的 API 集成自动补全和更新行数据。此插件为纯前端实现，使用飞书多维表格开放平台的 JavaScript SDK（@lark-base-open/js-sdk）直接与飞书多维表格交互。

## 功能特点

- **字段自动补全**: 检测当前选中的单元格并通过 API 获取相关数据
- **数据同步**: 通过配置的主键更新行数据
- **字段映射选择**: 选择哪些获取的数据映射到哪些列
- **数据差异高亮**: 在更新数据时提供视觉指示
- **用户信息展示**: 显示当前用户 ID 及相关信息
- **本地数据存储**: 使用飞书插件存储 API 保存配置数据

## 安装和运行

### 前置条件

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn
```

### 启动项目

项目已经配置为纯前端项目，可以通过以下方式启动：

#### 方法 1：使用通用启动脚本（推荐）

```bash
# 使用通用启动脚本
npm start
# 或
yarn start
```

#### 方法 2：使用系统特定脚本

**Windows 系统**：

```
run-windows.bat
```

**macOS/Linux 系统**：

```bash
# 给脚本添加执行权限
chmod +x run-unix.sh

# 运行脚本
./run-unix.sh
```

#### 方法 3：直接使用 Vite

```bash
# 本地开发
npm run dev
# 或
yarn dev

# 如需在局域网内访问
npm run dev:host
# 或
yarn dev:host
```

### 在飞书多维表格中使用

1. 在飞书开发者平台创建一个企业自建应用
2. 添加一个"多维表格插件"功能
3. 在插件配置中设置 URL 为此项目的访问地址
4. 在多维表格中启用该插件

## 插件架构

此插件采用纯前端架构，通过以下方式实现功能：

1. **飞书多维表格 SDK 集成**：使用@lark-base-open/js-sdk 直接与多维表格交互
2. **本地数据存储**：使用 bitable.bridge.setData/getData API 存储配置数据
3. **React + TanStack Query**：用于状态管理和 API 请求
4. **UI 组件库**：使用 shadcn/ui 和 Tailwind CSS 构建界面

## 开发者注意事项

- 该插件使用了 Feishu Base JS-SDK 与飞书多维表格进行交互
- 插件遵循飞书的设计规范，使用颜色：飞书蓝 #2E6BE0，强调蓝 #165DFF
- 用户 ID 是通过 `bitable.bridge.getBaseUserId()` 获取的，该 ID 在多维表格内唯一，但与飞书开放平台的 OpenUserId 不通用
- 所有 API 操作都是通过前端代码完成的，无需后端服务
- 插件配置数据存储在飞书多维表格的插件存储区域中

## 文件结构

- `/client`: 前端代码
  - `/src/components`: UI 组件（包括 UserInfo、FieldMapping 等）
  - `/src/pages`: 页面组件（包括 FieldAutoComplete、DataSync）
  - `/src/lib`: 工具库
    - `feishuBase.ts`: 飞书多维表格 SDK 的封装
    - `apiService.ts`: API 服务操作和数据存储
    - `queryClient.ts`: TanStack Query 配置
  - `/src/hooks`: React 钩子（包括 use-feishu-base、use-toast 等）
- `/attached_assets`: 参考文档和资源
- `/scripts`: 启动脚本

## 飞书多维表格 JS-SDK 参考

使用@lark-base-open/js-sdk 时，需要注意以下几个关键 API：

- **bitable.base**: 获取多维表格的表、字段、记录等
- **bitable.bridge**: 插件桥接 API，包括用户信息、数据存储等
- **数据存储**: 使用 bitable.bridge.setData/getData 操作插件数据

更多详细信息，请参考飞书开发者文档和 attached_assets 目录下的 SDK 参考文档。
