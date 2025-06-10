import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeishuBase } from '@/hooks/use-feishu-base';
import { toast } from '@/hooks/use-toast';
import { useFieldPermission, usePermission, useRecordPermission } from '@/hooks/usePermission';
import { AlertTriangle, CheckCircle, Database, RefreshCw, Settings, Shield, Users, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface PermissionItemProps {
    title: string;
    description: string;
    status: 'success' | 'error' | 'warning' | 'info';
    details?: string;
}

const PermissionItem: React.FC<PermissionItemProps> = ({ title, description, status, details }) => {
    const getIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default:
                return <Shield className="h-4 w-4 text-blue-500" />;
        }
    };

    const getBadgeVariant = () => {
        switch (status) {
            case 'success':
                return 'default';
            case 'error':
                return 'destructive';
            case 'warning':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    return (
        <div className="flex items-start space-x-3 p-3 border rounded-lg">
            {getIcon()}
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{title}</h4>
                    <Badge variant={getBadgeVariant()}>{status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
                {details && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{details}</p>
                )}
            </div>
        </div>
    );
};

const PermissionManager: React.FC = () => {
    const { activeTable, selection, refreshSelection } = useFeishuBase();
    const {
        isLoading,
        error,
        isAdvanced,
        userPermission,
        accessibleRecordsCount,
        accessibleFieldsCount,
        hasManagePermission,
        hasEditPermission,
        hasReadPermission,
        isReady,
        getAccessibleRecords,
        getAccessibleFields,
        getCurrentSelection,
        checkPluginPermissions,
        refreshPermissions
    } = usePermission();

    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');
    const [accessibleRecords, setAccessibleRecords] = useState<any[]>([]);
    const [accessibleFields, setAccessibleFields] = useState<any[]>([]);
    const [pluginPermissions, setPluginPermissions] = useState<any>(null);

    // 使用便捷的权限检查Hook
    const recordPermission = useRecordPermission(selectedRecordId);
    const fieldPermission = useFieldPermission(selectedFieldId);

    // 加载可访问的数据
    const loadAccessibleData = async () => {
        try {
            const [recordsResult, fieldsResult] = await Promise.all([
                getAccessibleRecords(),
                getAccessibleFields()
            ]);

            if (recordsResult?.hasPermission) {
                setAccessibleRecords(recordsResult.accessibleData?.records || []);
            }

            if (fieldsResult?.hasPermission) {
                setAccessibleFields(fieldsResult.accessibleData?.fields || []);
            }
        } catch (error) {
            console.error('加载可访问数据失败:', error);
        }
    };

    // 检查插件权限
    const loadPluginPermissions = async () => {
        try {
            const result = await checkPluginPermissions();
            setPluginPermissions(result);
        } catch (error) {
            console.error('检查插件权限失败:', error);
        }
    };

    // 刷新所有数据
    const handleRefresh = async () => {
        try {
            await refreshPermissions();
            await loadAccessibleData();
            await loadPluginPermissions();
            toast({
                title: '刷新成功',
                description: '权限信息已更新',
            });
        } catch (error) {
            toast({
                title: '刷新失败',
                description: '无法更新权限信息',
                variant: 'destructive'
            });
        }
    };

    // 测试当前选择
    const testCurrentSelection = async () => {
        try {
            await refreshSelection();
            const selectionResult = await getCurrentSelection();

            if (selectionResult?.hasPermission) {
                const data = selectionResult.accessibleData;
                toast({
                    title: '选择信息',
                    description: `表格: ${data.hasTableAccess ? '✓' : '✗'}, 视图: ${data.hasViewAccess ? '✓' : '✗'}, 记录: ${data.hasRecordAccess ? '✓' : '✗'}, 字段: ${data.hasFieldAccess ? '✓' : '✗'}`,
                });

                // 设置选中的记录和字段ID用于权限检查
                if (data.selection.recordId) {
                    setSelectedRecordId(data.selection.recordId);
                }
                if (data.selection.fieldId) {
                    setSelectedFieldId(data.selection.fieldId);
                }
            }
        } catch (error) {
            console.error('测试当前选择失败:', error);
        }
    };

    useEffect(() => {
        if (isReady) {
            loadAccessibleData();
            loadPluginPermissions();
        }
    }, [isReady]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>加载权限信息中...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>权限服务错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* 头部信息 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">权限管理</h1>
                    <p className="text-muted-foreground">
                        多维表格高级权限管理和监控
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    刷新
                </Button>
            </div>

            {/* 权限概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">高级权限</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isAdvanced ? '已启用' : '未启用'}
                        </div>
                        <Badge variant={isAdvanced ? 'default' : 'secondary'}>
                            {isAdvanced ? '高级模式' : '基础模式'}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">可访问记录</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accessibleRecordsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            当前用户可访问的记录数量
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">可访问字段</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accessibleFieldsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            当前用户可访问的字段数量
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">用户权限</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <Badge variant={hasManagePermission ? 'default' : 'outline'}>
                                管理: {hasManagePermission ? '✓' : '✗'}
                            </Badge>
                            <Badge variant={hasEditPermission ? 'default' : 'outline'}>
                                编辑: {hasEditPermission ? '✓' : '✗'}
                            </Badge>
                            <Badge variant={hasReadPermission ? 'default' : 'outline'}>
                                查看: {hasReadPermission ? '✓' : '✗'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 详细信息标签页 */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="records">记录权限</TabsTrigger>
                    <TabsTrigger value="fields">字段权限</TabsTrigger>
                    <TabsTrigger value="testing">权限测试</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 用户权限详情 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>用户权限详情</CardTitle>
                                <CardDescription>当前用户的权限信息</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {userPermission ? (
                                    <>
                                        <PermissionItem
                                            title="用户ID"
                                            description={userPermission.baseUserId}
                                            status="info"
                                        />
                                        <PermissionItem
                                            title="管理权限"
                                            description="可以管理表格和所有数据"
                                            status={userPermission.hasManagePermission ? 'success' : 'error'}
                                        />
                                        <PermissionItem
                                            title="编辑权限"
                                            description="可以编辑记录和字段"
                                            status={userPermission.hasEditPermission ? 'success' : 'error'}
                                        />
                                        <PermissionItem
                                            title="查看权限"
                                            description="可以查看数据"
                                            status={userPermission.hasReadPermission ? 'success' : 'error'}
                                        />
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">用户权限信息加载中...</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* 插件权限状态 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>插件权限状态</CardTitle>
                                <CardDescription>插件在开发者后台的权限配置</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {pluginPermissions ? (
                                    <>
                                        <PermissionItem
                                            title="多维表格权限"
                                            description="bitable:app - 完整的表格操作权限"
                                            status={pluginPermissions.hasBitableApp ? 'success' : 'error'}
                                        />
                                        <PermissionItem
                                            title="只读权限"
                                            description="bitable:app:readonly - 只读访问权限"
                                            status={pluginPermissions.hasBitableAppReadonly ? 'success' : 'error'}
                                        />
                                        {pluginPermissions.recommendedAction && (
                                            <Alert>
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    {pluginPermissions.recommendedAction}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">插件权限信息加载中...</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="records" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>可访问记录列表</CardTitle>
                            <CardDescription>
                                当前用户可以访问的记录（共 {accessibleRecords.length} 条）
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {accessibleRecords.length > 0 ? (
                                        accessibleRecords.map((record, index) => (
                                            <div key={index} className="p-2 border rounded text-sm">
                                                <div className="font-medium">记录 #{index + 1}</div>
                                                <div className="text-muted-foreground">
                                                    ID: {record.recordId || record.id || '未知'}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground">暂无可访问的记录</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fields" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>可访问字段列表</CardTitle>
                            <CardDescription>
                                当前用户可以访问的字段（共 {accessibleFields.length} 个）
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {accessibleFields.length > 0 ? (
                                        accessibleFields.map((field, index) => (
                                            <div key={index} className="p-2 border rounded text-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{field.fieldName}</div>
                                                        <div className="text-muted-foreground">
                                                            ID: {field.fieldId} | 类型: {field.fieldType}
                                                        </div>
                                                    </div>
                                                    <div className="space-x-1">
                                                        <Badge variant={field.canRead ? 'default' : 'outline'}>
                                                            {field.canRead ? '可读' : '不可读'}
                                                        </Badge>
                                                        <Badge variant={field.canEdit ? 'default' : 'outline'}>
                                                            {field.canEdit ? '可编辑' : '不可编辑'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground">暂无可访问的字段</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="testing" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 当前选择测试 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>当前选择测试</CardTitle>
                                <CardDescription>测试当前用户选择的单元格权限</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button onClick={testCurrentSelection} className="w-full">
                                    测试当前选择
                                </Button>

                                {selection && (
                                    <div className="space-y-2 text-sm">
                                        <div>表格ID: {selection.tableId || '未选择'}</div>
                                        <div>视图ID: {selection.viewId || '未选择'}</div>
                                        <div>记录ID: {selection.recordId || '未选择'}</div>
                                        <div>字段ID: {selection.fieldId || '未选择'}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 权限检查结果 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>权限检查结果</CardTitle>
                                <CardDescription>选中记录和字段的权限详情</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedRecordId && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium">记录权限</h4>
                                        {recordPermission.isLoading ? (
                                            <p className="text-muted-foreground">检查中...</p>
                                        ) : recordPermission.permission ? (
                                            <div className="space-y-1">
                                                <Badge variant={recordPermission.canRead ? 'default' : 'destructive'}>
                                                    读取: {recordPermission.canRead ? '✓' : '✗'}
                                                </Badge>
                                                <Badge variant={recordPermission.canEdit ? 'default' : 'destructive'}>
                                                    编辑: {recordPermission.canEdit ? '✓' : '✗'}
                                                </Badge>
                                                <Badge variant={recordPermission.canDelete ? 'default' : 'destructive'}>
                                                    删除: {recordPermission.canDelete ? '✓' : '✗'}
                                                </Badge>
                                                {recordPermission.permission.reason && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {recordPermission.permission.reason}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">无权限信息</p>
                                        )}
                                    </div>
                                )}

                                <Separator />

                                {selectedFieldId && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium">字段权限</h4>
                                        {fieldPermission.isLoading ? (
                                            <p className="text-muted-foreground">检查中...</p>
                                        ) : fieldPermission.permission ? (
                                            <div className="space-y-1">
                                                <Badge variant={fieldPermission.canRead ? 'default' : 'destructive'}>
                                                    读取: {fieldPermission.canRead ? '✓' : '✗'}
                                                </Badge>
                                                <Badge variant={fieldPermission.canEdit ? 'default' : 'destructive'}>
                                                    编辑: {fieldPermission.canEdit ? '✓' : '✗'}
                                                </Badge>
                                                {fieldPermission.permission.reason && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {fieldPermission.permission.reason}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">无权限信息</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PermissionManager; 