# 字段配置设置指南

## 概述

本项目实现了从多维表格动态读取字段配置的功能，替代了原先硬编码在代码中的字段配置。

## 功能特性

- ✅ 从多维表格读取字段配置
- ✅ 支持字段配置的动态更新
- ✅ 自动fallback到默认配置
- ✅ 加载状态和错误处理
- ✅ 字段类型验证

## 配置表格信息

**多维表格链接：** https://global-intco.feishu.cn/base/Tzgpbndy9a6aZfsKuKhcaFT8nag?table=tblbxDXCWmq9kaCT

**表格字段结构：**
- `id`: 数字，从1开始的序号
- `name`: 字段的中文显示名称
- `mapping_field`: 字段的英文标识符（用作API字段名）
- `source`: 字段类型（NC、SMOM、TMS、CRM、MRP、赛意）

## 使用方法

### 1. 写入字段配置到多维表格

首次使用或需要更新字段配置时，运行以下命令：

```bash
npm run write-fields-config
```

这个命令会：
1. 获取飞书访问令牌
2. 清空表格中的现有记录（避免重复）
3. 将预定义的字段配置写入到多维表格
4. 显示写入结果和表格链接

### 2. 前端自动读取配置

前端应用启动时会自动：
1. 从多维表格读取字段配置
2. 转换为前端需要的格式
3. 如果读取失败，自动使用默认配置
4. 显示加载状态和错误信息

### 3. 字段配置格式转换

**多维表格中的格式：**
```json
{
  "id": 1,
  "name": "订单ID", 
  "mapping_field": "orderNo",
  "source": "NC"
}
```

**前端使用的格式：**
```typescript
{
  id: "orderNo",
  name: "订单ID",
  mapping_field: "orderNo", 
  type: "NC",
  isChecked: false,
  isDisabled: false
}
```

## 配置文件说明

### 飞书应用配置

在 `scripts/writeFieldsConfig.js` 和 `client/src/lib/fieldsConfigService.ts` 中配置：

```javascript
const FEISHU_APP_ID = 'cli_a8823c9bb8f4900b';
const FEISHU_APP_SECRET = 'v4HA5OV8oGjzewbdAmHWu3cj65vQBoMq';
const APP_TOKEN = 'Tzgpbndy9a6aZfsKuKhcaFT8nag';
const TABLE_ID = 'tblbxDXCWmq9kaCT';
```

### 支持的字段类型

- `NC`: 网络连接相关字段
- `SMOM`: 智能制造运营管理字段
- `TMS`: 运输管理系统字段
- `CRM`: 客户关系管理字段
- `MRP`: 物料需求计划字段
- `赛意`: 赛意系统字段

## 默认字段配置

如果多维表格读取失败，系统会使用以下默认配置：

| 字段类型 | 字段数量 | 示例字段 |
|---------|---------|---------|
| NC | 11个 | 订单ID、客户简称、产品索引号等 |
| SMOM | 2个 | 计划开始时间、计划结束时间 |
| TMS | 5个 | 订舱状态、ETD、ETA等 |
| CRM | 8个 | 客户编码、客户全称、客户国家等 |
| MRP | 1个 | 图稿状态 |

## 故障排除

### 1. 写入失败

**错误：** `获取Token失败`
- **解决：** 检查飞书应用ID和密钥是否正确
- **解决：** 确认网络连接正常

**错误：** `写入失败: 权限不足`
- **解决：** 确认飞书应用有多维表格的写入权限
- **解决：** 检查表格是否存在且可访问

### 2. 读取失败

**现象：** 前端显示"字段配置加载失败，使用默认配置"
- **解决：** 检查多维表格是否有数据
- **解决：** 验证表格字段结构是否正确
- **解决：** 检查网络连接和权限

### 3. 字段类型错误

**现象：** 控制台出现"未知的字段类型"警告
- **解决：** 检查多维表格中的`source`字段值
- **解决：** 确保字段类型在支持的范围内

## 开发说明

### 修改字段配置

1. 在 `scripts/writeFieldsConfig.js` 中修改 `fieldsConfig` 数组
2. 运行 `npm run write-fields-config` 更新多维表格
3. 前端会自动读取新的配置（可能需要刷新页面）

### 添加新字段类型

1. 在 `client/src/types/common.ts` 中添加新的字段类型
2. 在 `client/src/lib/fieldsConfigService.ts` 中更新验证函数
3. 在 `client/src/pages/FieldAutoComplete.tsx` 中添加对应的标签样式

### 缓存策略

- 前端使用 React Query 进行缓存，默认5分钟不重新请求
- 如需强制刷新，可以调用 `refreshFieldsConfig()` 函数

## 相关文件

- `scripts/writeFieldsConfig.js` - 字段配置写入脚本
- `client/src/lib/fieldsConfigService.ts` - 字段配置读取服务
- `client/src/pages/FieldAutoComplete.tsx` - 主要使用页面
- `client/src/types/common.ts` - 字段类型定义

## 注意事项

1. 写入脚本会清空现有记录，请谨慎使用
2. 多维表格的结构不能随意修改，需要保持字段名称一致
3. 字段类型必须在支持的范围内，否则会被替换为默认类型 'NC'
4. 前端有自动降级机制，确保在任何情况下都能正常工作 