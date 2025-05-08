# 飞书多维表格插件

这是一个飞书多维表格侧边栏插件，帮助用户通过可配置的API集成自动补全和更新行数据。

## 功能特点

- **字段自动补全**: 检测当前选中的单元格并通过API获取相关数据
- **数据同步**: 通过配置的主键更新行数据
- **字段映射选择**: 选择哪些获取的数据映射到哪些列
- **数据差异高亮**: 在更新数据时提供视觉指示

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

#### 在Unix系统上 (Linux/macOS)

可以使用以下命令启动项目：

```bash
npm run dev
# 或
yarn dev
```

#### 在Windows系统上

有几种方式在Windows上启动项目：

**方法1**: 使用批处理文件

```
.\scripts\start-windows.bat
```

**方法2**: 使用跨平台JS脚本

```
node scripts/start-cross-platform.js
```

**方法3**: 使用cross-env (已安装)

```
npx cross-env NODE_ENV=development tsx server/index.ts
```

## 开发者注意事项

- 该插件使用了Feishu Base JS-SDK与飞书多维表格进行交互
- 插件遵循飞书的设计规范，使用颜色：飞书蓝 #2E6BE0，强调蓝 #165DFF
- 用户ID是通过 `bitable.bridge.getBaseUserId()` 获取的，该ID在多维表格内唯一，但与飞书开放平台的OpenUserId不通用

## 文件结构

- `/client`: 前端代码
  - `/src/components`: UI组件
  - `/src/pages`: 页面组件
  - `/src/lib`: 工具库
  - `/src/hooks`: React钩子
- `/server`: 后端代码
- `/shared`: 前后端共享代码
- `/scripts`: 启动脚本