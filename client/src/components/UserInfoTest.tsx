import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFeishuBaseStore } from '@/hooks/useFeishuBaseStore';
import { getCurrentUserInfo, getUserDisplayName, getUserInfoForLog, getUserSummary } from '@/lib/userInfoHelper';
import { User, Mail, Shield, Clock } from 'lucide-react';
import React from 'react';

const UserInfoTest: React.FC = () => {
    // 使用Hook方式获取用户信息
    const userInfo = useFeishuBaseStore(state => state.feishuUserInfo);
    const getUserInfo = useFeishuBaseStore(state => state.getUserInfo);
    const getUserDisplayNameFromStore = useFeishuBaseStore(state => state.getUserDisplayName);
    const getUserInfoForLogFromStore = useFeishuBaseStore(state => state.getUserInfoForLog);

    // 测试同步方法
    const testSyncMethods = () => {
        console.log('=== 测试用户信息获取方法 ===');

        // Hook方式
        console.log('1. Hook方式获取:', userInfo);

        // Store方法方式
        console.log('2. Store方法获取:', getUserInfo());
        console.log('3. 用户显示名称:', getUserDisplayNameFromStore());
        console.log('4. 操作日志用户信息:', getUserInfoForLogFromStore());

        // 工具函数方式
        console.log('5. 同步获取用户信息:', getCurrentUserInfo());
        console.log('6. 同步获取显示名称:', getUserDisplayName());
        console.log('7. 同步获取日志信息:', getUserInfoForLog());
        console.log('8. 用户摘要:', getUserSummary());

        console.log('========================');
    };

    // 模拟操作日志
    const simulateOperationLog = () => {
        const logUserInfo = getUserInfoForLog();

        const mockLog = {
            submitTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            selectedFields: ['字段1', '字段2'],
            totalRows: 10,
            completionResult: {
                status: 'success' as const,
                successCount: 10,
                errorCount: 0,
                unchangedCount: 0
            },
            bitableUrl: 'https://example.com',
            tableName: '测试表格',
            tableId: 'tbl123',
            userInfo: logUserInfo // 添加用户信息到日志中
        };

        console.log('=== 模拟操作日志（包含用户信息）===');
        console.log(JSON.stringify(mockLog, null, 2));
        console.log('=====================================');
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    用户信息测试组件
                </CardTitle>
                <CardDescription>
                    测试全局用户信息获取功能
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {userInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4" />
                                基本信息
                            </h3>
                            <p><strong>姓名:</strong> {userInfo.name || '未提供'}</p>
                            <p><strong>英文名:</strong> {userInfo.en_name || '未提供'}</p>
                            <p><strong>用户ID:</strong> {userInfo.user_id}</p>
                            <p><strong>Open ID:</strong> {userInfo.open_id}</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                详细信息
                            </h3>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <strong>邮箱:</strong> {userInfo.email || '未提供'}
                            </p>
                            <p><strong>Union ID:</strong> {userInfo.union_id}</p>
                            <p><strong>租户Key:</strong> {userInfo.tenant_key}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>用户未登录</p>
                    </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={testSyncMethods} variant="outline">
                        <Clock className="w-4 h-4 mr-2" />
                        测试获取方法
                    </Button>
                    <Button onClick={simulateOperationLog} variant="outline">
                        📋 模拟操作日志
                    </Button>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">使用方式:</h4>
                    <div className="text-sm space-y-1">
                        <p><code>useFeishuBaseStore(state => state.getUserInfo())</code> - Hook方式</p>
                        <p><code>getCurrentUserInfo()</code> - 同步方法</p>
                        <p><code>getUserInfoForLog()</code> - 操作日志专用</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserInfoTest;