# 飞书多维表格数据助手插件

这是一个飞书多维表格侧边栏插件，帮助用户通过可配置的 API 集成自动补全和更新行数据。此插件为纯前端实现，使用飞书多维表格开放平台的 JavaScript SDK（@lark-base-open/js-sdk）直接与飞书多维表格交互。

## 功能特点

- **字段自动补全**: 检测当前选中的单元格并通过 API 获取相关数据
- **数据同步**: 通过配置的主键更新行数据
- **字段映射选择**: 选择哪些获取的数据映射到哪些列
- **数据差异高亮**: 在更新数据时提供视觉指示
- **用户信息展示**: 显示当前用户 ID 及相关信息
- **本地数据存储**: 使用飞书插件存储 API 保存配置数据
- **操作日志功能**: 记录每次补全操作的详细信息
- **🔐 免登录功能**: 支持Token自动刷新，用户登录后一段时间内无需重复登录

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

## ⚠️ 重要：Hash路由配置

本项目使用 **Hash路由** 进行页面导航，所有页面访问都需要使用 `#` 符号。

### 页面访问地址

- **主页**: `https://your-domain.com/#/`
- **登录页面**: `https://your-domain.com/#/login`
- **用户信息页面**: `https://your-domain.com/#/user-info`
- **字段自动补全**: `https://your-domain.com/#/auto-complete`
- **配置管理**: `https://your-domain.com/#/config-manager`
- **权限管理**: `https://your-domain.com/#/permission-manager`

### 飞书OAuth重定向URI配置

在飞书开放平台应用配置中，**重定向URI** 必须设置为：
```
https://your-domain.com/#/auth/callback
```

**注意**：必须包含 `#` 符号，否则OAuth回调将无法正常工作。

### 本地开发访问地址

启动开发服务器后，访问地址为：
- **主页**: `https://localhost:5000/#/` 或 `https://localhost:5000/` (自动重定向)
- **登录页面**: `https://localhost:5000/#/login`
- **字段自动补全**: `https://localhost:5000/#/auto-complete`
- **用户信息**: `https://localhost:5000/#/user-info`

> **💡 提示**: 系统会自动检测并重定向到正确的hash路由格式，所以访问 `https://localhost:5000/` 会自动跳转到 `https://localhost:5000/#/`

### 🔐 免登录功能说明

本插件实现了完整的免登录机制：

#### 工作原理
1. **Token存储**: 用户登录后，access_token、refresh_token和用户信息会自动保存到浏览器本地存储
2. **自动恢复**: 重新打开插件时，系统会自动检查本地存储的登录状态
3. **Token刷新**: 当access_token过期时，系统会自动使用refresh_token获取新的token
4. **状态同步**: 用户信息会同步到全局状态管理中，供整个应用使用

#### 用户体验
- ✅ **首次登录**: 使用飞书扫码登录
- ✅ **免登录**: 登录后一段时间内（根据token有效期），重新打开插件无需再次登录
- ✅ **自动刷新**: Token过期时自动刷新，用户无感知
- ✅ **状态指示**: 界面显示当前登录状态和用户信息

#### 安全性
- Token安全存储在浏览器本地，与域名绑定
- 支持自动Token刷新，延长登录有效期
- 提供完整的登出功能，清除所有本地认证信息

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

## 操作日志功能

插件会自动记录每次补全操作的详细信息，包括：

### 记录的信息
1. **补全提交时间** - 操作开始的时间戳
2. **补全结束时间** - 操作完成的时间戳  
3. **补全字段列表** - 用户勾选的字段名称
4. **补全行数** - 处理的总记录数
5. **补全结果** - 成功、失败、未变更的统计
6. **多维表格链接** - 操作的表格直链

### 日志存储
- 本地存储：保存在浏览器 localStorage 中，最多保留 50 条记录
- 飞书通知：自动发送操作结果卡片到配置的飞书群聊

### 使用示例

```typescript
import { autoCompleteFields, OperationLog } from '@/lib/autoCompleteHelper';

// 调用自动补全功能
await autoCompleteFields({
  toast,
  selectedFields,
  queryFieldId: 'field_id_123',
  onProgress: (completed, total) => {
    console.log(`进度: ${completed}/${total}`);
  },
  onComplete: (result) => {
    console.log('补全完成:', result);
  },
  onOperationLog: (log: OperationLog) => {
    // 处理操作日志
    console.log('操作日志:', log);
    
    // 示例日志格式：
    // {
    //   submitTime: "2024-01-15T10:30:00.000Z",
    //   endTime: "2024-01-15T10:32:15.000Z", 
    //   selectedFields: ["客户简称", "订单金额", "交期"],
    //   totalRows: 100,
    //   completionResult: {
    //     status: "success",
    //     successCount: 95,
    //     errorCount: 2,
    //     unchangedCount: 3
    //   },
    //   bitableUrl: "https://bytedance.feishu.cn/base/...",
    //   tableName: "订单管理表",
    //   tableId: "tblxxx"
    // }
  }
});
```

### 飞书卡片通知

操作完成后，会自动发送包含以下信息的卡片到飞书群聊：

- 📊 表格名称和处理行数
- ⏱️ 操作耗时
- 📅 完成时间  
- 📋 详细的结果统计（成功/失败/无变化行数）
- 🎯 成功率百分比
- 🔧 补全的字段列表
- 🔗 直达表格的链接按钮

## 开发指南

### 环境要求
- Node.js 16+
- 飞书多维表格插件环境

### 安装依赖
```bash
npm install
```

### 开发调试
```bash
npm run dev
```

**开发调试时请访问**: `https://localhost:5000/#/login` （注意包含 `#` 符号）

### 构建发布
```bash
npm run build
```

## 配置说明

### 飞书 Webhook 和卡片模板配置

#### 1. Webhook 配置
在 `client/src/lib/sendLarkMessage.ts` 中配置你的飞书机器人 Webhook 地址：

```typescript
const sendUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-id'
```

#### 2. 卡片模板配置
操作日志使用飞书卡片模板功能，需要先在飞书开放平台创建模板：

```typescript
const CARD_TEMPLATE_CONFIG = {
  template_id: 'YOUR_TEMPLATE_ID',        // 替换为实际的模板ID
  template_version_name: 'YOUR_VERSION'   // 替换为实际的版本号
};
```

**详细配置步骤请参考：[飞书卡片模板配置指南](./FEISHU_CARD_TEMPLATE_SETUP.md)**

#### 3. 模板变量说明
卡片模板需要包含以下变量：

| 变量名称 | API名称 | 类型 | 描述 |
|---------|---------|------|------|
| field_list | var_mciwqaaq | text | 补全的字段列表 |
| complete_row_count | var_mciwqaat | integer | 补全行数 |
| start_time | var_mciwqaca | text | 开始时间 |
| end_time | var_mciwqaci | text | 结束时间 |
| complete_result | var_mciwqael | text | 补全结果 |
| doc_link | var_mciwqajb | text | 表格链接 |

**注意：** 在代码中使用变量名称（如 `field_list`），而不是API名称（如 `var_mciwqaaq`）。

### 字段映射配置
字段映射关系存储在多维表格的配置中，支持动态配置和默认配置fallback。

## 注意事项

1. 确保飞书多维表格有编辑权限
2. 操作日志包含敏感信息，请谨慎配置 Webhook 地址
3. 本地日志会占用浏览器存储空间，自动清理超过50条的旧记录
4. 大量数据补全时请耐心等待，不要关闭插件页面
5. **⚠️ 重要**：本项目使用Hash路由，所有页面访问必须包含 `#` 符号
6. **飞书OAuth配置**：重定向URI必须设置为 `https://your-domain.com/#/auth/callback`

## 许可证

MIT License
