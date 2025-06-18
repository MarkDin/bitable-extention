import { Field, getDataByIds, MockGetDataByIdsResult } from "@/lib/dataSync";
import type { ITable } from "@lark-base-open/js-sdk";
import { bitable, FieldType } from "@lark-base-open/js-sdk";

interface AutoCompleteParams {
  toast: (args: any) => void;
  selectedFields: Field[];
  queryFieldId: string;
  onProgress?: (completed: number, total: number) => void;
  onComplete?: (result: {
    status: 'success' | 'partial' | 'failed' | 'no_permission' | 'noChange';
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

// 批量更新记录的数据结构
interface BatchRecordUpdate {
  recordId: string;
  fields: Record<string, any>;
}

export async function autoCompleteFields(params: AutoCompleteParams) {
  const { toast, selectedFields, queryFieldId, onProgress, onComplete } = params;

  try {
    console.log('[AutoComplete] 开始自动补全流程');

    // 获取当前活动的数据表
    const activeTable: ITable = await bitable.base.getActiveTable();
    if (!activeTable) {
      throw new Error('无法获取当前数据表');
    }

    // 获取所有记录
    const recordIdList = await activeTable.getRecordIdList();
    console.log(`[AutoComplete] 获取到 ${recordIdList.length} 条记录`);

    if (recordIdList.length === 0) {
      toast({ title: '当前数据表中没有记录', variant: 'warning' });
      onComplete?.({
        status: 'success',
        successCount: 0,
        errorCount: 0,
        unchangedCount: 0
      });
      return;
    }

    // 1. 获取当前表格所有字段
    let allFields = await activeTable.getFieldMetaList();
    let existingFieldNames = allFields.map(f => f.name);

    // 2. 找出需要新建的字段
    const fieldsToCreate = selectedFields.filter(f => !existingFieldNames.includes(f.mapping_field));
    console.log(`[AutoComplete] 需要新建 ${fieldsToCreate.length} 个字段`);
    // 3. 新建缺失字段
    for (const field of fieldsToCreate) {
      try {
        await activeTable.addField({ name: field.mapping_field, type: FieldType.Text });
      } catch (error) {
        console.warn(`[AutoComplete] 新建字段 ${field.mapping_field} 失败:`, error);
        toast({ title: `新建字段 ${field.mapping_field} 失败`, description: '可能无表格编辑权限', variant: 'destructive' });
        onComplete?.({
          status: 'no_permission',
          successCount: 0,
          errorCount: 0,
          unchangedCount: 0
        });
        return;
      }
    }

    // 4. 新建后重新获取字段列表，建立 name->id 映射
    allFields = await activeTable.getFieldMetaList();
    // allFields 中的name是多维表格中的表头，一般是中文，mapping_field是字段名，是英文名
    const fieldNameToId = Object.fromEntries(allFields.map(f => [f.name, f.id]));
    console.log(`[AutoComplete] 建立字段名到ID的映射:`, fieldNameToId);
    // 收集所有需要查询的值
    const queryValues: string[] = [];
    const recordQueryMap = new Map<string, string>();

    for (const recordId of recordIdList) {
      try {
        const queryValue = await activeTable.getCellValue(queryFieldId, recordId);
        if (queryValue && queryValue.length > 0) {
          console.log(`[AutoComplete] 获取到记录 ${recordId} 的查询字段值:`, queryValue);
          const trimmedValue = queryValue[0].text.trim();
          queryValues.push(trimmedValue);
          recordQueryMap.set(recordId, trimmedValue);
        }
      } catch (error) {
        console.warn(`[AutoComplete] 无法获取记录 ${recordId} 的查询字段值:`, error);
      }
    }

    console.log(`[AutoComplete] 需要查询 ${queryValues.length} 个值`);

    if (queryValues.length === 0) {
      toast({ title: '没有找到可用于查询的数据', variant: 'warning' });
      onComplete?.({
        status: 'success',
        successCount: 0,
        errorCount: 0,
        unchangedCount: recordIdList.length
      });
      return;
    }

    // 调用API获取补全数据
    onProgress?.(0, queryValues.length);
    // 去重并打印queryValues
    // const uniqueQueryValues = [...new Set(queryValues)];
    // console.log('去重后的queryValues:', uniqueQueryValues);
    const apiResult: MockGetDataByIdsResult = await getDataByIds(queryValues);
    console.log(`[AutoComplete] API返回 ${Object.keys(apiResult.data.result_map).length} 条数据`, apiResult.error_msg);

    // 准备批量更新的数据
    const batchUpdates: BatchRecordUpdate[] = [];
    const recordStatuses: RecordStatus[] = [];

    // 新增：收集未获取到 newValue 的字段名
    const missingFieldValues: string[] = [];

    for (const recordId of recordIdList) {
      const queryValue = recordQueryMap.get(recordId);
      if (!queryValue) {
        recordStatuses.push({
          recordId,
          status: 'error',
          errorMessage: `查询字段值为空`
        });
        console.log(`[AutoComplete] 跳过记录 ${recordId} 的查询字段值:`, queryValue);
        continue;
      }

      const rowMap = apiResult.data.result_map[queryValue];
      if (!rowMap) {
        recordStatuses.push({
          recordId,
          status: 'error',
          errorMessage: `查询字段值为空`
        });
        continue;
      }

      // 检查哪些字段需要更新
      const fieldsToUpdate: Record<string, any> = {};
      const changedFields: string[] = [];
      // selectedFields 中的name是英文名  mapping_field是字段名，是中文名
      for (const field of selectedFields) {
        const fieldId = fieldNameToId[field.mapping_field];
        if (!fieldId || fieldId === queryFieldId) {
          console.log(`[AutoComplete] 跳过查询字段本身:`, field.mapping_field);
          continue
        }; // 跳过查询字段本身

        const newValue = rowMap[field.name];
        console.log(`[AutoComplete] 获取到 ${field.name} 的值:`, newValue);
        if (newValue === undefined || newValue === null || newValue === '') {
          // 新增：收集未获取到的字段名
          if (!missingFieldValues.includes(field.name)) {
            missingFieldValues.push(field.name);
            recordStatuses.push({
              recordId,
              status: 'error',
              errorMessage: `获取到 ${field.name} 的值为空`
            });
          }
          continue;
        }
        try {
          // 获取当前值进行比较
          const currentValue = await getCurrentValue(activeTable, fieldId, recordId);
          // 简单的值比较（可以根据需要优化）
          if (currentValue.trim() !== newValue.trim()) {
            fieldsToUpdate[fieldId] = newValue;
            console.log(`[AutoComplete] 更新字段 ${field.name} 的值为 ${newValue}, 当前值为 ${currentValue}`);
            changedFields.push(field.name);
          }
        } catch (error) {
          console.warn(`[AutoComplete] 无法获取字段 ${field.name} 的当前值:`, error);
          // 如果无法获取当前值，直接设置新值
          fieldsToUpdate[fieldId] = newValue;
          changedFields.push(field.name);
        }
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        batchUpdates.push({
          recordId,
          fields: fieldsToUpdate
        });
        recordStatuses.push({
          recordId,
          status: 'success',
          changedFields
        });
      } else {
        recordStatuses.push({
          recordId,
          status: 'unchanged'
        });
      }
    }

    console.log(`[AutoComplete] 准备批量更新 ${batchUpdates.length} 条记录`);

    // 执行批量更新
    if (batchUpdates.length > 0) {
      try {
        // 使用 setRecords 方法批量更新多行记录
        await activeTable.setRecords(batchUpdates);
        console.log(`[AutoComplete] 成功批量更新 ${batchUpdates.length} 条记录`);

        // 更新进度
        onProgress?.(batchUpdates.length, queryValues.length);

        toast({ title: `成功更新 ${batchUpdates.length} 条记录`, type: 'success' });
      } catch (error) {
        console.error('[AutoComplete] 批量更新失败:', error);

        // 如果批量更新失败，标记所有记录为错误状态
        for (const status of recordStatuses) {
          if (status.status === 'success') {
            status.status = 'error';
            status.errorMessage = error instanceof Error ? error.message : '批量更新失败';
          }
        }

        toast({ title: '批量更新失败', description: error instanceof Error ? error.message : '未知错误', variant: 'destructive' });
      }
    }


    // 统计去重
    const deduplicatedStatuses = deduplicateStatuses(recordStatuses);
    console.log(`[AutoComplete] 标记记录颜色:`, deduplicatedStatuses);
    // 统计结果
    const successCount = deduplicatedStatuses.filter(s => s.status === 'success').length;
    const errorCount = deduplicatedStatuses.filter(s => s.status === 'error').length;
    const unchangedCount = deduplicatedStatuses.filter(s => s.status === 'unchanged').length;

    console.log(`[AutoComplete] 完成统计: 成功 ${successCount}, 错误 ${errorCount}, 未变更 ${unchangedCount}`);
    // 标记记录颜色
    await markRecordColors(activeTable, deduplicatedStatuses);
    // 确定整体状态
    let overallStatus: 'success' | 'partial' | 'failed' | 'noChange';
    if (errorCount === 0 && successCount > 0) {
      overallStatus = 'success';
    } else if (errorCount > 0 && successCount > 0) {
      overallStatus = 'partial';
    } else if (successCount === 0 && unchangedCount === recordIdList.length) {
      overallStatus = 'noChange';
    } else {
      overallStatus = 'failed';
    }

    onComplete?.({
      status: overallStatus,
      successCount,
      errorCount,
      unchangedCount
    });

    // 在流程最后，若有未获取到的字段，统一展示报错
    if (missingFieldValues.length > 0) {
      toast({ title: '以下字段未获取到补全数据', description: missingFieldValues.join('、'), variant: 'destructive' });
    }

  } catch (error) {
    console.error('[AutoComplete] 自动补全过程中发生错误:', error);
    toast({ title: '自动补全失败', description: error instanceof Error ? error.message : '未知错误', variant: 'destructive' });

    onComplete?.({
      status: 'failed',
      successCount: 0,
      errorCount: 1,
      unchangedCount: 0
    });
  }
}

function deduplicateStatuses(statuses: RecordStatus[]): RecordStatus[] {
  const recordMap = new Map<string, RecordStatus>();
  for (const status of statuses) {
    const existing = recordMap.get(status.recordId);
    if (!existing) {
      recordMap.set(status.recordId, status);
    } else if (existing.status === 'error' && status.status === 'error') {
      // 合并 errorMessage
      existing.errorMessage = (existing.errorMessage || '') + '；' + (status.errorMessage || '');
      recordMap.set(status.recordId, existing);
    } else if (existing.status !== 'error' && status.status === 'error') {
      recordMap.set(status.recordId, status);
    }
  }
  return Array.from(recordMap.values());
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
          type: FieldType.Text
        });
        statusFieldId = newField;
      } catch (error) {
        console.warn('创建状态字段失败:', error);
        return;
      }
    }
    // 批量组装所有要写入的内容
    if (statusFieldId) {
      const updates = statuses.map(status => {
        let statusText = '';
        let statusEmoji = '';
        switch (status.status) {
          case 'success':
            statusEmoji = '🟡';
            statusText = `${statusEmoji} 已更新 (${status.changedFields?.length || 0}个字段)`;
            break;
          case 'unchanged':
            statusEmoji = '⚪';
            statusText = `${statusEmoji} 无变化`;
            break;
          case 'error':
            statusEmoji = '🔴';
            statusText = `${statusEmoji} 失败: ${status.errorMessage || '未知错误'}`;
            break;
        }
        return {
          recordId: status.recordId,
          fields: {
            [statusFieldId]: statusText
          }
        };
      });
      // 批量写入
      await table.setRecords(updates);
    }
  } catch (error) {
    console.warn('批量标记记录状态失败:', error);
  }
}


async function getCurrentValue(table: ITable, fieldId: string, recordId: string): Promise<string> {
  const currentValue = await table.getCellValue(fieldId, recordId);
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
  return currentValueStr;
}
