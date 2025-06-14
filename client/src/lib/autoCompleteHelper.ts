import { Field, mockGetDataByIds, MockGetDataByIdsResult } from "@/lib/dataSync";
import type { ITable } from "@lark-base-open/js-sdk";
import { bitable, FieldType } from "@lark-base-open/js-sdk";

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
      toast({ type: 'warning', content: '当前数据表中没有记录' });
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
    const fieldsToCreate = selectedFields.filter(f => !existingFieldNames.includes(f.name));

    // 3. 新建缺失字段
    for (const field of fieldsToCreate) {
      // 统一使用文本类型
      await activeTable.addField({ name: field.name, type: FieldType.Text });
    }

    // 4. 新建后重新获取字段列表，建立 name->id 映射
    allFields = await activeTable.getFieldMetaList();
    const fieldNameToId = Object.fromEntries(allFields.map(f => [f.name, f.id]));

    // 收集所有需要查询的值
    const queryValues: string[] = [];
    const recordQueryMap = new Map<string, string>();

    for (const recordId of recordIdList) {
      try {
        const queryValue = await activeTable.getCellValue(queryFieldId, recordId);
        if (queryValue && queryValue.toString().trim()) {
          const trimmedValue = queryValue.toString().trim();
          queryValues.push(trimmedValue);
          recordQueryMap.set(recordId, trimmedValue);
        }
      } catch (error) {
        console.warn(`[AutoComplete] 无法获取记录 ${recordId} 的查询字段值:`, error);
      }
    }

    console.log(`[AutoComplete] 需要查询 ${queryValues.length} 个值`);

    if (queryValues.length === 0) {
      toast({ type: 'warning', content: '没有找到可用于查询的数据' });
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
    const apiResult: MockGetDataByIdsResult = await mockGetDataByIds(queryValues);
    console.log(`[AutoComplete] API返回 ${Object.keys(apiResult.data.result_map).length} 条数据`);

    // 准备批量更新的数据
    const batchUpdates: BatchRecordUpdate[] = [];
    const recordStatuses: RecordStatus[] = [];

    for (const recordId of recordIdList) {
      const queryValue = recordQueryMap.get(recordId);
      if (!queryValue) {
        recordStatuses.push({
          recordId,
          status: 'unchanged'
        });
        continue;
      }

      const apiData = apiResult.data.result_map[queryValue];
      if (!apiData) {
        recordStatuses.push({
          recordId,
          status: 'unchanged'
        });
        continue;
      }

      // 检查哪些字段需要更新
      const fieldsToUpdate: Record<string, any> = {};
      const changedFields: string[] = [];

      for (const field of selectedFields) {
        const fieldId = fieldNameToId[field.name];
        if (!fieldId || fieldId === queryFieldId) continue; // 跳过查询字段本身

        const newValue = apiData[field.name];
        if (newValue !== undefined && newValue !== null && newValue !== '') {
          try {
            // 获取当前值进行比较
            const currentValue = await activeTable.getCellValue(fieldId, recordId);

            // 简单的值比较（可以根据需要优化）
            if (currentValue !== newValue) {
              fieldsToUpdate[fieldId] = newValue;
              changedFields.push(field.name);
            }
          } catch (error) {
            console.warn(`[AutoComplete] 无法获取字段 ${field.name} 的当前值:`, error);
            // 如果无法获取当前值，直接设置新值
            fieldsToUpdate[fieldId] = newValue;
            changedFields.push(field.name);
          }
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

        toast({
          type: 'success',
          content: `成功更新 ${batchUpdates.length} 条记录`
        });
      } catch (error) {
        console.error('[AutoComplete] 批量更新失败:', error);

        // 如果批量更新失败，标记所有记录为错误状态
        for (const status of recordStatuses) {
          if (status.status === 'success') {
            status.status = 'error';
            status.errorMessage = error instanceof Error ? error.message : '批量更新失败';
          }
        }

        toast({
          type: 'error',
          content: `批量更新失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }
    }

    // 统计结果
    const successCount = recordStatuses.filter(s => s.status === 'success').length;
    const errorCount = recordStatuses.filter(s => s.status === 'error').length;
    const unchangedCount = recordStatuses.filter(s => s.status === 'unchanged').length;

    console.log(`[AutoComplete] 完成统计: 成功 ${successCount}, 错误 ${errorCount}, 未变更 ${unchangedCount}`);
    // 标记记录颜色
    await markRecordColors(activeTable, recordStatuses);
    // 确定整体状态
    let overallStatus: 'success' | 'partial' | 'failed' | 'no_permission';
    if (errorCount === 0) {
      overallStatus = successCount > 0 ? 'success' : 'no_permission';
    } else if (successCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'failed';
    }

    onComplete?.({
      status: overallStatus,
      successCount,
      errorCount,
      unchangedCount
    });

  } catch (error) {
    console.error('[AutoComplete] 自动补全过程中发生错误:', error);
    toast({
      type: 'error',
      content: `自动补全失败: ${error instanceof Error ? error.message : '未知错误'}`
    });

    onComplete?.({
      status: 'failed',
      successCount: 0,
      errorCount: 1,
      unchangedCount: 0
    });
  }
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