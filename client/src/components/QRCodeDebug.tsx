import React, { useCallback, useEffect, useRef, useState } from 'react';

// 声明全局QRLogin类型
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

declare global {
    interface Window {
        QRLogin: (config: QRLoginConfig) => QRLoginInstance;
    }
}

const QRCodeDebug: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const qrInstanceRef = useRef<QRLoginInstance | null>(null);
    const mountedRef = useRef(true);
    const [logs, setLogs] = useState<string[]>([]);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [qrCreated, setQrCreated] = useState(false);
    const [cspErrors, setCspErrors] = useState<string[]>([]);
    const [key, setKey] = useState(0); // 用于强制重新渲染

    const addLog = useCallback((message: string) => {
        if (!mountedRef.current) return;
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(`[QR Debug] ${message}`);
    }, []);

    const addCspError = (error: string) => {
        setCspErrors(prev => [...prev, error]);
        addLog(`CSP错误: ${error}`);
    };

    // 监听CSP违规报告和DOM错误
    useEffect(() => {
        const handleSecurityPolicyViolation = (e: SecurityPolicyViolationEvent) => {
            addCspError(`违规指令: ${e.violatedDirective}, 阻止的URI: ${e.blockedURI}`);
        };

        // 监听全局错误
        const handleGlobalError = (e: ErrorEvent) => {
            const message = e.message || e.error?.message || '未知错误';
            if (message.includes('removeChild') || message.includes('appendChild') || message.includes('DOM')) {
                addLog(`DOM错误: ${message}`);
                addLog(`错误文件: ${e.filename}:${e.lineno}`);
            }
        };

        // 监听未处理的Promise拒绝
        const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
            const message = e.reason?.message || e.reason || '未知Promise错误';
            if (typeof message === 'string' && (message.includes('removeChild') || message.includes('DOM'))) {
                addLog(`Promise DOM错误: ${message}`);
            }
        };

        // 监听控制台错误，捕获CSP相关错误
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const message = args.join(' ');
            if (message.includes('Content Security Policy') || message.includes('CSP')) {
                addCspError(message);
            } else if (message.includes('removeChild') || message.includes('appendChild')) {
                addLog(`控制台DOM错误: ${message}`);
            }
            originalConsoleError.apply(console, args);
        };

        document.addEventListener('securitypolicyviolation', handleSecurityPolicyViolation);
        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            document.removeEventListener('securitypolicyviolation', handleSecurityPolicyViolation);
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            console.error = originalConsoleError;
        };
    }, []);

    // 检查网络连接
    const checkNetwork = async () => {
        try {
            const response = await fetch('https://passport.feishu.cn/suite/passport/oauth/authorize', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            addLog('飞书服务器连接正常');
        } catch (error) {
            addLog(`网络连接检查失败: ${error}`);
        }
    };

    // 检查CSP设置
    const checkCSP = () => {
        const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
        if (metaTags.length > 0) {
            metaTags.forEach((tag, index) => {
                const content = tag.getAttribute('content');
                addLog(`发现CSP meta标签 ${index + 1}: ${content?.substring(0, 100)}...`);
            });
        } else {
            addLog('未发现CSP meta标签');
        }

        // 检查HTTP头中的CSP
        addLog('检查HTTP响应头中的CSP设置...');
    };

    // 加载SDK
    useEffect(() => {
        addLog('开始二维码调试');
        checkNetwork();
        checkCSP();

        // 检查是否已有SDK
        if (typeof window.QRLogin === 'function') {
            addLog('SDK已存在');
            setSdkLoaded(true);
            return;
        }

        // 检查是否已有script标签
        const existingScript = document.querySelector('script[src*="LarkSSOSDKWebQRCode"]');
        if (existingScript) {
            addLog('发现已存在的SDK script标签');
            existingScript.addEventListener('load', () => {
                addLog('已存在的SDK加载完成');
                setSdkLoaded(true);
            });
            return;
        }

        // 加载SDK
        addLog('开始加载飞书QR SDK');
        const script = document.createElement('script');
        script.src = 'https://lf-package-cn.feishucdn.com/obj/feishu-static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js';
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
            addLog('SDK加载成功');
            addLog(`QRLogin函数类型: ${typeof window.QRLogin}`);
            setSdkLoaded(true);
        };

        script.onerror = (e) => {
            addLog(`SDK加载失败: ${e}`);
            addLog('尝试使用备用CDN');

            // 尝试备用CDN
            const backupScript = document.createElement('script');
            backupScript.src = 'https://sf3-cn.feishucdn.com/obj/feishu-static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js';
            backupScript.async = true;
            backupScript.onload = () => {
                addLog('备用SDK加载成功');
                setSdkLoaded(true);
            };
            backupScript.onerror = () => {
                addLog('备用SDK也加载失败');
            };
            document.head.appendChild(backupScript);
        };

        document.head.appendChild(script);
    }, []);

    // 安全清理容器的函数
    const safeCleanContainer = (container: HTMLElement) => {
        try {
            // 方法1: 尝试逐个移除子节点
            const children = Array.from(container.children);
            children.forEach(child => {
                try {
                    if (child.parentNode === container) {
                        container.removeChild(child);
                    }
                } catch (e) {
                    addLog(`移除子节点失败: ${e}`);
                }
            });
            addLog('使用removeChild清理容器成功');
        } catch (e) {
            try {
                // 方法2: 使用innerHTML清空
                container.innerHTML = '';
                addLog('使用innerHTML清理容器成功');
            } catch (e2) {
                try {
                    // 方法3: 使用textContent清空
                    container.textContent = '';
                    addLog('使用textContent清理容器成功');
                } catch (e3) {
                    addLog(`所有清理方法都失败: ${e3}`);
                }
            }
        }
    };

    // 创建二维码
    useEffect(() => {
        if (!sdkLoaded || !containerRef.current) return;

        addLog('开始创建二维码');

        const createQR = async () => {
            try {
                // 清空容器
                const container = containerRef.current;
                if (!container) return;

                // 使用安全的清理方法
                safeCleanContainer(container);
                addLog('容器已安全清空');

                // 等待一帧确保DOM更新完成
                await new Promise(resolve => requestAnimationFrame(resolve));

                // 配置参数 - 使用旧版登录流程的参数格式
                const config = {
                    client_id: 'cli_a8848b72377ad00e',  // 注意：旧版使用client_id而不是app_id
                    redirect_uri: 'https://bitable-extention-dk1543100966.replit.app/auth/callback',
                    response_type: 'code',  // 旧版必须包含response_type
                    state: 'debug_' + Date.now()
                };

                addLog(`配置: ${JSON.stringify(config)}`);

                // 构建授权URL - 使用旧版登录流程地址
                const params = new URLSearchParams(config);
                const authUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?${params.toString()}`;

                addLog(`授权URL: ${authUrl}`);

                // 检查QRLogin函数
                if (typeof window.QRLogin !== 'function') {
                    addLog('错误: QRLogin函数不存在');
                    return;
                }

                addLog('调用QRLogin函数');

                // 创建一个唯一的容器ID，避免冲突
                const uniqueId = `qr-debug-container-${Date.now()}`;
                container.id = uniqueId;

                // 确保容器在DOM中
                addLog(`容器ID: ${uniqueId}`);
                addLog(`容器是否在DOM中: ${document.getElementById(uniqueId) !== null}`);

                // 创建二维码 - 使用字符串类型的宽高
                const qrInstance = window.QRLogin({
                    id: uniqueId,
                    goto: authUrl,
                    width: '250',  // 固定尺寸250x250
                    height: '250'
                });

                // 再次检查容器
                setTimeout(() => {
                    const checkContainer = document.getElementById(uniqueId);
                    if (checkContainer) {
                        addLog(`QRLogin后容器存在，子元素数量: ${checkContainer.children.length}`);
                    } else {
                        addLog('错误：QRLogin后容器不存在！');
                    }
                }, 100);

                qrInstanceRef.current = qrInstance;
                addLog('QRLogin调用完成');

                if (qrInstance) {
                    addLog('QR实例创建成功');
                    setQrCreated(true);

                    // 检查容器内容
                    setTimeout(() => {
                        const container = containerRef.current;
                        if (container) {
                            addLog(`容器子元素数量: ${container.children.length}`);
                            addLog(`容器innerHTML长度: ${container.innerHTML.length}`);
                            if (container.innerHTML.length > 0) {
                                addLog('容器有内容，二维码应该已显示');
                            } else {
                                addLog('容器为空，二维码未生成');
                            }
                        }
                    }, 3000);
                } else {
                    addLog('QR实例创建失败');
                }

            } catch (error) {
                addLog(`创建二维码失败: ${error}`);
                // 捕获并记录具体的错误信息
                if (error instanceof Error) {
                    addLog(`错误详情: ${error.message}`);
                    addLog(`错误堆栈: ${error.stack?.substring(0, 200)}...`);
                }
            }
        };

        createQR();

        // 清理函数
        return () => {
            qrInstanceRef.current = null;
            const container = containerRef.current;
            if (container) {
                try {
                    safeCleanContainer(container);
                    addLog('组件卸载，容器已安全清理');
                } catch (e) {
                    addLog(`清理时出错: ${e}`);
                }
            }
        };
    }, [sdkLoaded]);

    // 组件卸载时的清理
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            addLog('组件即将卸载');
        };
    }, [addLog]);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>二维码调试工具</h1>

            <div style={{ display: 'flex', gap: '20px' }}>
                {/* 左侧：二维码区域 */}
                <div style={{ flex: '1' }}>
                    <h3>二维码显示区域</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <p>SDK状态: {sdkLoaded ? '✅ 已加载' : '⏳ 加载中'}</p>
                        <p>二维码状态: {qrCreated ? '✅ 已创建' : '❌ 未创建'}</p>
                        <p>CSP错误数量: {cspErrors.length > 0 ? `❌ ${cspErrors.length}个` : '✅ 无'}</p>
                    </div>

                    <div
                        style={{
                            width: '300px',
                            height: '300px',
                            border: '2px solid #007bff',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* React管理的状态显示层 */}
                        {!sdkLoaded && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                color: '#666',
                                backgroundColor: '#f8f9fa',
                                zIndex: 10
                            }}>
                                <div>
                                    <div>⏳</div>
                                    <div>加载SDK中...</div>
                                </div>
                            </div>
                        )}
                        {sdkLoaded && !qrCreated && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                color: '#666',
                                backgroundColor: '#f8f9fa',
                                zIndex: 10
                            }}>
                                <div>
                                    <div>🔄</div>
                                    <div>生成二维码中...</div>
                                </div>
                            </div>
                        )}

                        {/* 独立的QR容器，React不管理其内容 */}
                        <div
                            ref={containerRef}
                            key={key}
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 5
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            重新加载页面
                        </button>

                        <button
                            onClick={() => {
                                if (containerRef.current) {
                                    try {
                                        // 安全重置
                                        safeCleanContainer(containerRef.current);
                                        setQrCreated(false);
                                        qrInstanceRef.current = null;
                                        addLog('手动重置二维码');

                                        // 延迟重新创建，确保清理完成
                                        setTimeout(() => {
                                            if (sdkLoaded && containerRef.current) {
                                                addLog('开始重新创建二维码...');
                                                // 触发重新创建
                                                setSdkLoaded(false);
                                                setTimeout(() => setSdkLoaded(true), 100);
                                            }
                                        }, 500);
                                    } catch (e) {
                                        addLog(`重置失败: ${e}`);
                                    }
                                }
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                            disabled={!sdkLoaded}
                        >
                            重新生成二维码
                        </button>

                        <button
                            onClick={() => {
                                // 完全重置状态
                                setLogs([]);
                                setCspErrors([]);
                                setQrCreated(false);
                                setSdkLoaded(false);
                                qrInstanceRef.current = null;

                                if (containerRef.current) {
                                    safeCleanContainer(containerRef.current);
                                }

                                // 强制重新渲染容器
                                setKey(prev => prev + 1);

                                addLog('完全重置，重新开始...');

                                // 重新触发SDK加载
                                setTimeout(() => {
                                    if (typeof window.QRLogin === 'function') {
                                        setSdkLoaded(true);
                                    }
                                }, 1000);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#ffc107',
                                color: '#000',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            完全重置
                        </button>

                        <button
                            onClick={() => {
                                // 强制重新渲染容器，避免DOM冲突
                                setKey(prev => prev + 1);
                                setQrCreated(false);
                                qrInstanceRef.current = null;
                                addLog('强制重新渲染容器');

                                setTimeout(() => {
                                    if (sdkLoaded) {
                                        addLog('重新触发二维码创建');
                                    }
                                }, 100);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                            disabled={!sdkLoaded}
                        >
                            重新渲染
                        </button>
                    </div>
                </div>

                {/* 中间：CSP错误 */}
                {cspErrors.length > 0 && (
                    <div style={{ flex: '1' }}>
                        <h3>CSP违规错误</h3>
                        <div
                            style={{
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                padding: '10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                height: '200px',
                                overflowY: 'auto'
                            }}
                        >
                            {cspErrors.map((error, index) => (
                                <div key={index} style={{ marginBottom: '5px', color: '#856404' }}>
                                    {error}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
                            <strong>解决方案：</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
                                <li>CSP阻止了Web Worker的创建</li>
                                <li>需要在CSP中添加 worker-src 'self' data: blob:</li>
                                <li>或者修改 script-src 以允许 data: URI</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 右侧：调试日志 */}
                <div style={{ flex: '1' }}>
                    <h3>调试日志</h3>
                    <div
                        style={{
                            backgroundColor: '#000',
                            color: '#0f0',
                            padding: '10px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            height: '400px',
                            overflowY: 'auto',
                            borderRadius: '4px'
                        }}
                    >
                        {logs.map((log, index) => (
                            <div key={index}>{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeDebug; 