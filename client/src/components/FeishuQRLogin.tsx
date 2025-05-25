import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildAuthUrl, type FeishuAuthConfig } from '@/lib/feishuAuth';
import { Loader2, QrCode, RefreshCw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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

    // 初始化二维码
    useEffect(() => {
        if (!isSDKLoaded || !containerRef.current) return;

        const initQRCode = () => {
            try {
                setIsLoading(true);
                setError('');

                // 清空容器
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                }

                // 构建授权URL
                const authUrl = buildAuthUrl(config);

                // 创建QR登录实例
                const qrLoginInstance = window.QRLogin({
                    id: 'feishu-qr-container',
                    goto: authUrl,
                    width: '300',
                    height: '300',
                    style: 'width:300px;height:350px;display:flex;align-items:center;justify-content:center;'
                });

                qrLoginRef.current = qrLoginInstance;

                // 监听扫码消息
                const handleMessage = (event: MessageEvent) => {
                    if (qrLoginInstance.matchOrigin(event.origin) && qrLoginInstance.matchData(event.data)) {
                        const loginTmpCode = event.data.tmp_code;
                        if (loginTmpCode) {
                            // 构建完整的重定向URL
                            const redirectUrl = `${authUrl}&tmp_code=${loginTmpCode}`;

                            // 提取code参数（这里需要根据实际的重定向逻辑调整）
                            // 在实际应用中，这个code会通过重定向URL返回
                            if (onSuccess) {
                                onSuccess(loginTmpCode);
                            }
                        }
                    }
                };

                // 添加消息监听器
                window.addEventListener('message', handleMessage);

                setIsLoading(false);

                // 清理函数
                return () => {
                    window.removeEventListener('message', handleMessage);
                };
            } catch (err) {
                console.error('初始化二维码失败:', err);
                setError('初始化二维码失败，请重试');
                setIsLoading(false);
            }
        };

        const cleanup = initQRCode();
        return cleanup;
    }, [isSDKLoaded, config, onSuccess]);

    // 刷新二维码
    const refreshQRCode = () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        setIsLoading(true);
        setError('');

        // 触发重新初始化
        setTimeout(() => {
            if (isSDKLoaded) {
                // 重新初始化逻辑会在useEffect中执行
            }
        }, 100);
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
                        className="min-h-[300px] flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50"
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