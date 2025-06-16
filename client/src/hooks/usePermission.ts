import {
    FieldPermission,
    getPermissionService,
    PermissionCheckResult,
    PermissionService,
    PermissionUtils,
    RecordPermission,
    UserPermission
} from '@/lib/permissionService';
import { useCallback, useEffect, useState } from 'react';
import { useFeishuBase } from './use-feishu-base';
import { toast } from './use-toast';

interface UsePermissionOptions {
    autoInit?: boolean;
    showToastOnError?: boolean;
}

interface PermissionState {
    service: PermissionService | null;
    isLoading: boolean;
    error: string | null;
    isAdvanced: boolean;
    userPermission: UserPermission | null;
    accessibleRecordsCount: number;
    accessibleFieldsCount: number;
}

export function usePermission(tableId?: string, options: UsePermissionOptions = {}) {
    const { autoInit = true, showToastOnError = true } = options;
    const { activeTable } = useFeishuBase();

    // 使用传入的tableId或者当前活动表格的ID
    const currentTableId = tableId || activeTable?.id;

    const [state, setState] = useState<PermissionState>({
        service: null,
        isLoading: false,
        error: null,
        isAdvanced: false,
        userPermission: null,
        accessibleRecordsCount: 0,
        accessibleFieldsCount: 0
    });

    // 初始化权限服务
    const initializePermissionService = useCallback(async () => {
        if (!currentTableId) {
            setState(prev => ({
                ...prev,
                error: '表格ID未提供',
                isLoading: false
            }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const service = await getPermissionService(currentTableId);
            const summary = await service.getPermissionSummary();

            setState(prev => ({
                ...prev,
                service,
                isLoading: false,
                isAdvanced: summary.isAdvanced,
                userPermission: summary.userPermission,
                accessibleRecordsCount: summary.accessibleRecordsCount,
                accessibleFieldsCount: summary.accessibleFieldsCount
            }));

            console.log('权限服务初始化成功:', summary);
        } catch (error: any) {
            const errorMessage = error.message || '权限服务初始化失败';
            setState(prev => ({
                ...prev,
                error: errorMessage,
                isLoading: false
            }));

            if (showToastOnError) {
                toast({
                    variant: 'destructive',
                    title: '权限服务初始化失败',
                    description: errorMessage
                });
            }

            console.error('权限服务初始化失败:', error);
        }
    }, [currentTableId, showToastOnError]);

    // 检查记录权限
    const checkRecordPermission = useCallback(async (recordId: string): Promise<RecordPermission | null> => {
        if (!state.service) {
            console.warn('权限服务未初始化');
            return null;
        }

        try {
            return await state.service.checkRecordPermission(recordId);
        } catch (error: any) {
            console.error('检查记录权限失败:', error);
            if (showToastOnError && PermissionUtils.isPermissionError(error)) {
                toast({
                    variant: 'destructive',
                    title: '权限检查失败',
                    description: PermissionUtils.getPermissionErrorMessage(error)
                });
            }
            return null;
        }
    }, [state.service, showToastOnError]);

    // 检查字段权限
    const checkFieldPermission = useCallback(async (fieldId: string): Promise<FieldPermission | null> => {
        if (!state.service) {
            console.warn('权限服务未初始化');
            return null;
        }

        try {
            return await state.service.checkFieldPermission(fieldId);
        } catch (error: any) {
            console.error('检查字段权限失败:', error);
            if (showToastOnError && PermissionUtils.isPermissionError(error)) {
                toast({
                    variant: 'destructive',
                    title: '权限检查失败',
                    description: PermissionUtils.getPermissionErrorMessage(error)
                });
            }
            return null;
        }
    }, [state.service, showToastOnError]);

    // 获取可访问的记录
    const getAccessibleRecords = useCallback(async (): Promise<PermissionCheckResult | null> => {
        if (!state.service) {
            console.warn('权限服务未初始化');
            return null;
        }

        try {
            return await state.service.getAccessibleRecords();
        } catch (error: any) {
            console.error('获取可访问记录失败:', error);
            if (showToastOnError) {
                toast({
                    variant: 'destructive',
                    title: '获取记录失败',
                    description: error.message || '获取可访问记录失败'
                });
            }
            return null;
        }
    }, [state.service, showToastOnError]);

    // 获取可访问的字段
    const getAccessibleFields = useCallback(async (): Promise<PermissionCheckResult | null> => {
        if (!state.service) {
            console.warn('权限服务未初始化');
            return null;
        }

        try {
            return await state.service.getAccessibleFields();
        } catch (error: any) {
            console.error('获取可访问字段失败:', error);
            if (showToastOnError) {
                toast({
                    variant: 'destructive',
                    title: '获取字段失败',
                    description: error.message || '获取可访问字段失败'
                });
            }
            return null;
        }
    }, [state.service, showToastOnError]);

    // 安全更新记录
    const safeUpdateRecord = useCallback(async (
        recordId: string,
        fields: { [fieldId: string]: any }
    ): Promise<PermissionCheckResult | null> => {
        if (!state.service) {
            console.warn('权限服务未初始化');
            return null;
        }

        try {
            const result = await state.service.updateRecord(recordId, fields);

            if (result.hasPermission) {
                toast({
                    variant: 'default',
                    title: '更新成功',
                    description: `已更新记录 ${recordId}`
                });
            } else if (showToastOnError) {
                toast({
                    variant: 'destructive',
                    title: '更新失败',
                    description: result.errorMessage || '无权限更新记录'
                });
            }

            return result;
        } catch (error: any) {
            console.error('更新记录失败:', error);
            if (showToastOnError) {
                toast({
                    variant: 'destructive',
                    title: '更新失败',
                    description: error.message || '更新记录失败'
                });
            }
            return null;
        }
    }, [state.service, showToastOnError]);

    // 获取当前选择信息
    const getCurrentSelection = useCallback(async (): Promise<PermissionCheckResult | null> => {
        if (!state.service) {
            console.warn('权限服务未初始化');
            return null;
        }

        try {
            return await state.service.getCurrentSelection();
        } catch (error: any) {
            console.error('获取当前选择失败:', error);
            return null;
        }
    }, [state.service]);

    // 检查插件权限
    const checkPluginPermissions = useCallback(async () => {
        if (!state.service) {
            console.warn('权限服务未初始化');
            return null;
        }

        try {
            return await state.service.checkPluginPermissions();
        } catch (error: any) {
            console.error('检查插件权限失败:', error);
            return null;
        }
    }, [state.service]);

    // 刷新权限信息
    const refreshPermissions = useCallback(async () => {
        if (currentTableId) {
            await initializePermissionService();
        }
    }, [currentTableId, initializePermissionService]);

    // 安全执行操作的辅助函数
    const safeExecute = useCallback(async <T>(
        operation: () => Promise<T>,
        fallback?: T,
        errorTitle?: string
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
        try {
            const data = await operation();
            return { success: true, data };
        } catch (error: any) {
            const errorMessage = PermissionUtils.isPermissionError(error)
                ? PermissionUtils.getPermissionErrorMessage(error)
                : error.message || '操作失败';

            if (showToastOnError) {
                toast({
                    variant: 'destructive',
                    title: errorTitle || '操作失败',
                    description: errorMessage
                });
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [showToastOnError]);

    // 自动初始化
    useEffect(() => {
        if (autoInit && currentTableId && !state.service && !state.isLoading) {
            initializePermissionService();
        }
    }, [autoInit, currentTableId, state.service, state.isLoading, initializePermissionService]);

    return {
        // 状态
        ...state,

        // 方法
        initializePermissionService,
        checkRecordPermission,
        checkFieldPermission,
        getAccessibleRecords,
        getAccessibleFields,
        safeUpdateRecord,
        getCurrentSelection,
        checkPluginPermissions,
        refreshPermissions,
        safeExecute,

        // 便捷属性
        isReady: !!state.service && !state.isLoading,
        hasError: !!state.error,
        hasManagePermission: state.userPermission?.hasManagePermission || false,
        hasEditPermission: state.userPermission?.hasEditPermission || false,
        hasReadPermission: state.userPermission?.hasReadPermission || false,
    };
}

// 权限检查的便捷Hook
export function useRecordPermission(recordId?: string) {
    const { checkRecordPermission, isReady } = usePermission();
    const [permission, setPermission] = useState<RecordPermission | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const checkPermission = useCallback(async (id?: string) => {
        const targetId = id || recordId;
        if (!targetId || !isReady) return;

        setIsLoading(true);
        try {
            const result = await checkRecordPermission(targetId);
            setPermission(result);
        } finally {
            setIsLoading(false);
        }
    }, [recordId, checkRecordPermission, isReady]);

    useEffect(() => {
        if (recordId && isReady) {
            checkPermission();
        }
    }, [recordId, isReady, checkPermission]);

    return {
        permission,
        isLoading,
        checkPermission,
        canRead: permission?.canRead || false,
        canEdit: permission?.canEdit || false,
        canDelete: permission?.canDelete || false,
    };
}

// 字段权限检查的便捷Hook
export function useFieldPermission(fieldId?: string) {
    const { checkFieldPermission, isReady } = usePermission();
    const [permission, setPermission] = useState<FieldPermission | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const checkPermission = useCallback(async (id?: string) => {
        const targetId = id || fieldId;
        if (!targetId || !isReady) return;

        setIsLoading(true);
        try {
            const result = await checkFieldPermission(targetId);
            setPermission(result);
        } finally {
            setIsLoading(false);
        }
    }, [fieldId, checkFieldPermission, isReady]);

    useEffect(() => {
        if (fieldId && isReady) {
            checkPermission();
        }
    }, [fieldId, isReady, checkPermission]);

    return {
        permission,
        isLoading,
        checkPermission,
        canRead: permission?.canRead || false,
        canEdit: permission?.canEdit || false,
    };
} 