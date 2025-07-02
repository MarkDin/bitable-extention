import { getDataByIds, MockGetDataByIdsResult } from "@/lib/dataSync";
import { ensureFieldsExist, FieldCreationConfig, formatFieldCreationResults } from "@/lib/fieldManager";
import { Field } from "@/types/common";
import type { ICommonSelectFieldProperty, IOpenCellValue, IOpenSingleSelect, ISelectFieldOption, ISingleSelectField, ITable } from "@lark-base-open/js-sdk";
import { bitable, FieldType as BitableFieldType } from "@lark-base-open/js-sdk";

// 操作日志接口定义 - 导出以便其他文件使用
export interface OperationLog {
  submitTime: string;           // 补全提交时间
  endTime: string;             // 补全结束时间
  selectedFields: string[];    // 补全了哪些字段（勾选的字段名称）
  totalRows: number;           // 补全的行数
  completionResult: {          // 补全结果
    status: 'success' | 'partial' | 'failed' | 'no_permission' | 'noChange';
    successCount: number;
    errorCount: number;
    unchangedCount: number;
    fieldCreationErrors?: string[]; // 字段创建错误信息
  };
  bitableUrl: string;          // 补全的多维表格的链接
  tableName: string;           // 表格名称
  tableId: string;             // 表格ID
}

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
    fieldCreationErrors?: string[]; // 字段创建错误信息
  }) => void;
  onOperationLog?: (log: OperationLog) => void; // 新增：操作日志回调
}

interface RecordStatus {
  recordId: string;
  status: 'success' | 'error' | 'unchanged' | 'warning'; // 状态：成功、错误、未改变、警告
  errorMessage?: string;
  changedFields?: string[];
}

// 批量更新记录的数据结构
interface BatchRecordUpdate {
  recordId: string;
  fields: Record<string, any>;
}

export async function autoCompleteFields(params: AutoCompleteParams) {
  const { toast, selectedFields, queryFieldId, onProgress, onComplete, onOperationLog } = params;

  // 记录开始时间
  const submitTime = new Date().toISOString();
  let operationLog: Partial<OperationLog> = {
    submitTime,
    selectedFields: selectedFields.map(f => f.name), // 记录选中的字段名称
  };

  try {
    console.log('[AutoComplete] 开始自动补全流程');

    // 获取当前活动的数据表
    const activeTable: ITable = await bitable.base.getActiveTable();
    if (!activeTable) {
      throw new Error('无法获取当前数据表');
    }

    // 获取表格基本信息
    const tableMeta = await activeTable.getMeta();
    const selection = await bitable.base.getSelection();

    // 生成多维表格链接
    let bitableUrl = '';
    try {
      if (selection.tableId && selection.viewId) {
        bitableUrl = await bitable.bridge.getBitableUrl({
          tableId: selection.tableId,
          viewId: selection.viewId,
          recordId: selection.recordId,
          fieldId: selection.fieldId
        });
      }
    } catch (error) {
      console.warn('[AutoComplete] 获取多维表格链接失败:', error);
      bitableUrl = '获取链接失败';
    }

    // 更新操作日志
    operationLog = {
      ...operationLog,
      tableName: tableMeta.name,
      tableId: tableMeta.id,
      bitableUrl
    };

    // 获取所有记录
    const recordIdList = await activeTable.getRecordIdList();
    console.log(`[AutoComplete] 获取到 ${recordIdList.length} 条记录`);

    // 更新总行数
    operationLog.totalRows = recordIdList.length;

    if (recordIdList.length === 0) {
      toast({ title: '当前数据表中没有记录', variant: 'warning' });
      const endTime = new Date().toISOString();
      const result = {
        status: 'success' as const,
        successCount: 0,
        errorCount: 0,
        unchangedCount: 0,
        fieldCreationErrors: []
      };

      // 完成操作日志
      const finalLog: OperationLog = {
        ...operationLog,
        endTime,
        completionResult: result
      } as OperationLog;

      onComplete?.(result);
      onOperationLog?.(finalLog);
      return;
    }

    // 1. 检查并创建缺失的字段（带重试机制）
    const fieldCreationConfig: FieldCreationConfig = {
      maxRetries: 1, // 失败后重试一次
      retryDelay: 1000, // 重试延迟1秒
      onProgress: (fieldName: string, attempt: number) => {
        console.log(`[AutoComplete] 正在创建字段 ${fieldName}，第 ${attempt} 次尝试`);
      }
    };

    const { results, hasPermission, fieldsToCreate } = await ensureFieldsExist(
      activeTable,
      selectedFields,
      fieldCreationConfig
    );

    // 收集本次新建的字段ID
    const newlyCreatedFieldIds = new Set<string>();
    if (results) {
      for (const result of results) {
        if (result.success && result.fieldId) {
          newlyCreatedFieldIds.add(result.fieldId);
        }
      }
    }

    // 2. 处理字段创建结果
    let fieldCreationErrors: string[] = [];
    if (results.length > 0) {
      const { successMessage, errorMessage, hasErrors } = formatFieldCreationResults(results);

      // 收集字段创建错误信息
      fieldCreationErrors = results
        .filter(r => !r.success)
        .map(r => `${r.fieldName}: ${r.error || '未知错误'}`);

      if (successMessage) {
        console.log(`[AutoComplete] ${successMessage}`);
        toast({ title: '字段创建成功', description: successMessage, variant: 'default' });
      }

      if (hasErrors) {
        console.warn(`[AutoComplete] ${errorMessage}`);
        toast({ title: '字段创建失败', description: errorMessage, variant: 'destructive' });

        // 如果没有权限或所有字段都创建失败，直接返回
        if (!hasPermission) {
          const endTime = new Date().toISOString();
          const result = {
            status: 'no_permission' as const,
            successCount: 0,
            errorCount: 0,
            unchangedCount: 0,
            fieldCreationErrors
          };

          // 完成操作日志
          const finalLog: OperationLog = {
            ...operationLog,
            endTime,
            completionResult: result
          } as OperationLog;

          onComplete?.(result);
          onOperationLog?.(finalLog);
          return;
        }
      }
    }

    // 3. 重新获取字段列表，建立 name->id 映射及字段信息映射
    const allFields = await activeTable.getFieldMetaList();
    // allFields 中的name是多维表格中的表头，一般是中文，mapping_field是字段名，是英文名
    const fieldNameToId = Object.fromEntries(allFields.map(f => [f.name, f.id]));
    // 构建字段信息映射，包含类型和选项
    const fieldInfoMap = new Map<string, ISelectFieldOption[]>();
    for (const field of allFields) {
      if (field.type === BitableFieldType.SingleSelect) {
        let p = field.property as ICommonSelectFieldProperty;
        const options = p.options || [];


        fieldInfoMap.set(field.id, options);
      }

    }

    console.log(`[AutoComplete] 字段信息映射:`, fieldInfoMap);
    // 收集所有需要查询的值
    const queryValues: string[] = [];
    const recordQueryMap = new Map<string, string>();

    for (const recordId of recordIdList) {
      try {
        const queryValue: IOpenCellValue = await activeTable.getCellValue(queryFieldId, recordId);
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
      const endTime = new Date().toISOString();
      const result = {
        status: 'success' as const,
        successCount: 0,
        errorCount: 0,
        unchangedCount: recordIdList.length,
        fieldCreationErrors: []
      };

      // 完成操作日志
      const finalLog: OperationLog = {
        ...operationLog,
        endTime,
        completionResult: result
      } as OperationLog;

      onComplete?.(result);
      onOperationLog?.(finalLog);
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
      console.log(`[AutoComplete] 获取到 ${queryValue} 的值:`, rowMap);
      // 检查哪些字段需要更新
      const fieldsToUpdate: Record<string, any> = {};
      const changedFields: string[] = [];
      // selectedFields 中的name是英文名  mapping_field是字段名，是中文名
      for (const field of selectedFields) {
        const fieldId = fieldNameToId[field.name];
        if (!fieldId || fieldId === queryFieldId) {
          console.log(`[AutoComplete] 跳过查询字段本身:`, field.mapping_field);
          continue
        }; // 跳过查询字段本身

        let newValue: any = rowMap[field.mapping_field].value;
        if (field.name.includes('计划开始时间') || field.name.includes('计划结束时间')) {
          // 将时间字符串转换为时间戳
          if (newValue && typeof newValue === 'string') {
            const timestamp = new Date(newValue).getTime();
            newValue = timestamp;
          }
        }

        // 处理SingleSelect字段：将文本值转换为选项ID
        const options = fieldInfoMap.get(fieldId);
        if (options && !newlyCreatedFieldIds.has(fieldId)) {
          const option = options.find(opt => opt.name === newValue);
          if (option) {
            console.log(`[AutoComplete] 找到选项 ${newValue}，ID: ${option.id}`);
            try {
              // 获取当前值进行比较
              const currentValue = await activeTable.getCellValue(fieldId, recordId);
              const singleSelectValue = currentValue as IOpenSingleSelect;
              // 检查值是否已存在且相同
              if (!singleSelectValue || singleSelectValue.id !== option.id) {
                // 使用setCellValue单独设置单元格值
                await activeTable.setCellValue(fieldId, recordId, {
                  id: option.id,
                  text: newValue
                });
                changedFields.push(field.name);
                console.log(`[AutoComplete] 更新字段 ${field.name} 的值为 ${newValue}`);
                continue; // 跳过后续批量更新逻辑
              } else {
                console.log(`[AutoComplete] 字段 ${field.name} 的值已为 ${newValue}，无需更新`);
                continue; // 跳过后续批量更新逻辑
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : '设置单元格值失败';
              console.error(`[AutoComplete] 设置字段 ${field.name} 的值失败: ${errorMsg}`);
              recordStatuses.push({
                recordId,
                status: 'error',
                errorMessage: `设置字段 ${field.name} 的值失败: ${errorMsg}`
              });
              continue;
            }
          } else {
            // 选项不存在，尝试创建新选项
            console.log(`[AutoComplete] 字段 ${field.name} 的选项 ${newValue} 不存在，尝试创建`);
            try {
              // 获取单选字段对象
              const singleSelectField = await activeTable.getField<ISingleSelectField>(fieldId);

              // 使用addOption方法添加新选项
              await singleSelectField.addOption(newValue);
              console.log(`[AutoComplete] 成功创建选项 ${newValue} 到字段 ${field.name}`);

              // 重新获取字段选项以获取新创建选项的ID
              const updatedOptions = await singleSelectField.getOptions();
              const newOption = updatedOptions.find((opt: ISelectFieldOption) => opt.name === newValue);

              if (!newOption) {
                throw new Error('无法获取新创建选项的信息');
              }

              // 更新fieldInfoMap中的选项缓存
              const currentOptionsInMap = fieldInfoMap.get(fieldId) || [];
              const updatedOptionsForMap = [
                ...currentOptionsInMap,
                { id: newOption.id, name: newOption.name, color: newOption.color }
              ];
              fieldInfoMap.set(fieldId, updatedOptionsForMap);

              // 设置单元格值
              await activeTable.setCellValue(fieldId, recordId, {
                id: newOption.id,
                text: newValue
              });

              changedFields.push(field.name);
              console.log(`[AutoComplete] 创建并设置新选项 ${newValue} 到字段 ${field.name}`);
              continue; // 跳过后续批量更新逻辑

            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : '创建选项失败';
              console.error(`[AutoComplete] 创建选项失败: ${errorMsg}`);
              recordStatuses.push({
                recordId,
                status: 'error',
                errorMessage: `创建字段 ${field.name} 的选项 ${newValue} 失败: ${errorMsg}`
              });
              continue;
            }
          }
        }

        // console.log(`[AutoComplete] 获取到 ${field.name} 的值:`, newValue);
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
      const batchSize = 50;
      const totalBatches = Math.ceil(batchUpdates.length / batchSize);
      let completedBatches = 0;
      let totalUpdated = 0;
      const batchErrors: string[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min((i + 1) * batchSize, batchUpdates.length);
        const currentBatch = batchUpdates.slice(startIndex, endIndex);

        try {
          // 使用 setRecords 方法批量更新当前批次记录
          await activeTable.setRecords(currentBatch);
          completedBatches++;
          totalUpdated += currentBatch.length;
          console.log(`[AutoComplete] 成功批量更新第 ${i + 1}/${totalBatches} 批次，共 ${currentBatch.length} 条记录`);

          // 更新进度
          onProgress?.(totalUpdated, queryValues.length);

          toast({ title: `成功更新第 ${i + 1}/${totalBatches} 批次`, description: `已更新 ${totalUpdated}/${batchUpdates.length} 条记录`, type: 'success' });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '批量更新失败';
          console.error(`[AutoComplete] 第 ${i + 1}/${totalBatches} 批次更新失败:`, errorMsg);
          batchErrors.push(`第 ${i + 1} 批次: ${errorMsg}`);

          // 标记当前批次中的记录为错误状态
          for (const update of currentBatch) {
            const status = recordStatuses.find(s => s.recordId === update.recordId);
            if (status && status.status === 'success') {
              status.status = 'error';
              status.errorMessage = errorMsg;
            }
          }
        }
      }

      if (batchErrors.length > 0) {
        toast({ title: `部分批次更新失败`, description: `共 ${batchErrors.length}/${totalBatches} 批次失败`, variant: 'destructive' });
      } else if (completedBatches > 0) {
        toast({ title: `全部批次更新完成`, description: `成功更新 ${totalUpdated} 条记录`, type: 'success' });
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

    const result = {
      status: overallStatus,
      successCount,
      errorCount,
      unchangedCount,
      fieldCreationErrors: fieldCreationErrors.length > 0 ? fieldCreationErrors : []
    };

    // 记录结束时间并完成操作日志
    const endTime = new Date().toISOString();
    const finalLog: OperationLog = {
      ...operationLog,
      endTime,
      completionResult: result
    } as OperationLog;

    console.log('[AutoComplete] 操作日志:', finalLog);

    onComplete?.(result);
    onOperationLog?.(finalLog);

    // 在流程最后，若有未获取到的字段，统一展示报错
    if (missingFieldValues.length > 0) {
      toast({ title: '以下字段未获取到补全数据', description: missingFieldValues.join('、'), variant: 'destructive' });
    }

  } catch (error) {
    console.error('[AutoComplete] 自动补全过程中发生错误:', error);
    toast({ title: '自动补全失败', description: error instanceof Error ? error.message : '未知错误', variant: 'destructive' });

    const endTime = new Date().toISOString();
    const result = {
      status: 'failed' as const,
      successCount: 0,
      errorCount: 1,
      unchangedCount: 0,
      fieldCreationErrors: []
    };

    // 完成操作日志
    const finalLog: OperationLog = {
      ...operationLog,
      endTime,
      completionResult: result
    } as OperationLog;

    onComplete?.(result);
    onOperationLog?.(finalLog);
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
          type: BitableFieldType.Text
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
