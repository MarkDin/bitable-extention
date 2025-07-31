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

            // 构建授权URL - 重定向到前端获取code
            const CLIENT_ID = config.clientId;
            const REDIRECT_URI = encodeURIComponent(window.location.origin + '/#/auth/callback');
            const STATE = config.state || 'feishu_qr_' + Date.now();

            // 将state存储到localStorage中，以便后续验证
            localStorage.setItem('feishu_auth_state', STATE);

            // 使用前端回调地址获取code
            const authUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${STATE}`;

            console.log('=== 二维码配置信息 ===');
            console.log('客户端ID:', CLIENT_ID);
            console.log('重定向URI（编码前）:', window.location.origin + '/#/auth/callback');
            console.log('重定向URI（编码后）:', REDIRECT_URI);
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

                            // 根据官方文档，需要手动重定向到授权URL + tmp_code
                            const redirectUrl = `${authUrl}&tmp_code=${loginTmpCode}`;
                            console.log('🔄 准备重定向到:', redirectUrl);

                            // 执行重定向，这会触发飞书服务器返回302重定向到我们的callback
                            window.location.href = redirectUrl;
                        } else {
                            console.error('❌ 未找到tmp_code in event.data:', event.data);
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
    }, [config, onSuccess]);

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
        if (isLoading) return; // 防止重复点击

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
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="text-sm text-gray-600">加载中...</span>
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
                        disabled={isLoading}
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

