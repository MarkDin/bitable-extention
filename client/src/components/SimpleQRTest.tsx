import React, { useEffect, useState } from 'react';

const SimpleQRTest: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [sdkLoaded, setSdkLoaded] = useState(false);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(`[QR Test] ${message}`);
    };

    useEffect(() => {
        addLog('开始测试飞书QR登录');

        // 检查是否已有SDK
        if (typeof (window as any).QRLogin === 'function') {
            addLog('SDK已存在');
            setSdkLoaded(true);
            return;
        }

        // 加载SDK
        addLog('开始加载飞书SDK');
        const script = document.createElement('script');
        script.src = 'https://lf-package-cn.feishucdn.com/obj/feishu-static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js';
        script.onload = () => {
            addLog('SDK加载成功');
            setSdkLoaded(true);
        };
        script.onerror = () => {
            addLog('SDK加载失败');
        };
        document.head.appendChild(script);

        return () => {
            addLog('组件卸载');
        };
    }, []);

    useEffect(() => {
        if (!sdkLoaded) return;

        addLog('开始初始化二维码');

        try {
            // 配置参数
            const config = {
                app_id: 'cli_a8848b72377ad00e',
                redirect_uri: `${window.location.origin}/auth/callback`,
                state: 'simple_test_' + Date.now()
            };

            addLog(`配置参数: ${JSON.stringify(config)}`);

            // 构建授权URL
            const params = new URLSearchParams(config);
            const authUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?${params.toString()}`;

            addLog(`授权URL: ${authUrl}`);

            // 检查QRLogin函数
            if (typeof (window as any).QRLogin !== 'function') {
                addLog('错误: QRLogin函数不存在');
                return;
            }

            addLog('调用QRLogin函数');

            // 创建二维码
            const qrInstance = (window as any).QRLogin({
                id: 'simple-qr-container',
                goto: authUrl,
                width: '280',
                height: '280'
            });

            addLog('QRLogin调用成功');

            if (qrInstance) {
                addLog('QR实例创建成功');
            } else {
                addLog('QR实例创建失败');
            }

        } catch (error) {
            addLog(`初始化失败: ${error}`);
        }
    }, [sdkLoaded]);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>简单QR登录测试</h1>

            <div style={{ marginBottom: '20px' }}>
                <p>SDK状态: {sdkLoaded ? '✅ 已加载' : '⏳ 加载中'}</p>
            </div>

            {/* 二维码容器 */}
            <div
                id="simple-qr-container"
                style={{
                    width: '300px',
                    height: '300px',
                    border: '1px solid #ccc',
                    margin: '20px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9f9f9'
                }}
            >
                {!sdkLoaded && <div>等待SDK加载...</div>}
            </div>

            {/* 日志 */}
            <div style={{ marginTop: '20px' }}>
                <h3>调试日志:</h3>
                <div
                    style={{
                        backgroundColor: '#000',
                        color: '#0f0',
                        padding: '10px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}
                >
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SimpleQRTest; 