import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeishuAuth } from '@/hooks/useFeishuAuth';
import { AlertCircle, CheckCircle, Clock, LogOut, RefreshCw, Shield, User } from 'lucide-react';
import React from 'react';

const FEISHU_CONFIG = {
    clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
    redirectUri: import.meta.env.VITE_FEISHU_REDIRECT_URI || window.location.origin + '/#/auth/callback',
};

/**
 * 免登录功能演示组件
 * 展示当前登录状态、token信息和相关操作
 */
const AutoLoginDemo: React.FC = () => {
    const {
        isAuthenticated,
        user,
        accessToken,
        isLoading,
        error,
        logout,
        refreshToken,
        clearError
    } = useFeishuAuth(FEISHU_CONFIG);

    const handleRefreshToken = async () => {
        try {
            await refreshToken();
            console.log('Token手动刷新成功');
        } catch (err) {
            console.error('Token手动刷新失败:', err);
        }
    };

    const handleLogout = () => {
        logout();
        console.log('用户已登出');
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    免登录功能演示
                </CardTitle>
                <CardDescription>
                    展示Token存储、自动恢复和刷新机制
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 登录状态 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <Clock className="w-5 h-5 animate-spin text-blue-500" />
                        ) : isAuthenticated ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                            <p className="font-semibold">
                                {isLoading ? '检查登录状态...' : isAuthenticated ? '已登录' : '未登录'}
                            </p>
                            {user && (
                                <p className="text-sm text-gray-600">
                                    {user.name || user.en_name || '未知用户'}
                                </p>
                            )}
                        </div>
                    </div>
                    <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                        {isAuthenticated ? '已认证' : '未认证'}
                    </Badge>
                </div>

                {/* Token信息 */}
                {isAuthenticated && accessToken && (
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Token信息
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm">
                                <strong>Access Token:</strong> {accessToken.substring(0, 30)}...
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Token会自动刷新，保持登录状态
                            </p>
                        </div>
                    </div>
                )}

                {/* 用户信息 */}
                {user && (
                    <div className="space-y-3">
                        <h3 className="font-semibold">用户信息</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>姓名:</strong> {user.name || '未提供'}
                            </div>
                            <div>
                                <strong>英文名:</strong> {user.en_name || '未提供'}
                            </div>
                            <div>
                                <strong>用户ID:</strong> {user.user_id}
                            </div>
                            <div>
                                <strong>邮箱:</strong> {user.email || '未提供'}
                            </div>
                        </div>
                    </div>
                )}

                {/* 错误信息 */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <strong>认证错误</strong>
                        </div>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearError}
                            className="mt-2"
                        >
                            清除错误
                        </Button>
                    </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-4 border-t">
                    {isAuthenticated ? (
                        <>
                            <Button
                                onClick={handleRefreshToken}
                                variant="outline"
                                disabled={isLoading}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                手动刷新Token
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="destructive"
                                disabled={isLoading}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                登出
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => window.location.hash = '/login'}
                            variant="default"
                        >
                            前往登录
                        </Button>
                    )}
                </div>

                {/* 免登录功能说明 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 免登录功能说明</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 登录后Token会自动保存到浏览器本地存储</li>
                        <li>• 重新打开插件时会自动检查并恢复登录状态</li>
                        <li>• Token过期时会自动使用refresh_token刷新</li>
                        <li>• 用户信息会同步到全局状态，供整个应用使用</li>
                        <li>• 提供完整的登出功能，清除所有认证信息</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default AutoLoginDemo;