import { bitable, ITable } from '@lark-base-open/js-sdk';
import { getStoredUserInfo } from './feishuAuth';
import { feishuBase } from './feishuBase';

// 权限类型定义
export enum PermissionType {
    MANAGE = 'manage',           // 可管理
    EDIT = 'edit',              // 可编辑
    COMMENT = 'comment',        // 可评论
    READ = 'read',              // 可查看
    NO_ACCESS = 'no_access'     // 无权限
}

// 多维表格元数据
export interface BitableMetadata {
    app_token: string;
    name: string;
    version: string;
    is_advanced: boolean;  // 是否开启高级权限
    time_zone: string;
    revision: number;
}

// 用户权限信息
export interface UserPermission {
    userId: string;
    baseUserId: string;
    hasManagePermission: boolean;
    hasEditPermission: boolean;
    hasReadPermission: boolean;
    accessibleFields: string[];
    accessibleRecords: string[];
}

// 字段权限信息
export interface FieldPermission {
    fieldId: string;
    fieldName: string;
    canRead: boolean;
    canEdit: boolean;
    reason?: string;
}

// 记录权限信息
export interface RecordPermission {
    recordId: string;
    canRead: boolean;
    canEdit: boolean;
    canDelete: boolean;
    reason?: string;
}

// 权限检查结果
export interface PermissionCheckResult {
    hasPermission: boolean;
    errorCode?: string;
    errorMessage?: string;
    accessibleData?: any;
}

/**
 * 多维表格权限服务
 * 基于飞书开放平台的高级权限功能
 */
export class PermissionService {
    private tableId: string;
    private table: ITable | null = null;
    private metadata: BitableMetadata | null = null;
    private userPermission: UserPermission | null = null;

    constructor(tableId: string) {
        this.tableId = tableId;
    }

    /**
     * 初始化权限服务
     */
    async initialize(): Promise<void> {
        try {
            // 获取表格实例
            this.table = await bitable.base.getTableById(this.tableId);

            // 获取多维表格元数据
            await this.loadBitableMetadata();

            // 获取用户权限信息
            await this.loadUserPermission();

            console.log('权限服务初始化完成', {
                tableId: this.tableId,
                metadata: this.metadata,
                userPermission: this.userPermission
            });
        } catch (error) {
            console.error('权限服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取多维表格元数据
     */
    private async loadBitableMetadata(): Promise<void> {
        try {
            // FIXME: 这里应该调用实际的获取多维表格元数据接口
            // GET /open-apis/bitable/v1/apps/{app_token}

            // 模拟元数据，实际应该从API获取
            this.metadata = {
                app_token: 'mock_app_token',
                name: '示例多维表格',
                version: '1.0.0',
                is_advanced: true,  // 假设开启了高级权限
                time_zone: 'Asia/Shanghai',
                revision: 1
            };

            console.log('多维表格元数据:', this.metadata);
        } catch (error) {
            console.error('获取多维表格元数据失败:', error);
            throw error;
        }
    }

    /**
     * 加载用户权限信息
     */
    private async loadUserPermission(): Promise<void> {
        try {
            const currentUser = await feishuBase.getCurrentUser();
            const feishuUserInfo = getStoredUserInfo();

            // FIXME: 这里应该调用实际的权限查询API
            // 可能需要调用多个接口来获取完整的权限信息

            this.userPermission = {
                userId: currentUser.userId,
                baseUserId: currentUser.baseUserId,
                hasManagePermission: false,  // 需要从API获取
                hasEditPermission: true,     // 需要从API获取
                hasReadPermission: true,     // 需要从API获取
                accessibleFields: [],        // 需要从API获取
                accessibleRecords: []        // 需要从API获取
            };

            console.log('用户权限信息:', this.userPermission);
        } catch (error) {
            console.error('加载用户权限信息失败:', error);
            throw error;
        }
    }

    /**
     * 检查是否开启了高级权限
     */
    isAdvancedPermissionEnabled(): boolean {
        return this.metadata?.is_advanced || false;
    }

    /**
     * 获取用户可访问的记录列表
     */
    async getAccessibleRecords(): Promise<PermissionCheckResult> {
        if (!this.table || !this.userPermission) {
            return {
                hasPermission: false,
                errorMessage: '权限服务未初始化'
            };
        }

        try {
            // 使用飞书SDK获取记录，SDK会自动处理权限过滤
            const recordList = await this.table.getRecordList();

            // 将记录列表转换为数组
            const records: any[] = [];
            const recordIds: string[] = [];

            // FIXME: 需要根据实际的SDK返回类型来处理
            // 这里假设recordList是可迭代的
            try {
                for (const record of recordList as any) {
                    records.push(record);
                    recordIds.push(record.recordId || record.id);
                }
            } catch (iterationError) {
                console.warn('记录列表迭代失败，尝试其他方法:', iterationError);
                // 如果迭代失败，尝试其他方法获取记录
            }

            return {
                hasPermission: true,
                accessibleData: {
                    records,
                    recordIds,
                    totalCount: records.length
                }
            };
        } catch (error: any) {
            console.error('获取可访问记录失败:', error);

            // 检查是否是权限错误
            if (error.code === 1254302) {
                return {
                    hasPermission: false,
                    errorCode: '1254302',
                    errorMessage: '无权限访问该数据'
                };
            }

            return {
                hasPermission: false,
                errorMessage: '获取记录失败: ' + error.message
            };
        }
    }

    /**
     * 获取用户可访问的字段列表
     */
    async getAccessibleFields(): Promise<PermissionCheckResult> {
        if (!this.table) {
            return {
                hasPermission: false,
                errorMessage: '权限服务未初始化'
            };
        }

        try {
            // 使用飞书SDK获取字段，SDK会自动处理权限过滤
            const fieldList = await this.table.getFieldMetaList();

            const accessibleFields = fieldList.map(field => ({
                fieldId: field.id,
                fieldName: field.name,
                fieldType: field.type,
                canRead: true,  // 如果能获取到字段，说明有读权限
                canEdit: this.userPermission?.hasEditPermission || false
            }));

            return {
                hasPermission: true,
                accessibleData: {
                    fields: accessibleFields,
                    totalCount: accessibleFields.length
                }
            };
        } catch (error: any) {
            console.error('获取可访问字段失败:', error);

            if (error.code === 1254045) {
                return {
                    hasPermission: false,
                    errorCode: '1254045',
                    errorMessage: '字段不存在或无权限访问'
                };
            }

            return {
                hasPermission: false,
                errorMessage: '获取字段失败: ' + error.message
            };
        }
    }

    /**
     * 检查对特定记录的权限
     */
    async checkRecordPermission(recordId: string): Promise<RecordPermission> {
        if (!this.table || !this.userPermission) {
            return {
                recordId,
                canRead: false,
                canEdit: false,
                canDelete: false,
                reason: '权限服务未初始化'
            };
        }

        try {
            // 尝试获取记录，如果成功说明有读权限
            const recordValue = await this.table.getRecordById(recordId);

            return {
                recordId,
                canRead: true,
                canEdit: this.userPermission.hasEditPermission,
                canDelete: this.userPermission.hasManagePermission,
                reason: '权限检查通过'
            };
        } catch (error: any) {
            console.error(`检查记录权限失败 (recordId: ${recordId}):`, error);

            if (error.code === 1254302) {
                return {
                    recordId,
                    canRead: false,
                    canEdit: false,
                    canDelete: false,
                    reason: '无权限访问该记录'
                };
            }

            return {
                recordId,
                canRead: false,
                canEdit: false,
                canDelete: false,
                reason: '权限检查失败: ' + error.message
            };
        }
    }

    /**
     * 检查对特定字段的权限
     */
    async checkFieldPermission(fieldId: string): Promise<FieldPermission> {
        if (!this.table) {
            return {
                fieldId,
                fieldName: '',
                canRead: false,
                canEdit: false,
                reason: '权限服务未初始化'
            };
        }

        try {
            // 尝试获取字段信息，如果成功说明有读权限
            const field = await this.table.getFieldById(fieldId);

            const fieldName = await field.getName();

            return {
                fieldId,
                fieldName,
                canRead: true,
                canEdit: this.userPermission?.hasEditPermission || false,
                reason: '权限检查通过'
            };
        } catch (error: any) {
            console.error(`检查字段权限失败 (fieldId: ${fieldId}):`, error);

            if (error.code === 1254045) {
                return {
                    fieldId,
                    fieldName: '',
                    canRead: false,
                    canEdit: false,
                    reason: '字段不存在或无权限访问'
                };
            }

            return {
                fieldId,
                fieldName: '',
                canRead: false,
                canEdit: false,
                reason: '权限检查失败: ' + error.message
            };
        }
    }

    /**
     * 获取当前用户的选择信息（包含权限过滤）
     */
    async getCurrentSelection(): Promise<PermissionCheckResult> {
        try {
            // 使用飞书SDK获取当前选择，SDK会自动处理权限
            const selection = await feishuBase.getSelection();

            return {
                hasPermission: true,
                accessibleData: {
                    selection,
                    hasTableAccess: !!selection.tableId,
                    hasViewAccess: !!selection.viewId,
                    hasRecordAccess: !!selection.recordId,
                    hasFieldAccess: !!selection.fieldId
                }
            };
        } catch (error: any) {
            console.error('获取当前选择失败:', error);

            return {
                hasPermission: false,
                errorMessage: '获取选择信息失败: ' + error.message
            };
        }
    }

    /**
     * 尝试更新记录（会自动检查权限）
     */
    async updateRecord(recordId: string, fields: { [fieldId: string]: any }): Promise<PermissionCheckResult> {
        if (!this.table || !this.userPermission) {
            return {
                hasPermission: false,
                errorMessage: '权限服务未初始化'
            };
        }

        if (!this.userPermission.hasEditPermission) {
            return {
                hasPermission: false,
                errorCode: '1254302',
                errorMessage: '无编辑权限'
            };
        }

        try {
            // 使用现有的更新方法
            await feishuBase.updateRecord(this.tableId, recordId, fields);

            return {
                hasPermission: true,
                accessibleData: {
                    recordId,
                    updatedFields: Object.keys(fields)
                }
            };
        } catch (error: any) {
            console.error('更新记录失败:', error);

            if (error.code === 1254302) {
                return {
                    hasPermission: false,
                    errorCode: '1254302',
                    errorMessage: '无权限更新该记录'
                };
            }

            return {
                hasPermission: false,
                errorMessage: '更新记录失败: ' + error.message
            };
        }
    }

    /**
     * 获取权限摘要
     */
    async getPermissionSummary(): Promise<{
        isAdvanced: boolean;
        userPermission: UserPermission | null;
        accessibleRecordsCount: number;
        accessibleFieldsCount: number;
        lastChecked: Date;
    }> {
        const recordsResult = await this.getAccessibleRecords();
        const fieldsResult = await this.getAccessibleFields();

        return {
            isAdvanced: this.isAdvancedPermissionEnabled(),
            userPermission: this.userPermission,
            accessibleRecordsCount: recordsResult.accessibleData?.totalCount || 0,
            accessibleFieldsCount: fieldsResult.accessibleData?.totalCount || 0,
            lastChecked: new Date()
        };
    }

    /**
     * 检查插件权限
     */
    async checkPluginPermissions(): Promise<{
        hasBitableApp: boolean;
        hasBitableAppReadonly: boolean;
        recommendedAction?: string;
    }> {
        // FIXME: 这里应该调用实际的权限检查API
        // 目前返回模拟数据

        return {
            hasBitableApp: true,  // 假设有完整权限
            hasBitableAppReadonly: true,
            recommendedAction: '建议在开发者后台确认插件权限配置'
        };
    }
}

/**
 * 权限服务工厂函数
 */
export const createPermissionService = (tableId: string): PermissionService => {
    return new PermissionService(tableId);
};

/**
 * 权限服务实例缓存
 */
const permissionServiceCache = new Map<string, PermissionService>();

/**
 * 获取权限服务实例（带缓存）
 */
export const getPermissionService = async (tableId: string): Promise<PermissionService> => {
    if (!permissionServiceCache.has(tableId)) {
        const service = createPermissionService(tableId);
        await service.initialize();
        permissionServiceCache.set(tableId, service);
    }

    return permissionServiceCache.get(tableId)!;
};

/**
 * 权限工具函数
 */
export const PermissionUtils = {
    /**
     * 检查错误是否为权限相关错误
     */
    isPermissionError(error: any): boolean {
        return error.code === 1254302 || error.code === 1254045;
    },

    /**
     * 获取权限错误的友好提示
     */
    getPermissionErrorMessage(error: any): string {
        switch (error.code) {
            case 1254302:
                return '您没有权限访问该数据，请联系管理员授权';
            case 1254045:
                return '字段不存在或您没有权限访问该字段';
            default:
                return '权限检查失败，请稍后重试';
        }
    },

    /**
     * 安全地执行可能有权限限制的操作
     */
    async safeExecute<T>(
        operation: () => Promise<T>,
        fallback?: T
    ): Promise<{ success: boolean; data?: T; error?: string }> {
        try {
            const data = await operation();
            return { success: true, data };
        } catch (error: any) {
            if (this.isPermissionError(error)) {
                return {
                    success: false,
                    error: this.getPermissionErrorMessage(error)
                };
            }
            return {
                success: false,
                error: error.message || '操作失败'
            };
        }
    }
}; 