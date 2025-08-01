import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type FeishuAuthConfig, buildAuthUrl, getUserInfoByState, storeAuthInfo } from '@/lib/feishuAuth';
import { Loader2, QrCode, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// 声明全局QRLogin类型
declare global {
    interface Window {
        QRLogin: (config: QRLoginConfig) => QRLoginInstance;
    }
}

interface QRLoginConfig {
    id: string;
    goto: string;
    width?: string;
    height?: string;
    style?: string;
}

interface QRLoginInstance {
    matchOrigin: (origin: string) => boolean;
    matchData: (data: any) => boolean;
}

interface FeishuQRLoginProps {
    config: FeishuAuthConfig;
    onSuccess?: (userInfo: any) => void;
    onError?: (error: string) => void;
    className?: string;
}

const FeishuQRLogin: React.FC<FeishuQRLoginProps> = ({
    config,
    onSuccess,
    onError,
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const qrLoginRef = useRef<QRLoginInstance | null>(null);
    const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    const [isProcessingLogin, setIsProcessingLogin] = useState(false);

    // 加载飞书QR SDK
    useEffect(() => {
        const loadSDK = () => {
            // 检查SDK是否已经加载
            if (typeof window.QRLogin === 'function') {
                setIsSDKLoaded(true);
                return;
            }

            // 检查是否已经有script标签
            const existingScript = document.querySelector('script[src*="LarkSSOSDKWebQRCode"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => setIsSDKLoaded(true));
                return;
            }

            // 创建script标签加载SDK
            const script = document.createElement('script');
            script.src = 'https://lf-package-cn.feishucdn.com/obj/feishu-static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js';
            script.async = true;
            script.onload = () => {
                setIsSDKLoaded(true);
            };
            script.onerror = () => {
                setError('加载飞书SDK失败，请检查网络连接');
                setIsLoading(false);
            };
            document.head.appendChild(script);
        };

        loadSDK();
    }, []);

    // 处理扫码成功
    const handleScanSuccess = async (tmpCode: string, state: string) => {
        try {
            setIsProcessingLogin(true);
            console.log('=== 开始处理扫码登录 ===');
            console.log('临时授权码:', tmpCode);
            console.log('状态参数:', state);

            // 构建完整的重定向URL，让飞书服务器处理并重定向到后端
            const authUrl = buildAuthUrl(config);
            const finalUrl = `${authUrl}&tmp_code=${tmpCode}`;

            console.log('🔄 使用隐藏iframe触发后端处理:', finalUrl);

            // 使用隐藏iframe触发飞书服务器处理，避免当前页面跳转
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = finalUrl;
            document.body.appendChild(iframe);

            // 等待一小段时间让iframe加载并触发重定向到后端
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 清理iframe
            try {
                document.body.removeChild(iframe);
            } catch (e) {
                console.warn('清理iframe失败:', e);
            }

            // 轮询后端接口获取用户信息，等待后端处理完成
            console.log('📡 开始轮询后端接口获取用户信息...');
            let retryCount = 0;
            const maxRetries = 15; // 最多重试15次，每次间隔2秒，总共30秒
            let userInfoResult = null;

            while (retryCount < maxRetries) {
                try {
                    console.log(`📡 第${retryCount + 1}次尝试获取用户信息，state: ${state}`);
                    userInfoResult = await getUserInfoByState(state);
                    console.log('✅ 成功获取用户信息');
                    break;
                } catch (err) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        throw new Error('获取用户信息超时，请重试登录');
                    }

                    console.log(`⏳ 第${retryCount}次获取失败，2秒后重试...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            if (!userInfoResult) {
                throw new Error('无法获取用户信息，请重试登录');
            }

            const { userInfo, tokenData } = userInfoResult;

            // 存储认证信息
            storeAuthInfo(tokenData, userInfo);

            console.log('✅ 登录成功');
            onSuccess?.(userInfo);

        } catch (err) {
            console.error('❌ 扫码登录处理失败:', err);
            const errorMsg = err instanceof Error ? err.message : '登录处理失败';
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setIsProcessingLogin(false);
        }
    };

    // 初始化二维码函数
    const initQRCode = useCallback(() => {
        try {
            setIsLoading(true);
            setError('');

            // 安全地清空容器
            const container = containerRef.current;
            if (!container) {
                console.warn('容器不存在');
                setIsLoading(false);
                return;
            }

            // 使用innerHTML清空容器，避免removeChild错误
            container.innerHTML = '';

            // 构建授权URL - 现在重定向到后端
            const authUrl = buildAuthUrl(config);
            const state = localStorage.getItem('feishu_auth_state') || '';

            console.log('=== 二维码配置信息 ===');
            console.log('客户端ID:', config.clientId);
            console.log('重定向URI:', '后端处理 /auth/callback');
            console.log('状态参数:', state);
            console.log('完整授权URL:', authUrl);
            console.log('======================');

            const uniqueId = `qr-debug-container-${Date.now()}`;
            container.id = uniqueId;

            // 创建QR登录实例
            const qrLoginInstance = window.QRLogin({
                id: uniqueId,
                goto: authUrl,
                width: '260',
                height: '260'
            });

            qrLoginRef.current = qrLoginInstance;

            // 监听扫码消息
            const messageHandler = (event: MessageEvent) => {
                console.log('=== 收到飞书扫码消息 ===');
                console.log('Event origin:', event.origin);
                console.log('Event data:', event.data);

                if (qrLoginInstance.matchOrigin && qrLoginInstance.matchData) {
                    const originMatch = qrLoginInstance.matchOrigin(event.origin);
                    const dataMatch = qrLoginInstance.matchData(event.data);
                    console.log('Origin match:', originMatch);
                    console.log('Data match:', dataMatch);

                    if (originMatch && dataMatch) {
                        console.log('✅ 飞书QR匹配成功');

                        const loginTmpCode = event.data.tmp_code;
                        if (loginTmpCode) {
                            console.log('🔑 收到临时授权码:', loginTmpCode);
                            // 处理扫码成功，传入状态参数
                            handleScanSuccess(loginTmpCode, state);
                        } else {
                            console.error('❌ 未找到tmp_code in event.data:', event.data);
                        }
                    }
                }
            };

            // 存储消息处理器引用
            messageHandlerRef.current = messageHandler;

            // 添加消息监听器
            window.addEventListener('message', messageHandler);

            setIsLoading(false);

        } catch (err) {
            console.error('初始化二维码失败:', err);
            setError('初始化二维码失败，请重试');
            setIsLoading(false);
        }
    }, [config, onSuccess, onError]);

    // 初始化二维码
    useEffect(() => {
        if (!isSDKLoaded || !containerRef.current) return;

        initQRCode();

        // 清理函数
        return () => {
            const messageHandler = messageHandlerRef.current;
            if (messageHandler) {
                window.removeEventListener('message', messageHandler);
                messageHandlerRef.current = null;
            }
            // 安全地清理容器
            const container = containerRef.current;
            if (container) {
                try {
                    container.innerHTML = '';
                } catch (e) {
                    console.warn('清理容器时出错:', e);
                }
            }
        };
    }, [isSDKLoaded, initQRCode]);

    // 刷新二维码
    const refreshQRCode = () => {
        if (isLoading || isProcessingLogin) return; // 防止重复点击

        setIsLoading(true);
        setError('');

        // 清理当前的消息监听器
        const currentHandler = messageHandlerRef.current;
        if (currentHandler) {
            window.removeEventListener('message', currentHandler);
            messageHandlerRef.current = null;
        }

        // 安全地清空容器
        const container = containerRef.current;
        if (container) {
            try {
                container.innerHTML = '';
                // 重新初始化
                setTimeout(() => initQRCode(), 100);
            } catch (e) {
                console.warn('清理容器时出错:', e);
                setIsLoading(false);
            }
        }
    };

    return (
        <Card className={`w-full max-w-md mx-auto ${className}`}>
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" />
                    飞书扫码登录
                </CardTitle>
                <CardDescription>
                    请使用飞书App扫描下方二维码完成登录
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="relative">
                    {(isLoading || isProcessingLogin) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="text-sm text-gray-600">
                                    {isProcessingLogin ? '正在登录...' : '加载中...'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div
                        ref={containerRef}
                        id="feishu-qr-container"
                        className="h-[300px] w-full flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden"
                        style={{
                            minHeight: '300px',
                            maxHeight: '300px'
                        }}
                    >
                        {!isSDKLoaded && !error && (
                            <div className="text-center text-gray-500">
                                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>正在加载二维码...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshQRCode}
                        disabled={isLoading || isProcessingLogin}
                        className="w-full"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        刷新二维码
                    </Button>

                    <p className="text-xs text-gray-500">
                        二维码5分钟内有效，过期请刷新
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default FeishuQRLogin;

