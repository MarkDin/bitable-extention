import FeishuQRLogin from '@/components/FeishuQRLogin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFeishuAuth } from '@/hooks/useFeishuAuth';
import { validateState } from '@/lib/feishuAuth';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';

// 飞书应用配置
const FEISHU_CONFIG = {
    clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
    redirectUri: import.meta.env.VITE_FEISHU_REDIRECT_URI || `${window.location.origin}/auth/callback`
};

const Login: React.FC = () => {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    const [isCallbackRoute] = useRoute('/auth/callback');
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

    // 处理OAuth回调
    useEffect(() => {
        if (isCallbackRoute) {
            const handleCallback = async () => {
                try {
                    setLoginStatus('processing');

                    const urlParams = new URLSearchParams(window.location.search);
                    const code = urlParams.get('code');
                    const state = urlParams.get('state');
                    const error = urlParams.get('error');

                    if (error) {
                        throw new Error(`授权失败: ${error}`);
                    }

                    if (!code) {
                        throw new Error('未收到授权码');
                    }

                    if (!state || !validateState(state)) {
                        throw new Error('状态验证失败，可能存在安全风险');
                    }

                    // 执行登录
                    await login(code);

                    setLoginStatus('success');

                    toast({
                        variant: 'default',
                        title: "登录成功",
                        description: "欢迎使用飞书多维表格数据助手",
                    });

                    // 登录成功后跳转到主页
                    setTimeout(() => {
                        setLocation('/');
                    }, 1500);

                } catch (err) {
                    console.error('OAuth回调处理失败:', err);
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

            handleCallback();
        }
    }, [isCallbackRoute, login, setLocation, toast]);

    // 如果已经登录，重定向到主页
    useEffect(() => {
        if (isAuthenticated && !isCallbackRoute) {
            setLocation('/');
        }
    }, [isAuthenticated, isCallbackRoute, setLocation]);

    // 处理扫码成功
    const handleQRSuccess = async (tmpCode: string) => {
        try {
            setLoginStatus('processing');

            // 获取存储的state，如果没有则生成一个
            let state = localStorage.getItem('feishu_auth_state');
            if (!state) {
                state = 'feishu_qr_' + Date.now();
                localStorage.setItem('feishu_auth_state', state);
            }

            // 构建重定向URL - 将tmp_code作为code参数传递
            const redirectUrl = `${FEISHU_CONFIG.redirectUri}?code=${tmpCode}&state=${state}`;

            console.log('扫码成功，重定向到:', redirectUrl);
            console.log('使用的state:', state);

            // 重定向到回调处理
            window.location.href = redirectUrl;

        } catch (err) {
            console.error('处理扫码结果失败:', err);
            const errorMsg = err instanceof Error ? err.message : '扫码登录失败';
            setErrorMessage(errorMsg);
            setLoginStatus('error');
        }
    };

    // 处理扫码错误
    const handleQRError = (error: string) => {
        setErrorMessage(error);
        setLoginStatus('error');
    };

    // 重试登录
    const handleRetry = () => {
        setLoginStatus('idle');
        setErrorMessage('');
        clearError();
    };

    // 如果是回调路由，显示处理状态
    if (isCallbackRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>处理登录信息</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        {loginStatus === 'processing' && (
                            <div className="space-y-4">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
                                <p className="text-gray-600">正在处理登录信息...</p>
                            </div>
                        )}

                        {loginStatus === 'success' && (
                            <div className="space-y-4">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                                <div>
                                    <p className="text-green-600 font-medium">登录成功！</p>
                                    <p className="text-sm text-gray-500 mt-1">正在跳转到主页...</p>
                                </div>
                            </div>
                        )}

                        {loginStatus === 'error' && (
                            <div className="space-y-4">
                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                                <div>
                                    <p className="text-red-600 font-medium">登录失败</p>
                                    <p className="text-sm text-gray-500 mt-1">{errorMessage}</p>
                                </div>
                                <Button onClick={() => setLocation('/login')} className="w-full">
                                    返回登录页
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 主登录页面
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-6">
                {/* 应用标题 */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        飞书多维表格数据助手
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

                {/* 登录状态提示 */}
                {loginStatus === 'processing' && (
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                            正在处理登录请求...
                        </AlertDescription>
                    </Alert>
                )}

                {/* 扫码登录组件 */}
                {loginStatus !== 'processing' && (
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
                            请配置飞书应用的CLIENT_ID和REDIRECT_URI。
                            <br />
                            在环境变量中设置 VITE_FEISHU_CLIENT_ID 和 VITE_FEISHU_REDIRECT_URI。
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