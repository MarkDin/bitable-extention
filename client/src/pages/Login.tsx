import FeishuQRLogin from '@/components/FeishuQRLogin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFeishuAuth } from '@/hooks/useFeishuAuth';
import { AlertCircle, CheckCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// 飞书应用配置
const FEISHU_CONFIG = {
    clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
    redirectUri: 'https://crm-data-service-dk1543100966.replit.app/auth/callback', // 后端处理
};

const Login: React.FC = () => {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    const [loginStatus, setLoginStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const {
        isAuthenticated,
        user,
        isLoading,
        error,
        login,
        logout,
        clearError
    } = useFeishuAuth(FEISHU_CONFIG);

    // 如果已经登录，重定向到主页面
    useEffect(() => {
        if (isAuthenticated) {
            console.log('用户已登录，重定向到主页面');
            setLocation('/auto-complete');
        }
    }, [isAuthenticated, setLocation]);

    // 处理扫码成功
    const handleQRSuccess = async (userInfo: any) => {
        try {
            console.log('=== 扫码登录成功 ===');
            console.log('用户信息:', userInfo);

            setLoginStatus('success');

            toast({
                variant: 'default',
                title: "登录成功",
                description: `欢迎使用，${userInfo.name}！`,
            });

            // 登录成功后跳转到主页面
            setTimeout(() => {
                setLocation('/auto-complete');
            }, 1500);

        } catch (err) {
            console.error('处理登录成功失败:', err);
            const errorMsg = err instanceof Error ? err.message : '登录处理失败';
            setErrorMessage(errorMsg);
            setLoginStatus('error');

            toast({
                variant: 'destructive',
                title: "登录失败",
                description: errorMsg,
            });
        }
    };

    // 处理扫码错误
    const handleQRError = (error: string) => {
        console.error('扫码登录错误:', error);
        setErrorMessage(error);
        setLoginStatus('error');

        toast({
            variant: 'destructive',
            title: "登录失败",
            description: error,
        });
    };

    // 重试登录
    const handleRetry = () => {
        setLoginStatus('idle');
        setErrorMessage('');
        clearError();
        // 清理localStorage中的state
        localStorage.removeItem('feishu_auth_state');
        console.log('✅ 已清理登录状态，准备重新开始登录流程');
    };

    // 主登录页面
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-6">
                {/* 应用标题 */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        多维表格数据助手
                    </h1>
                    <p className="text-gray-600">
                        使用飞书账号登录以开始使用
                    </p>
                </div>

                {/* 错误提示 */}
                {(error || errorMessage) && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || errorMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {/* 登录成功提示 */}
                {loginStatus === 'success' && (
                    <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription>
                            登录成功！正在跳转到主页面...
                        </AlertDescription>
                    </Alert>
                )}

                {/* 扫码登录组件 */}
                {loginStatus === 'idle' && (
                    <FeishuQRLogin
                        config={FEISHU_CONFIG}
                        onSuccess={handleQRSuccess}
                        onError={handleQRError}
                    />
                )}

                {/* 重试按钮 */}
                {loginStatus === 'error' && (
                    <div className="text-center">
                        <Button onClick={handleRetry} variant="outline" className="w-full">
                            重试登录
                        </Button>
                    </div>
                )}

                {/* 配置提示 */}
                {FEISHU_CONFIG.clientId === 'YOUR_CLIENT_ID' && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            请配置飞书应用的CLIENT_ID。
                            <br />
                            在环境变量中设置 VITE_FEISHU_CLIENT_ID。
                        </AlertDescription>
                    </Alert>
                )}

                {/* 帮助信息 */}
                <div className="text-center text-sm text-gray-500">
                    <p>
                        没有飞书账号？
                        <a
                            href="https://www.feishu.cn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline ml-1"
                        >
                            立即注册
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login; 