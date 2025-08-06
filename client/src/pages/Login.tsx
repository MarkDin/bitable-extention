import FeishuQRLogin from '@/components/FeishuQRLogin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { isLoginEnabled } from '@/config';
import { useToast } from '@/hooks/use-toast';
import { useFeishuAuth } from '@/hooks/useFeishuAuth';
import { AlertCircle, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// 飞书应用配置
const FEISHU_CONFIG = {
    clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
    redirectUri: import.meta.env.VITE_FEISHU_REDIRECT_URI || 'https://crm-data-service-dk1543100966.replit.app/auth/callback',
};
const Login: React.FC = () => {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    // const [isCallbackRoute] = useRoute('/auth/callback');
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
    // useEffect(() => {
    //     if (isCallbackRoute) {
    //         const handleCallback = async () => {
    //             try {
    //                 console.log('=== 进入OAuth回调处理 ===');
    //                 console.log('当前URL:', window.location);
    //                 console.log('查询参数:', window.location.search);
    //                 console.log('Hash部分:', window.location.hash);

    //                 setLoginStatus('processing');

    //                 const urlParams = new URLSearchParams(window.location.search);
    //                 const code = urlParams.get('code');
    //                 const state = urlParams.get('state');
    //                 const error = urlParams.get('error');

    //                 console.log('提取的参数:');
    //                 console.log('- code:', code);
    //                 console.log('- state:', state);
    //                 console.log('- error:', error);

    //                 if (error) {
    //                     throw new Error(`授权失败: ${error}`);
    //                 }

    //                 if (!code) {
    //                     console.error('❌ 未找到授权码！');
    //                     console.log('所有URL参数:', Object.fromEntries(urlParams.entries()));
    //                     throw new Error('未收到授权码');
    //                 }

    //                 console.log('✅ 成功获取授权码:', code);
    //                 console.log('状态参数:', state);

    //                 // 执行登录（调用后端接口）
    //                 await login(code);

    //                 setLoginStatus('success');

    //                 toast({
    //                     variant: 'default',
    //                     title: "登录成功",
    //                     description: "欢迎使用飞书多维表格数据助手",
    //                 });

    //                 // 登录成功后跳转到用户信息页面
    //                 setTimeout(() => {
    //                     setLocation('/auto-complete');
    //                 }, 1500);

    //             } catch (err) {
    //                 console.error('OAuth回调处理失败:', err);
    //                 const errorMsg = err instanceof Error ? err.message : '登录处理失败';
    //                 setErrorMessage(errorMsg);
    //                 setLoginStatus('error');

    //                 toast({
    //                     variant: 'destructive',
    //                     title: "登录失败",
    //                     description: errorMsg,
    //                 });
    //             }
    //         };

    //         handleCallback();
    //     }
    // }, [login, setLocation, toast]);

    // 如果已经登录或免登录模式，重定向到主页面
    useEffect(() => {
        if (!isLoginEnabled) {
            console.log('免登录模式，直接跳转到主页面');
            setLocation('/auto-complete');
            return;
        }

        if (isAuthenticated) {
            console.log('用户已登录，重定向到主页面');
            setLocation('/auto-complete');
        }
    }, [isAuthenticated, setLocation]);

    // 处理扫码成功（直接登录模式）
    const handleQRSuccess = async (userInfoString: string) => {
        console.log('=== 扫码登录成功！===');
        console.log('用户信息:', userInfoString);

        try {
            const userInfo = JSON.parse(userInfoString);
            console.log('解析后的用户信息:', userInfo);

            // 检查localStorage中的数据
            const storedAccessToken = localStorage.getItem('feishu_access_token');
            const storedUserInfo = localStorage.getItem('feishu_user_info');
            const storedExpires = localStorage.getItem('feishu_token_expires_at');

            console.log('=== localStorage检查 ===');
            console.log('Access Token存在:', !!storedAccessToken);
            console.log('User Info存在:', !!storedUserInfo);
            console.log('Expires存在:', !!storedExpires);
            console.log('当前认证状态:', isAuthenticated);
            console.log('======================');

            setLoginStatus('success');

            toast({
                title: "登录成功",
                description: `欢迎，${userInfo.name}！即将跳转到主页面...`,
            });

            // 优化后的跳转方案：无刷新跳转
            console.log('开始跳转到 /auto-complete...');

            // 短暂延迟，确保localStorage监听器能够检测到变化并更新认证状态
            // setTimeout(() => {
            //     setLocation('/auto-complete');
            // }, 100);

        } catch (error) {
            console.error('解析用户信息失败:', error);
            handleQRError('用户信息解析失败');
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
