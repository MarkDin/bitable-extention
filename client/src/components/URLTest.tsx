import { buildAuthUrl } from '@/lib/feishuAuth';
import React, { useEffect, useState } from 'react';

const URLTest: React.FC = () => {
    const [authUrl, setAuthUrl] = useState<string>('');
    const [config, setConfig] = useState({
        clientId: 'cli_a8848b72377ad00e',
        redirectUri: 'https://bitable-extention-dk1543100966.replit.app/auth/callback'
    });

    useEffect(() => {
        try {
            const url = buildAuthUrl(config);
            setAuthUrl(url);
            console.log('生成的授权URL:', url);
        } catch (error) {
            console.error('生成URL失败:', error);
        }
    }, [config]);

    const testCallback = () => {
        // 模拟回调URL测试
        const testUrl = 'https://bitable-extention-dk1543100966.replit.app/auth/callback?code=test123&state=teststate';
        window.open(testUrl, '_blank');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>飞书URL测试</h1>

            <div style={{ marginBottom: '20px' }}>
                <h3>配置信息:</h3>
                <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    <p><strong>Client ID:</strong> {config.clientId}</p>
                    <p><strong>Redirect URI:</strong> {config.redirectUri}</p>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>生成的授权URL:</h3>
                <div style={{
                    backgroundColor: '#f0f8ff',
                    padding: '10px',
                    borderRadius: '4px',
                    wordBreak: 'break-all',
                    border: '1px solid #ccc'
                }}>
                    <a href={authUrl} target="_blank" rel="noopener noreferrer">
                        {authUrl}
                    </a>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => window.open(authUrl, '_blank')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    测试授权URL
                </button>

                <button
                    onClick={testCallback}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    测试回调URL
                </button>
            </div>

            <div>
                <h3>URL解析:</h3>
                <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
                    {authUrl && (
                        <div>
                            <p><strong>基础URL:</strong> https://passport.feishu.cn/suite/passport/oauth/authorize</p>
                            <p><strong>参数:</strong></p>
                            <ul>
                                {Array.from(new URLSearchParams(authUrl.split('?')[1])).map(([key, value]) => (
                                    <li key={key}><strong>{key}:</strong> {value}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default URLTest; 