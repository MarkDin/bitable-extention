// 飞书认证服务
export interface FeishuAuthConfig {
    clientId: string;
    redirectUri: string;
    state?: string;
}

export interface FeishuUserInfo {
    open_id: string;
    union_id: string;
    user_id: string;
    name: string;
    en_name: string;
    avatar_url: string;
    avatar_thumb: string;
    avatar_middle: string;
    avatar_big: string;
    email: string;
    mobile: string;
    tenant_key: string;
}

export interface FeishuTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

// 存储键名
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'feishu_access_token',
    REFRESH_TOKEN: 'feishu_refresh_token',
    USER_INFO: 'feishu_user_info',
    TOKEN_EXPIRES_AT: 'feishu_token_expires_at'
};

// 生成随机状态字符串
export function generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 构建授权URL
export function buildAuthUrl(config: FeishuAuthConfig): string {
    const state = config.state || generateState();
    localStorage.setItem('feishu_auth_state', state);

    const params = new URLSearchParams({
        app_id: config.clientId,
        redirect_uri: config.redirectUri,
        state: state
    });
    console.log('login params', params.toString());
    console.log('redirect_uri', config.redirectUri);
    // 使用正确的飞书扫码登录端点
    return `https://passport.feishu.cn/suite/passport/oauth/authorize?${params.toString()}`;
}

// 验证状态参数
export function validateState(returnedState: string): boolean {
    const storedState = localStorage.getItem('feishu_auth_state');
    return storedState === returnedState;
}

// 获取用户访问令牌
export async function getUserAccessToken(code: string, config: FeishuAuthConfig): Promise<FeishuTokenResponse> {
    const response = await fetch('https://passport.feishu.cn/suite/passport/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            app_id: config.clientId,
            app_secret: '', // 注意：客户端应用通常不需要app_secret
            code: code,
            redirect_uri: config.redirectUri
        })
    });

    if (!response.ok) {
        throw new Error(`获取访问令牌失败: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`获取访问令牌失败: ${data.msg}`);
    }

    return data.data;
}

// 获取用户信息
export async function getUserInfo(accessToken: string): Promise<FeishuUserInfo> {
    const response = await fetch('https://passport.feishu.cn/suite/passport/oauth/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    if (!response.ok) {
        throw new Error(`获取用户信息失败: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`获取用户信息失败: ${data.msg}`);
    }

    return data.data;
}

// 存储认证信息
export function storeAuthInfo(tokenResponse: FeishuTokenResponse, userInfo: FeishuUserInfo): void {
    const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
}

// 获取存储的用户信息
export function getStoredUserInfo(): FeishuUserInfo | null {
    try {
        const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch {
        return null;
    }
}

// 获取存储的访问令牌
export function getStoredAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

// 检查令牌是否过期
export function isTokenExpired(): boolean {
    const expiresAtStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAtStr) return true;

    const expiresAt = parseInt(expiresAtStr);
    return Date.now() >= expiresAt;
}

// 清除认证信息
export function clearAuthInfo(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem('feishu_auth_state');
}

// 刷新访问令牌
export async function refreshAccessToken(config: FeishuAuthConfig): Promise<FeishuTokenResponse> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
        throw new Error('没有刷新令牌');
    }

    const response = await fetch('https://passport.feishu.cn/suite/passport/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: config.clientId,
            refresh_token: refreshToken
        })
    });

    if (!response.ok) {
        throw new Error(`刷新令牌失败: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`刷新令牌失败: ${data.msg}`);
    }

    return data.data;
}

// 检查是否已登录
export function isLoggedIn(): boolean {
    const accessToken = getStoredAccessToken();
    const userInfo = getStoredUserInfo();
    return !!(accessToken && userInfo && !isTokenExpired());
} 