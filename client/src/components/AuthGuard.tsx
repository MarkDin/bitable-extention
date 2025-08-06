import { isLoginEnabled } from '@/config';
import { useFeishuAuth } from '@/hooks/useFeishuAuth';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { useLocation } from 'wouter';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean; // 是否需要认证
    redirectTo?: string;   // 未认证时重定向到的路径
}

const FEISHU_CONFIG = {
    clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
    redirectUri: import.meta.env.VITE_FEISHU_REDIRECT_URI || window.location.origin + '/#/auth/callback',
};

/**
 * 认证守卫组件
 * 自动检查用户登录状态，提供路由保护和免登录功能
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    requireAuth = true,
    redirectTo = '/login'
}) => {
    const [, setLocation] = useLocation();
    const { isAuthenticated, isLoading, user } = useFeishuAuth(FEISHU_CONFIG);

    // 如果正在加载认证状态，显示加载动画
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-gray-600">检查登录状态...</p>
                </div>
            </div>
        );
    }

    // 如果启用了登录功能，则检查认证状态
    if (isLoginEnabled) {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-gray-600">检查登录状态...</p>
                    </div>
                </div>
            );
        }

        if (requireAuth && !isAuthenticated) {
            console.log('用户未登录，重定向到登录页面');
            setLocation(redirectTo);
            return null;
        }
    }

    // 如果不需要认证或者用户已登录，渲染子组件
    return <>{children}</>;
};

export default AuthGuard;

/**
 * 免登录状态指示器组件
 * 显示当前登录状态和用户信息
 */
export const LoginStatusIndicator: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useFeishuAuth({
        clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
        redirectUri: import.meta.env.VITE_FEISHU_REDIRECT_URI || window.location.origin + '/#/auth/callback',
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>检查登录状态...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>未登录</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm text-green-600">
            {/* <div className="w-2 h-2 rounded-full bg-green-500"></div> */}
            {/* <span>已登录: {user?.name || user?.en_name || '用户'}</span> */}
        </div>
    );
};
