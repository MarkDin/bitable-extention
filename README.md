# 飞书多维表格数据助手插件

这是一个飞书多维表格侧边栏插件，帮助用户通过可配置的API集成自动补全和更新行数据。此插件为纯前端实现，使用飞书多维表格开放平台的JavaScript SDK（@lark-base-open/js-sdk）直接与飞书多维表格交互。

## 功能特点

- **字段自动补全**: 检测当前选中的单元格并通过API获取相关数据
- **数据同步**: 通过配置的主键更新行数据
- **字段映射选择**: 选择哪些获取的数据映射到哪些列
- **数据差异高亮**: 在更新数据时提供视觉指示
- **用户信息展示**: 显示当前用户ID及相关信息
- **本地数据存储**: 使用飞书插件存储API保存配置数据

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

#### 纯前端模式（推荐）

由于此插件已重构为纯前端实现，不再需要后端服务，推荐使用纯前端模式运行：

**Windows系统**：
```
scripts\start-frontend-windows.bat
```
或者直接执行：
```
npx vite
```

**macOS/Linux系统**：
```bash
# 给脚本添加执行权限
chmod +x scripts/start-frontend-unix.sh

# 运行脚本
./scripts/start-frontend-unix.sh
```
或者直接执行：
```
npx vite
```

#### 包含后端的旧模式（不再需要）

```bash
npm run dev
# 或
yarn dev
```

### 在飞书多维表格中使用

1. 在飞书开发者平台创建一个企业自建应用
2. 添加一个"多维表格插件"功能
3. 在插件配置中设置URL为此项目的访问地址
4. 在多维表格中启用该插件

## 插件架构

此插件采用纯前端架构，通过以下方式实现功能：

1. **飞书多维表格SDK集成**：使用@lark-base-open/js-sdk直接与多维表格交互
2. **本地数据存储**：使用bitable.bridge.setData/getData API存储配置数据
3. **React + TanStack Query**：用于状态管理和API请求
4. **UI组件库**：使用shadcn/ui和Tailwind CSS构建界面

## 开发者注意事项

- 该插件使用了Feishu Base JS-SDK与飞书多维表格进行交互
- 插件遵循飞书的设计规范，使用颜色：飞书蓝 #2E6BE0，强调蓝 #165DFF
- 用户ID是通过 `bitable.bridge.getBaseUserId()` 获取的，该ID在多维表格内唯一，但与飞书开放平台的OpenUserId不通用
- 所有API操作都是通过前端代码完成的，无需后端服务
- 插件配置数据存储在飞书多维表格的插件存储区域中

## 文件结构

- `/client`: 前端代码
  - `/src/components`: UI组件（包括UserInfo、FieldMapping等）
  - `/src/pages`: 页面组件（包括FieldAutoComplete、DataSync）
  - `/src/lib`: 工具库
    - `feishuBase.ts`: 飞书多维表格SDK的封装
    - `apiService.ts`: API服务操作和数据存储
    - `queryClient.ts`: TanStack Query配置
  - `/src/hooks`: React钩子（包括use-feishu-base、use-toast等）
- `/attached_assets`: 参考文档和资源
- `/scripts`: 启动脚本

## 飞书多维表格JS-SDK参考

使用@lark-base-open/js-sdk时，需要注意以下几个关键API：

- **bitable.base**: 获取多维表格的表、字段、记录等
- **bitable.bridge**: 插件桥接API，包括用户信息、数据存储等
- **数据存储**: 使用bitable.bridge.setData/getData操作插件数据

更多详细信息，请参考飞书开发者文档和attached_assets目录下的SDK参考文档。