import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type FeishuAuthConfig } from '@/lib/feishuAuth';
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
    onSuccess?: (code: string) => void;
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

    // 处理直接登录的函数 - 先触发callback再获取用户信息
    const handleDirectLogin = useCallback(async (tmpCode: string, authUrl: string) => {
        try {
            setIsProcessingLogin(true);
            console.log('🚀 开始直接登录流程');
            console.log('临时授权码:', tmpCode);

            // 第一步：使用隐藏iframe触发后端callback接口
            const callbackUrl = `${authUrl}&tmp_code=${tmpCode}`;
            console.log('🔄 使用iframe触发callback:', callbackUrl);

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = callbackUrl;
            document.body.appendChild(iframe);

            // 等待callback处理完成（给后端一些时间处理）
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 清理iframe
            document.body.removeChild(iframe);

            // 第二步：通过state参数获取用户信息
            const storedState = localStorage.getItem('feishu_auth_state');
            console.log('使用的state参数:', storedState);

            const response = await fetch('http://localhost:8080/feishu/user_info?state=' + storedState, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            console.log('后端API响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('后端返回数据:', data);

            if (data.success && data.data) {
                console.log('✅ 登录成功');

                const { user_info, token_info } = data.data;
                console.log('解析后的用户信息:', user_info);
                console.log('解析后的Token信息:', token_info);

                // 存储token信息到本地
                if (token_info) {
                    localStorage.setItem('feishu_access_token', token_info.access_token);
                    localStorage.setItem('feishu_refresh_token', token_info.refresh_token || '');

                    // 计算token过期时间
                    const expiresAt = Date.now() + (token_info.expires_in * 1000);
                    localStorage.setItem('feishu_token_expires_at', expiresAt.toString());
                }

                // 存储用户信息
                if (user_info) {
                    localStorage.setItem('feishu_user_info', JSON.stringify(user_info));
                }

                // 调用成功回调 - 传递用户信息
                onSuccess?.(JSON.stringify(user_info || {}));

            } else {
                throw new Error(data.message || '登录失败');
            }

        } catch (error) {
            console.error('直接登录失败:', error);
            const errorMessage = error instanceof Error ? error.message : '登录过程中发生错误';
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setIsProcessingLogin(false);
        }
    }, [onSuccess, onError]);

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

            // 构建授权URL - 使用传入的配置
            const CLIENT_ID = config.clientId;
            const REDIRECT_URI = "http://localhost:8080/auth/callback";
            const STATE = config.state || 'feishu_qr_' + Date.now();

            // 将state存储到localStorage中，以便后续验证
            localStorage.setItem('feishu_auth_state', STATE);

            // 使用传入的配置构建授权URL
            const authUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${STATE}`;

            console.log('=== 二维码配置信息 ===');
            console.log('客户端ID:', CLIENT_ID);
            console.log('重定向URI:', REDIRECT_URI);
            console.log('重定向URI（编码后）:', encodeURIComponent(REDIRECT_URI));
            console.log('状态参数:', STATE);
            console.log('完整授权URL:', authUrl);
            console.log('======================');
            const uniqueId = `qr-debug-container-${Date.now()}`;
            container.id = uniqueId;

            // 创建QR登录实例 - 使用固定的容器ID
            const qrLoginInstance = window.QRLogin({
                id: uniqueId,  // 使用固定ID，与下面的div id对应
                goto: authUrl,
                width: '260',  // 调整为260x260，给进度条留出空间
                height: '260'
            });

            qrLoginRef.current = qrLoginInstance;

            // 监听扫码消息
            const messageHandler = (event: MessageEvent) => {
                console.log('=== 收到飞书扫码消息 ===');
                console.log('Event origin:', event.origin);
                console.log('Event data:', event.data);
                console.log('QR instance available:', !!qrLoginInstance);

                if (qrLoginInstance.matchOrigin && qrLoginInstance.matchData) {
                    const originMatch = qrLoginInstance.matchOrigin(event.origin);
                    const dataMatch = qrLoginInstance.matchData(event.data);
                    console.log('Origin match:', originMatch);
                    console.log('Data match:', dataMatch);

                    if (originMatch && dataMatch) {
                        console.log('✅ 飞书QR匹配成功');
                        console.log('事件数据:', event.data);

                        const loginTmpCode = event.data.tmp_code;
                        if (loginTmpCode) {
                            console.log('🔑 收到临时授权码:', loginTmpCode);

                            // 🎯 关键修改：先触发callback再获取用户信息
                            handleDirectLogin(loginTmpCode, authUrl);

                        } else {
                            console.error('❌ 未找到tmp_code in event.data:', event.data);
                            setError('获取授权码失败');
                            onError?.('获取授权码失败');
                        }
                    } else {
                        console.log('飞书QR匹配失败，忽略此消息');
                        console.log('期望的Origin匹配:', originMatch);
                        console.log('期望的Data匹配:', dataMatch);
                    }
                } else {
                    console.log('QR instance缺少匹配方法');
                    console.log('matchOrigin存在:', !!qrLoginInstance.matchOrigin);
                    console.log('matchData存在:', !!qrLoginInstance.matchData);
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
    }, [config, handleDirectLogin, onError]);

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
    }, [isSDKLoaded, config, onSuccess, initQRCode]);

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
                                    {isProcessingLogin ? '正在处理登录...' : '加载中...'}
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

