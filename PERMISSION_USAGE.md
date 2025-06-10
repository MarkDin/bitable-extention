# 多维表格高级权限功能使用说明

## 概述

本项目实现了基于飞书开放平台的多维表格高级权限管理功能，可以帮助开发者：

1. 检查用户对多维表格中哪些行有编辑权限
2. 获取用户可访问的字段和记录
3. 安全地执行数据操作，自动处理权限错误
4. 监控和调试权限相关问题

## 核心功能

### 1. 权限服务 (PermissionService)

位置：`client/src/lib/permissionService.ts`

主要功能：
- 检查多维表格是否开启高级权限
- 获取用户权限信息
- 检查记录和字段的访问权限
- 安全执行数据操作

```typescript
import { getPermissionService } from '@/lib/permissionService';

// 获取权限服务实例
const permissionService = await getPermissionService(tableId);

// 检查记录权限
const recordPermission = await permissionService.checkRecordPermission(recordId);
console.log('可编辑:', recordPermission.canEdit);

// 获取可访问的记录
const accessibleRecords = await permissionService.getAccessibleRecords();
```

### 2. 权限Hook (usePermission)

位置：`client/src/hooks/usePermission.ts`

React Hook，提供便捷的权限管理功能：

```typescript
import { usePermission } from '@/hooks/usePermission';

function MyComponent() {
  const {
    isAdvanced,           // 是否开启高级权限
    hasEditPermission,    // 是否有编辑权限
    hasReadPermission,    // 是否有读取权限
    checkRecordPermission,// 检查记录权限
    safeUpdateRecord,     // 安全更新记录
    getAccessibleRecords, // 获取可访问记录
  } = usePermission();

  // 使用权限功能...
}
```

### 3. 权限管理页面

位置：`client/src/pages/PermissionManager.tsx`

访问路径：`/permission-manager`

提供可视化的权限管理界面：
- 权限概览仪表板
- 可访问记录和字段列表
- 权限测试工具
- 实时权限检查

## 使用方法

### 1. 基本权限检查

```typescript
import { usePermission } from '@/hooks/usePermission';

function DataEditor() {
  const { checkRecordPermission, safeUpdateRecord } = usePermission();

  const handleEdit = async (recordId: string, data: any) => {
    // 检查权限
    const permission = await checkRecordPermission(recordId);
    
    if (permission?.canEdit) {
      // 安全更新记录
      const result = await safeUpdateRecord(recordId, data);
      if (result?.hasPermission) {
        console.log('更新成功');
      }
    } else {
      console.log('无编辑权限');
    }
  };
}
```

### 2. 便捷的权限Hook

```typescript
import { useRecordPermission, useFieldPermission } from '@/hooks/usePermission';

function RecordItem({ recordId, fieldId }) {
  // 自动检查记录权限
  const { canEdit, canRead, canDelete } = useRecordPermission(recordId);
  
  // 自动检查字段权限
  const fieldPermission = useFieldPermission(fieldId);

  return (
    <div>
      {canRead && <span>可读</span>}
      {canEdit && <button>编辑</button>}
      {canDelete && <button>删除</button>}
    </div>
  );
}
```

### 3. 安全执行操作

```typescript
import { PermissionUtils } from '@/lib/permissionService';

// 安全执行可能有权限限制的操作
const result = await PermissionUtils.safeExecute(async () => {
  return await someDataOperation();
});

if (result.success) {
  console.log('操作成功:', result.data);
} else {
  console.log('操作失败:', result.error);
}
```

## 权限错误处理

系统会自动处理以下权限相关错误：

- `1254302`: 无权限访问数据
- `1254045`: 字段不存在或无权限访问

```typescript
// 自动错误处理
const { safeExecute } = usePermission();

const result = await safeExecute(
  () => updateRecord(recordId, data),
  null, // 失败时的默认值
  '更新记录失败' // 错误提示标题
);
```

## 权限类型说明

### 记录权限
- `canRead`: 可以读取记录
- `canEdit`: 可以编辑记录
- `canDelete`: 可以删除记录

### 字段权限
- `canRead`: 可以读取字段值
- `canEdit`: 可以编辑字段值

### 用户权限级别
- `hasManagePermission`: 管理员权限
- `hasEditPermission`: 编辑权限
- `hasReadPermission`: 读取权限

## 调试和监控

### 1. 权限管理页面

访问 `/permission-manager` 查看：
- 权限概览
- 可访问数据统计
- 权限测试工具
- 实时权限检查

### 2. 控制台日志

权限服务会输出详细的调试信息：

```javascript
// 在浏览器控制台查看
console.log('权限服务初始化完成');
console.log('用户权限信息:', userPermission);
console.log('可访问记录数量:', accessibleRecordsCount);
```

### 3. 权限测试

在权限管理页面的"权限测试"标签页中：
1. 点击"测试当前选择"
2. 选择表格中的单元格
3. 查看实时权限检查结果

## 最佳实践

### 1. 权限检查时机
- 在执行数据操作前检查权限
- 在渲染UI元素前检查权限
- 定期刷新权限信息

### 2. 错误处理
- 使用 `safeExecute` 包装可能失败的操作
- 为用户提供友好的错误提示
- 记录权限相关错误用于调试

### 3. 性能优化
- 使用权限服务缓存避免重复初始化
- 批量检查多个记录的权限
- 合理使用 `useRecordPermission` 和 `useFieldPermission`

## 注意事项

1. **权限服务初始化**: 确保在使用权限功能前服务已初始化完成
2. **错误码处理**: 注意处理 `1254302` 和 `1254045` 等权限相关错误
3. **插件权限配置**: 确保在飞书开发者后台配置了正确的权限
4. **高级权限模式**: 只有开启高级权限的多维表格才支持精细化权限控制

## 扩展开发

如需扩展权限功能，可以：

1. 在 `PermissionService` 中添加新的权限检查方法
2. 创建新的权限相关Hook
3. 扩展权限管理页面的功能
4. 添加更多权限类型和条件

## 相关文档

- [飞书开放平台 - 多维表格高级权限](https://open.feishu.cn/document/server-docs/docs/bitable-v1/advanced-guide/advanced-permission)
- [飞书多维表格插件开发指南](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/bitable/guide/bitable-plugin-guide) 