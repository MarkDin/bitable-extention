import { getFieldTypeMapping } from "@/lib/dataSync";
import { Field } from "@/types/common";
import type { IDateTimeField, ITable } from "@lark-base-open/js-sdk";
import { FieldType as BitableFieldType, DateFormatter } from "@lark-base-open/js-sdk";

// 字段创建结果接口
export interface FieldCreationResult {
    success: boolean;
    fieldName: string;
    error?: string;
    retryAttempts: number;
}

// 字段创建配置
export interface FieldCreationConfig {
    maxRetries?: number;      // 最大重试次数，默认为1
    retryDelay?: number;      // 重试延迟时间（毫秒），默认为1000ms
    onProgress?: (fieldName: string, attempt: number) => void; // 进度回调
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建单个字段（带重试机制）
 * @param activeTable 当前活动表格
 * @param field 要创建的字段
 * @param config 创建配置
 * @returns 创建结果
 */
export async function createSingleField(
    activeTable: ITable,
    field: Field,
    config: FieldCreationConfig = {}
): Promise<FieldCreationResult> {
    const {
        maxRetries = 1,
        retryDelay = 1000,
        onProgress
    } = config;

    let lastError: string = '';
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            attempt++;
            onProgress?.(field.name, attempt);

            console.log(`[FieldManager] 尝试创建字段 ${field.name}，第 ${attempt} 次尝试`);

            // 获取字段类型
            const fieldType = getFieldTypeMapping(field.name);

            // 创建字段
            const newFieldMeta = await activeTable.addField({
                name: field.name,
                type: fieldType as any
            });

            // 如果是日期时间字段，设置格式
            if (fieldType === BitableFieldType.DateTime) {
                console.log(`[FieldManager] 设置日期时间字段格式:`, newFieldMeta);
                try {
                    const newField = await activeTable.getField<IDateTimeField>(newFieldMeta);
                    await newField.setDateFormat(DateFormatter.DATE_TIME);
                } catch (formatError) {
                    console.warn(`[FieldManager] 设置日期格式失败，但字段创建成功:`, formatError);
                }
            }

            console.log(`[FieldManager] 成功创建字段 ${field.name}`);
            return {
                success: true,
                fieldName: field.name,
                retryAttempts: attempt
            };

        } catch (error) {
            lastError = error instanceof Error ? error.message : '未知错误';
            console.warn(`[FieldManager] 创建字段 ${field.name} 失败，第 ${attempt} 次尝试:`, error);
            if (error instanceof Error && error.message.includes('permission')) {
                console.error(`[FieldManager] 权限不足，无法创建字段 ${field.name}`);
                return {
                    success: false,
                    fieldName: field.name,
                    error: '权限不足',
                    retryAttempts: attempt
                };
            }
            // 检查是否是重复字段错误 这种可能是误报
            if (error instanceof Error && error.message.includes('repeated error')) {
                return {
                    success: true,
                    fieldName: field.name,
                    retryAttempts: attempt
                };
            }


            // 如果还有重试机会，等待后继续
            if (attempt <= maxRetries) {
                console.log(`[FieldManager] ${retryDelay}ms 后重试创建字段 ${field.name}`);
                await delay(retryDelay);
            }
        }
    }

    // 所有重试都失败
    console.error(`[FieldManager] 创建字段 ${field.name} 最终失败，已重试 ${maxRetries} 次`);
    return {
        success: false,
        fieldName: field.name,
        error: lastError,
        retryAttempts: attempt - 1
    };
}

/**
 * 批量创建字段（带重试机制）
 * @param activeTable 当前活动表格
 * @param fieldsToCreate 要创建的字段列表
 * @param config 创建配置
 * @returns 创建结果列表
 */
export async function createMultipleFields(
    activeTable: ITable,
    fieldsToCreate: Field[],
    config: FieldCreationConfig = {}
): Promise<FieldCreationResult[]> {
    const results: FieldCreationResult[] = [];

    console.log(`[FieldManager] 开始批量创建 ${fieldsToCreate.length} 个字段`);

    for (const field of fieldsToCreate) {
        const result = await createSingleField(activeTable, field, config);
        results.push(result);
        await delay(200); // 等待0.5秒
        // 如果创建失败，可以选择继续或停止
        if (!result.success) {
            console.warn(`[FieldManager] 字段 ${field.name} 创建失败: ${result.error}`);
        }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`[FieldManager] 批量创建完成: 成功 ${successCount} 个，失败 ${failureCount} 个`);

    return results;
}

/**
 * 检查并创建缺失的字段
 * @param activeTable 当前活动表格
 * @param selectedFields 选中的字段列表
 * @param config 创建配置
 * @returns 创建结果和是否有权限
 */
export async function ensureFieldsExist(
    activeTable: ITable,
    selectedFields: Field[],
    config: FieldCreationConfig = {}
): Promise<{
    results: FieldCreationResult[];
    hasPermission: boolean;
    fieldsToCreate: Field[];
}> {
    try {
        // 1. 获取当前表格所有字段
        const allFields = await activeTable.getFieldMetaList();
        const existingFieldNames = allFields.map(f => f.name);

        // 2. 找出需要新建的字段（尊重映射到现有列的配置）
        const existingFieldIds = allFields.map(f => f.id);
        const fieldsToCreate = selectedFields.filter(f => {
            // 如果映射到现有列，且目标列存在，则不创建
            if (f.mappingType === 'existing') {
                if ((f.targetFieldId && existingFieldIds.includes(f.targetFieldId)) ||
                    (f.targetFieldName && existingFieldNames.includes(f.targetFieldName))) {
                    return false;
                }
                // 已显式选择映射到现有列，但未找到目标时，不主动新建，交由后续写入阶段回退处理
                return false;
            }
            // 默认：仅当表中不存在同名列时才创建
            return !existingFieldNames.includes(f.name);
        });
        console.log(`[FieldManager] 需要新建 ${fieldsToCreate.length} 个字段:`, fieldsToCreate.map(f => f.name));

        if (fieldsToCreate.length === 0) {
            return {
                results: [],
                hasPermission: true,
                fieldsToCreate: []
            };
        }

        // 3. 批量创建字段
        const results = await createMultipleFields(activeTable, fieldsToCreate, config);

        // 4. 检查是否有权限问题
        const hasFailures = results.some(r => !r.success);
        const hasPermission = !hasFailures || results.some(r => r.success);

        return {
            results,
            hasPermission,
            fieldsToCreate
        };

    } catch (error) {
        console.error('[FieldManager] 检查字段存在性失败:', error);
        return {
            results: [],
            hasPermission: false,
            fieldsToCreate: []
        };
    }
}

/**
 * 格式化字段创建结果为用户友好的消息
 * @param results 创建结果列表
 * @returns 格式化的消息
 */
export function formatFieldCreationResults(results: FieldCreationResult[]): {
    successMessage: string;
    errorMessage: string;
    hasErrors: boolean;
} {
    const successFields = results.filter(r => r.success);
    const failedFields = results.filter(r => !r.success);

    let successMessage = '';
    let errorMessage = '';

    if (successFields.length > 0) {
        successMessage = `成功创建 ${successFields.length} 个字段: ${successFields.map(r => r.fieldName).join('、')}`;
    }

    if (failedFields.length > 0) {
        const errorDetails = failedFields.map(r => `${r.fieldName}(${r.error})`).join('、');
        errorMessage = `创建失败 ${failedFields.length} 个字段: ${errorDetails}`;
    }

    return {
        successMessage,
        errorMessage,
        hasErrors: failedFields.length > 0
    };
} 