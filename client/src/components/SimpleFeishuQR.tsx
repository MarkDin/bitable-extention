import React, { useEffect } from 'react';

// 使用模块作用域的类型声明，避免与其他组件冲突
interface SimpleQRLoginConfig {
    id: string;
    goto: string;
    width: string;
    height: string;
    style?: string;
}

const SimpleFeishuQR: React.FC = () => {
    useEffect(() => {
        // 检查SDK是否已加载
        if (typeof (window as any).QRLogin !== 'function') {
            console.log('QRLogin未加载，开始加载SDK...');

            // 动态加载SDK
            const script = document.createElement('script');
            script.src = 'https://lf-package-cn.feishucdn.com/obj/feishu-static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js';
            script.onload = () => {
                console.log('SDK加载成功');
                createQRCode();
            };
            script.onerror = () => {
                console.error('SDK加载失败');
            };
            document.head.appendChild(script);
        } else {
            console.log('QRLogin已存在，直接创建二维码');
            createQRCode();
        }
    }, []);

    const createQRCode = () => {
        if (typeof (window as any).QRLogin !== 'function') {
            console.error('QRLogin函数不存在');
            return;
        }

        // 严格按照文档格式构建授权URL
        const CLIENT_ID = 'cli_a8848b72377ad00e';
        const REDIRECT_URI = encodeURIComponent('https://bitable-extention-dk1543100966.replit.app/auth/callback');
        const STATE = 'simple_test_' + Date.now();

        // 使用旧版登录流程地址
        const authUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${STATE}`;

        console.log('授权URL:', authUrl);

        try {
            // 创建二维码
            const qrInstance = (window as any).QRLogin({
                id: 'simple-qr-container',  // 对应下面div的id
                goto: authUrl,
                width: '250',
                height: '250'
            } as SimpleQRLoginConfig);

            console.log('QRLogin调用完成', qrInstance);
        } catch (error) {
            console.error('创建二维码失败:', error);
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>简单飞书二维码测试</h2>
            <p>严格按照飞书文档实现</p>

            {/* 二维码容器 - 必须有id属性 */}
            <div
                id="simple-qr-container"
                style={{
                    width: '300px',
                    height: '300px',
                    margin: '20px auto',
                    border: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <div style={{ color: '#999' }}>二维码加载中...</div>
            </div>

            <button
                onClick={() => window.location.reload()}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                刷新页面
            </button>
        </div>
    );
};

export default SimpleFeishuQR; 