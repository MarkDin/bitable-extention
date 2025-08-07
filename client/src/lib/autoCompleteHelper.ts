import { isLoginEnabled } from "@/config";
import { getDataByIds, GetDataByIdsResult } from "@/lib/dataSync";
import { getStoredUserInfo } from "@/lib/feishuAuth";
import { ensureFieldsExist, FieldCreationConfig, formatFieldCreationResults } from "@/lib/fieldManager";
import { Field } from "@/types/common";
import type { ICommonSelectFieldProperty, IOpenCellValue, ISelectFieldOption, ITable } from "@lark-base-open/js-sdk";
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
  user?: {                      // 用户信息
    id: string;          // 用户Open ID
  };
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
    newlyCreatedFields?: Array<{ // 新增：新创建的字段信息
      fieldId: string;
      fieldName: string;
      originalFieldId: string; // 原始字段配置的ID
    }>;
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

  if (isLoginEnabled) {
    // 获取当前用户信息
    const currentUser = getStoredUserInfo();
    if (!currentUser) {
      console.warn('[AutoComplete] 未获取到用户信息');
      toast({
        title: '未登录',
        description: '请先登录飞书账号',
        variant: 'destructive'
      });
      return;
    }
    operationLog.user = { id: currentUser.open_id };
  }

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
        unchangedCount: recordIdList.length,
        fieldCreationErrors: [],
        newlyCreatedFields: []
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

    // 收集本次新建的字段信息
    const newlyCreatedFieldIds = new Set<string>();
    const newlyCreatedFieldsInfo: Array<{ fieldId: string; fieldName: string; originalFieldId: string }> = [];

    if (results && results.length > 0) {
      // 重新获取字段列表，找到新创建的字段
      const updatedFields = await activeTable.getFieldMetaList();
      const fieldNameToId = Object.fromEntries(updatedFields.map(f => [f.name, f.id]));

      for (const result of results) {
        if (result.success) {
          const fieldId = fieldNameToId[result.fieldName];
          if (fieldId) {
            newlyCreatedFieldIds.add(fieldId);

            // 找到对应的原始字段配置
            const originalField = selectedFields.find(f => f.name === result.fieldName);
            if (originalField) {
              newlyCreatedFieldsInfo.push({
                fieldId: fieldId,
                fieldName: result.fieldName,
                originalFieldId: originalField.id
              });
              console.log(`[AutoComplete] 新创建字段映射: ${result.fieldName} -> ${fieldId}`);
            }
          }
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
            fieldCreationErrors,
            newlyCreatedFields: []
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
        // @ts-ignore
        if (queryValue && queryValue.length > 0) {
          console.log(`[AutoComplete] 获取到记录 ${recordId} 的查询字段值:`, queryValue);
          // @ts-ignore
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
        fieldCreationErrors: [],
        newlyCreatedFields: newlyCreatedFieldsInfo
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

    // 分批处理查询和更新
    onProgress?.(0, recordIdList.length);

    // 去重queryValues
    const uniqueQueryValues = Array.from(new Set(queryValues));
    console.log(`[AutoComplete] 去重后需要查询 ${uniqueQueryValues.length} 个唯一值`);

    // 建立queryValue到recordId的映射
    const queryToRecordIds = new Map<string, string[]>();
    for (const recordId of recordIdList) {
      const queryValue = recordQueryMap.get(recordId);
      if (queryValue) {
        if (!queryToRecordIds.has(queryValue)) {
          queryToRecordIds.set(queryValue, []);
        }
        queryToRecordIds.get(queryValue)!.push(recordId);
      }
    }

    // 将查询值分组，每组20个
    const BATCH_SIZE = 20;
    const batches: string[][] = [];
    for (let i = 0; i < uniqueQueryValues.length; i += BATCH_SIZE) {
      batches.push(uniqueQueryValues.slice(i, i + BATCH_SIZE));
    }

    console.log(`[AutoComplete] 分为 ${batches.length} 组进行分批处理，每组最多 ${BATCH_SIZE} 个值`);

    // 全局统计
    const globalRecordStatuses: RecordStatus[] = [];
    const globalBatchUpdates: BatchRecordUpdate[] = [];
    const missingFieldValues: string[] = [];
    const errorMessages: string[] = [];
    let hasAnySuccess = false;
    let processedQueryCount = 0;
    let processedRecordsCount = 0;

    // 分批处理：API请求 + 数据处理 + 记录更新
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[AutoComplete] 正在处理第 ${batchIndex + 1}/${batches.length} 批次，包含 ${batch.length} 个值`);

      try {
        // 1. 调用API获取当前批次数据
        const batchResult: GetDataByIdsResult = await getDataByIds(batch);

        if (!batchResult.success || !batchResult.data || Object.keys(batchResult.data.result_map).length === 0) {
          const errorMsg = `第 ${batchIndex + 1} 批次API调用失败: ${batchResult.error_msg || 'API返回数据为空'}`;
          console.error(`[AutoComplete] ${errorMsg}`);
          errorMessages.push(errorMsg);

          // 计算当前批次的记录数并更新进度
          let currentBatchRecordsCount = 0;
          for (const queryValue of batch) {
            const relatedRecordIds = queryToRecordIds.get(queryValue) || [];
            currentBatchRecordsCount += relatedRecordIds.length;
            // 标记当前批次相关的记录为错误状态
            for (const recordId of relatedRecordIds) {
              globalRecordStatuses.push({
                recordId,
                status: 'error',
                errorMessage: `API调用失败: ${batchResult.error_msg || '未知错误'}`
              });
            }
          }

          processedQueryCount += batch.length;
          processedRecordsCount += currentBatchRecordsCount;
          onProgress?.(processedRecordsCount, recordIdList.length);
          continue;
        }

        hasAnySuccess = true;
        console.log(`[AutoComplete] 第 ${batchIndex + 1} 批次API成功，获得 ${Object.keys(batchResult.data.result_map).length} 条数据`);

        // 2. 处理当前批次的每个查询值对应的记录
        for (const queryValue of batch) {
          const rowMap = batchResult.data.result_map[queryValue];
          const relatedRecordIds = queryToRecordIds.get(queryValue) || [];

          if (!rowMap) {
            // 当前查询值没有对应的数据
            for (const recordId of relatedRecordIds) {
              globalRecordStatuses.push({
                recordId,
                status: 'error',
                errorMessage: `查询值 ${queryValue} 未获取到数据`
              });
            }
            continue;
          }

          console.log(`[AutoComplete] 处理查询值 ${queryValue}，影响 ${relatedRecordIds.length} 条记录`);

          // 3. 为每个相关记录处理字段更新
          for (const recordId of relatedRecordIds) {
            const fieldsToUpdate: Record<string, any> = {};
            const changedFields: string[] = [];
            let hasError = false;
            let errorMessage = '';

            // 处理每个选中的字段
            for (const field of selectedFields) {
              const fieldId = fieldNameToId[field.name];
              if (!fieldId || fieldId === queryFieldId) continue; // 跳过查询字段本身

              let newValue: any = rowMap[field.mapping_field]?.value;
              if (!newValue) {
                console.log(`[AutoComplete] 字段 ${field.name} 的值为空，跳过`);
                continue;
              }

              // 处理时间字段
              if (field.name.includes('计划开始时间') || field.name.includes('计划结束时间')) {
                if (newValue && typeof newValue === 'string') {
                  const timestamp = new Date(newValue).getTime();
                  newValue = timestamp;
                }
              }

              // 处理SingleSelect字段
              const options = fieldInfoMap.get(fieldId);
              if (options && !newlyCreatedFieldIds.has(fieldId)) {
                const option = options.find(opt => opt.name === newValue);
                if (option) {
                  try {
                    const currentValue = await activeTable.getCellValue(fieldId, recordId);
                    const singleSelectValue = currentValue as any;
                    if (!singleSelectValue || singleSelectValue.id !== option.id) {
                      await activeTable.setCellValue(fieldId, recordId, {
                        id: option.id,
                        text: newValue
                      });
                      changedFields.push(field.name);
                      console.log(`[AutoComplete] 更新单选字段 ${field.name} 的值为 ${newValue}`);
                    }
                    continue;
                  } catch (error) {
                    hasError = true;
                    errorMessage = `设置字段 ${field.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`;
                    break;
                  }
                } else {
                  // 创建新选项
                  try {
                    const singleSelectField = await activeTable.getField(fieldId);
                    await (singleSelectField as any).addOption(newValue);

                    const updatedOptions = await (singleSelectField as any).getOptions();
                    const newOption = updatedOptions.find((opt: ISelectFieldOption) => opt.name === newValue);

                    if (newOption) {
                      const currentOptionsInMap = fieldInfoMap.get(fieldId) || [];
                      fieldInfoMap.set(fieldId, [...currentOptionsInMap, { id: newOption.id, name: newOption.name, color: newOption.color }]);

                      await activeTable.setCellValue(fieldId, recordId, {
                        id: newOption.id,
                        text: newValue
                      });
                      changedFields.push(field.name);
                      console.log(`[AutoComplete] 创建并设置新选项 ${newValue} 到字段 ${field.name}`);
                    }
                    continue;
                  } catch (error) {
                    hasError = true;
                    errorMessage = `创建字段 ${field.name} 的选项失败: ${error instanceof Error ? error.message : '未知错误'}`;
                    break;
                  }
                }
              }

              // 处理普通字段
              if (newValue === undefined || newValue === null || newValue === '') {
                if (!missingFieldValues.includes(field.name)) {
                  missingFieldValues.push(field.name);
                }
                continue;
              }

              try {
                const currentValue = await getCurrentValue(activeTable, fieldId, recordId);
                if (currentValue.trim() !== newValue.trim()) {
                  fieldsToUpdate[fieldId] = newValue;
                  changedFields.push(field.name);
                }
              } catch (error) {
                console.warn(`[AutoComplete] 无法获取字段 ${field.name} 的当前值:`, error);
                fieldsToUpdate[fieldId] = newValue;
                changedFields.push(field.name);
              }
            }

            // 记录处理结果
            if (hasError) {
              globalRecordStatuses.push({
                recordId,
                status: 'error',
                errorMessage
              });
            } else if (Object.keys(fieldsToUpdate).length > 0) {
              globalBatchUpdates.push({
                recordId,
                fields: fieldsToUpdate
              });
              globalRecordStatuses.push({
                recordId,
                status: 'success',
                changedFields
              });
            } else {
              globalRecordStatuses.push({
                recordId,
                status: 'unchanged'
              });
            }
          }
        }

        // 4. 批量更新当前批次涉及的记录
        const currentBatchUpdates = globalBatchUpdates.filter(update =>
          batch.some(queryValue => {
            const relatedRecordIds = queryToRecordIds.get(queryValue) || [];
            return relatedRecordIds.includes(update.recordId);
          })
        );

        if (currentBatchUpdates.length > 0) {
          console.log(`[AutoComplete] 第 ${batchIndex + 1} 批次准备更新 ${currentBatchUpdates.length} 条记录`);

          try {
            await activeTable.setRecords(currentBatchUpdates);
            console.log(`[AutoComplete] 第 ${batchIndex + 1} 批次成功更新 ${currentBatchUpdates.length} 条记录`);

            toast({
              title: `第 ${batchIndex + 1}/${batches.length} 批次处理完成`,
              description: `成功更新 ${currentBatchUpdates.length} 条记录`,
              type: 'success'
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '批量更新失败';
            console.error(`[AutoComplete] 第 ${batchIndex + 1} 批次更新失败:`, errorMsg);
            errorMessages.push(`第 ${batchIndex + 1} 批次更新失败: ${errorMsg}`);

            // 标记当前批次的记录为错误状态
            for (const update of currentBatchUpdates) {
              const status = globalRecordStatuses.find(s => s.recordId === update.recordId);
              if (status && status.status === 'success') {
                status.status = 'error';
                status.errorMessage = errorMsg;
              }
            }
          }
        }

        // 计算当前批次处理的记录数
        let currentBatchRecordsCount = 0;
        for (const queryValue of batch) {
          const relatedRecordIds = queryToRecordIds.get(queryValue) || [];
          currentBatchRecordsCount += relatedRecordIds.length;
        }

        processedQueryCount += batch.length;
        processedRecordsCount += currentBatchRecordsCount;

        onProgress?.(processedRecordsCount, recordIdList.length);

      } catch (error) {
        const errorMsg = `第 ${batchIndex + 1} 批次处理异常: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(`[AutoComplete] ${errorMsg}`);
        errorMessages.push(errorMsg);

        // 计算当前批次的记录数并更新进度
        let currentBatchRecordsCount = 0;
        for (const queryValue of batch) {
          const relatedRecordIds = queryToRecordIds.get(queryValue) || [];
          currentBatchRecordsCount += relatedRecordIds.length;
          // 标记当前批次相关的记录为错误状态
          for (const recordId of relatedRecordIds) {
            globalRecordStatuses.push({
              recordId,
              status: 'error',
              errorMessage: errorMsg
            });
          }
        }

        processedQueryCount += batch.length;
        processedRecordsCount += currentBatchRecordsCount;
        onProgress?.(processedRecordsCount, recordIdList.length);
      }
    }

    console.log(`[AutoComplete] 所有批次处理完成，共处理 ${processedQueryCount} 个查询值`);

    // 检查是否有任何成功的结果
    if (!hasAnySuccess) {
      const errorMessage = errorMessages.join('; ') || 'API返回数据为空';
      console.error('[AutoComplete] 所有批次都失败:', errorMessage);

      toast({
        title: 'API调用失败',
        description: errorMessage,
        variant: 'destructive'
      });

      const endTime = new Date().toISOString();
      const result = {
        status: 'failed' as const,
        successCount: 0,
        errorCount: recordIdList.length,
        unchangedCount: 0,
        fieldCreationErrors: fieldCreationErrors.length > 0 ? fieldCreationErrors : [],
        newlyCreatedFields: newlyCreatedFieldsInfo
      };

      const finalLog: OperationLog = {
        ...operationLog,
        endTime,
        completionResult: result
      } as OperationLog;

      onComplete?.(result);
      onOperationLog?.(finalLog);
      return;
    }


    // 统计去重
    const deduplicatedStatuses = deduplicateStatuses(globalRecordStatuses);
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
      fieldCreationErrors: fieldCreationErrors.length > 0 ? fieldCreationErrors : [],
      newlyCreatedFields: newlyCreatedFieldsInfo
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
      fieldCreationErrors: [],
      newlyCreatedFields: []
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
