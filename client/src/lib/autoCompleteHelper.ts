import { useFeishuBaseStore } from "@/hooks/useFeishuBaseStore";
import { apiService } from "@/lib/apiService";
import { Field, mockGetDataByIds, MockGetDataByIdsResult } from "@/lib/dataSync";
import type { ITable } from "@lark-base-open/js-sdk";
import { bitable } from "@lark-base-open/js-sdk";

interface AutoCompleteParams {
  toast: (args: any) => void;
  selectedFields: Field[];
  queryFieldId: string;
  onProgress?: (completed: number, total: number) => void;
  onComplete?: (result: {
    status: 'success' | 'partial' | 'failed' | 'no_permission';
    successCount: number;
    errorCount: number;
    unchangedCount: number;
  }) => void;
}

interface RecordStatus {
  recordId: string;
  status: 'success' | 'error' | 'unchanged';
  errorMessage?: string;
  changedFields?: string[];
}

export async function autoCompleteFields({
  toast,
  selectedFields,
  queryFieldId,
  onProgress,
  onComplete
}: AutoCompleteParams) {
  // 1. 读取配置字段

  if (!selectedFields.length) {
    toast?.({ title: "未配置补全字段", variant: "destructive" });
    return;
  }

  if (!queryFieldId) {
    toast?.({ title: "未选择查询字段", variant: "destructive" });
    return;
  }

  // 获取当前选中的所有记录
  const activeTable: ITable = await bitable.base.getActiveTable();
  const selection = useFeishuBaseStore.getState().selection;
  if (!selection) {
    toast?.({ title: "未选中表格", variant: "destructive" });
    return;
  }

  // 检查编辑权限
  try {
    // 尝试获取表格信息来检查权限
    await activeTable.getName();
  } catch (error) {
    console.error('[AutoComplete] 权限检查失败:', error);
    onComplete?.({
      status: 'no_permission',
      successCount: 0,
      errorCount: 0,
      unchangedCount: 0
    });
    return;
  }

  // 获取所有记录
  const view = await activeTable.getActiveView();
  const recordIdListRaw = await view.getVisibleRecordIdList();
  // 过滤掉undefined值
  const recordIdList = recordIdListRaw.filter((id): id is string => id !== undefined);
  console.log('[AutoComplete] recordIdList:', recordIdList);

  const totalRecords = recordIdList.length;

  if (!recordIdList || recordIdList.length === 0) {
    toast?.({ title: "表格中没有记录", variant: "destructive" });
    return;
  }

  // 初始化进度
  onProgress?.(0, totalRecords);

  // 获取查询字段信息 - 使用传入的 queryFieldId 而不是 selection.fieldId
  const selectedCellValue = await apiService.getCellValues(activeTable, recordIdList, queryFieldId);
  console.log('[AutoComplete] selectedCellValue:', selectedCellValue);
  if (!selectedCellValue) {
    toast?.({ title: "未获取到查询值", variant: "destructive" });
    return;
  }

  // 建立selectedCellValue的映射
  const selectedCellValueMap: Record<string, string> = {};
  for (let i = 0; i < recordIdList.length; i++) {
    selectedCellValueMap[recordIdList[i]] = selectedCellValue[i];
  }

  // 2. 获取数据
  let result: MockGetDataByIdsResult;
  try {
    result = await mockGetDataByIds(selectedCellValue);
  } catch (e: any) {
    toast?.({ title: "获取数据失败", description: e.message, variant: "destructive" });
    onComplete?.({
      status: 'failed',
      successCount: 0,
      errorCount: totalRecords,
      unchangedCount: 0
    });
    return;
  }
  if (!result.success) {
    toast?.({ title: "获取数据失败", description: result.error_msg, variant: "destructive" });
    onComplete?.({
      status: 'failed',
      successCount: 0,
      errorCount: totalRecords,
      unchangedCount: 0
    });
    return;
  }
  const resultFields = result.data.result_map;
  console.log('resultFields', resultFields);

  // 3. 检查表头
  const tableFields = await apiService.getAllFields();
  const allFieldNames = await Promise.all(tableFields.map((f: any) => f.getName()));
  const missingFields = selectedFields.filter((f: Field) => !allFieldNames.includes(f.mapping_field));

  // 4. 新建缺失表头
  for (const field of missingFields) {
    try {
      await apiService.createField({
        activeTable,
        name: field.mapping_field,
        type: 1 // FieldType.Text
      });
    } catch (error) {
      console.error('[AutoComplete] 创建字段失败:', error);
      // 如果创建字段失败，可能是权限问题
      onComplete?.({
        status: 'no_permission',
        successCount: 0,
        errorCount: 0,
        unchangedCount: 0
      });
      return;
    }
  }
  console.log('missingFields', missingFields);

  // 5. 再次获取表头
  const updatedFields = await apiService.getAllFields();
  const fieldNameToId: Record<string, string> = {};
  for (const f of updatedFields) {
    const name = await f.getName();
    fieldNameToId[name] = f.id;
  }

  // 6. 为每条记录写入数据，并追踪状态
  const recordStatuses: RecordStatus[] = [];
  let completedCount = 0;

  for (const recordId of recordIdList) {
    const recordStatus: RecordStatus = {
      recordId,
      status: 'unchanged',
      changedFields: []
    };

    try {
      const queryValue = selectedCellValueMap[recordId];

      // 检查是否有查询结果
      if (!resultFields[queryValue]) {
        recordStatus.status = 'error';
        recordStatus.errorMessage = '查询无结果';
        recordStatuses.push(recordStatus);
        completedCount++;
        onProgress?.(completedCount, totalRecords);
        continue;
      }

      // 对比并更新每个字段
      for (const field of selectedFields) {
        const fieldName = field.mapping_field;
        const fieldId = fieldNameToId[fieldName];

        if (!fieldId) continue;

        const newValue = resultFields[queryValue][field.name];
        if (newValue === undefined) continue;

        // 获取当前值
        const currentValue = await activeTable.getCellValue(fieldId, recordId);
        let currentValueStr = '';


        // 处理不同类型的单元格值
        if (currentValue === null || currentValue === undefined) {
          currentValueStr = '';
        } else if (Array.isArray(currentValue)) {
          // 处理数组类型（如文本、选项等）
          if (currentValue.length > 0 && typeof currentValue[0] === 'object' && 'text' in currentValue[0]) {
            currentValueStr = currentValue[0].text;
          } else {
            currentValueStr = currentValue.join(', ');
          }
        } else if (typeof currentValue === 'object') {
          // 处理对象类型
          if ('text' in currentValue) {
            currentValueStr = (currentValue as any).text;
          } else {
            currentValueStr = String(currentValue);
          }
        } else {
          // 处理基本类型
          currentValueStr = String(currentValue);
        }

        // 标准化新值为字符串
        const newValueStr = String(newValue);

        // 对比值是否变化 - 使用 trim() 去除首尾空格，避免空格导致的误判
        if (currentValueStr.trim() !== newValueStr.trim()) {
          console.log(`[AutoComplete] 字段 ${fieldName} - 值发生变化，开始更新`);
          try {
            await activeTable.setCellValue(fieldId, recordId, newValue);
            recordStatus.changedFields?.push(fieldName);
            recordStatus.status = 'success';
          } catch (error) {
            console.error(`[AutoComplete] 更新字段失败:`, error);
            recordStatus.status = 'error';
            recordStatus.errorMessage = '更新失败，可能无编辑权限';
          }
        } else {
          console.log(`[AutoComplete] 字段 ${fieldName} - 值未变化，跳过更新`);
        }
      }
    } catch (error: any) {
      recordStatus.status = 'error';
      recordStatus.errorMessage = error.message || '写入失败';
      console.error(`Failed to update record ${recordId}:`, error);
    }

    recordStatuses.push(recordStatus);
    completedCount++;
    onProgress?.(completedCount, totalRecords);

    // 添加小延迟，让用户能看到进度变化
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // 统计结果
  const successCount = recordStatuses.filter(r => r.status === 'success').length;
  const errorCount = recordStatuses.filter(r => r.status === 'error').length;
  const unchangedCount = recordStatuses.filter(r => r.status === 'unchanged').length;

  // 标记记录颜色
  await markRecordColors(activeTable, recordStatuses);

  // 确定最终状态
  let finalStatus: 'success' | 'partial' | 'failed' | 'no_permission';
  if (errorCount === 0) {
    finalStatus = 'success';
  } else if (successCount > 0) {
    finalStatus = 'partial';
  } else {
    finalStatus = 'failed';
  }

  // 调用完成回调
  onComplete?.({
    status: finalStatus,
    successCount,
    errorCount,
    unchangedCount
  });

  // 显示结果
  let description = `成功更新: ${successCount}条`;
  if (unchangedCount > 0) description += `, 无变化: ${unchangedCount}条`;
  if (errorCount > 0) description += `, 失败: ${errorCount}条`;

  toast?.({
    title: "补全完成",
    description,
    variant: errorCount > 0 ? "destructive" : "default"
  });
}

// 标记记录颜色的辅助函数
async function markRecordColors(table: ITable, statuses: RecordStatus[]) {
  try {
    // 获取所有字段
    const fields = await table.getFieldList();

    // 查找或创建状态字段
    let statusFieldId: string | null = null;
    const statusFieldName = '补全状态';

    for (const field of fields) {
      const fieldName = await field.getName();
      if (fieldName === statusFieldName) {
        statusFieldId = field.id;
        break;
      }
    }

    // 如果没有状态字段，创建一个
    if (!statusFieldId) {
      try {
        const newField = await table.addField({
          name: statusFieldName,
          type: 1 // FieldType.Text
        });
        statusFieldId = newField;
      } catch (error) {
        console.warn('创建状态字段失败:', error);
      }
    }

    // 为每条记录设置状态文本
    if (statusFieldId) {
      for (const status of statuses) {
        let statusText = '';
        let statusEmoji = '';

        switch (status.status) {
          case 'success':
            statusEmoji = '🟡';  // 黄色圆圈表示有变化
            statusText = `${statusEmoji} 已更新 (${status.changedFields?.length || 0}个字段)`;
            break;
          case 'unchanged':
            statusEmoji = '⚪';  // 白色圆圈表示无变化
            statusText = `${statusEmoji} 无变化`;
            break;
          case 'error':
            statusEmoji = '🔴';  // 红色圆圈表示错误
            statusText = `${statusEmoji} 失败: ${status.errorMessage || '未知错误'}`;
            break;
        }

        try {
          await table.setCellValue(statusFieldId, status.recordId, statusText);
        } catch (error) {
          console.warn(`设置状态失败 (recordId: ${status.recordId}):`, error);
        }
      }
    }

    console.log('记录状态标记完成');
  } catch (error) {
    console.error('标记记录状态失败:', error);
  }
} 