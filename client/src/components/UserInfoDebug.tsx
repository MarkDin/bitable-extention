import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeishuAuth } from '@/hooks/useFeishuAuth';
import { Mail, Phone, Shield, User, UserCheck } from 'lucide-react';
import React from 'react';

// 飞书应用配置
const FEISHU_CONFIG = {
    clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
    redirectUri: import.meta.env.VITE_FEISHU_REDIRECT_URI || 'https://bitable-extention-dk1543100966.replit.app/auth/callback',
};

const UserInfoDebug: React.FC = () => {
    const { isAuthenticated, user, accessToken, isLoading, error } = useFeishuAuth(FEISHU_CONFIG);

    if (isLoading) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        用户信息加载中...
                    </CardTitle>
                </CardHeader>
            </Card>
        );
    }

    if (!isAuthenticated) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        用户未登录
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">请先登录以查看用户信息</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <User className="w-5 h-5" />
                        获取用户信息失败
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        用户信息
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 基本信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-gray-700">基本信息</h3>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>用户名:</strong> {user?.name || '未提供'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>英文名:</strong> {user?.en_name || '未提供'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>邮箱:</strong> {user?.email || '未提供或权限不足'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>手机:</strong> {user?.mobile || '未提供或权限不足'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-gray-700">系统信息</h3>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>用户ID:</strong> {user?.user_id || '未提供'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>Open ID:</strong> {user?.open_id || '未提供'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>Union ID:</strong> {user?.union_id || '未提供'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>租户键:</strong> {user?.tenant_key || '未提供'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 头像 */}
                    {user?.avatar_url && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-gray-700">头像</h3>
                            <div className="flex items-center gap-4">
                                <img
                                    src={user.avatar_url}
                                    alt="用户头像"
                                    className="w-16 h-16 rounded-full border-2 border-gray-200"
                                />
                                <div className="text-sm space-y-1">
                                    <p><strong>头像URL:</strong> <a href={user.avatar_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">查看原图</a></p>
                                    {user.avatar_thumb && <p><strong>缩略图:</strong> <a href={user.avatar_thumb} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">缩略图</a></p>}
                                    {user.avatar_middle && <p><strong>中等尺寸:</strong> <a href={user.avatar_middle} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">中等尺寸</a></p>}
                                    {user.avatar_big && <p><strong>大尺寸:</strong> <a href={user.avatar_big} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">大尺寸</a></p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 权限提示 */}
                    {(!user?.email || !user?.mobile) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 部分信息无法获取</h4>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                {!user?.email && <li>• 邮箱信息：可能是应用未申请邮箱权限，或用户未绑定邮箱</li>}
                                {!user?.mobile && <li>• 手机号：可能是应用未申请手机号权限，或用户未绑定手机</li>}
                            </ul>
                        </div>
                    )}

                    {/* 调试信息 */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">🔧 调试信息</h4>
                        <div className="text-sm space-y-1">
                            <p><strong>Access Token:</strong> {accessToken ? `${accessToken.substring(0, 20)}...` : '无'}</p>
                            <p><strong>完整用户对象:</strong></p>
                            <pre className="bg-white border rounded p-2 text-xs overflow-auto max-h-40">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserInfoDebug;