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

// 构建授权URL - 直接重定向到后端
export function buildAuthUrl(config: FeishuAuthConfig): string {
    const state = config.state || generateState();
    localStorage.setItem('feishu_auth_state', state);

    // 直接重定向到后端的callback接口
    const params = new URLSearchParams({
        // client_id: config.clientId,
        redirect_uri: 'https://crm-data-service-dk1543100966.replit.app/auth/callback',
        response_type: 'code',
        state: state
    });

    console.log('login params', params.toString());
    console.log('redirect_uri (后端)', 'https://crm-data-service-dk1543100966.replit.app/auth/callback');

    return `https://passport.feishu.cn/suite/passport/oauth/authorize?${params.toString()}`;
}

// 验证状态参数
export function validateState(returnedState: string): boolean {
    const storedState = localStorage.getItem('feishu_auth_state');
    return storedState === returnedState;
}

// 通过state参数从后端获取用户信息
export async function getUserInfoByState(state: string): Promise<{ userInfo: FeishuUserInfo, tokenData: FeishuTokenResponse }> {
    console.log('=== 通过state从后端获取用户信息 ===');
    console.log('state参数:', state);

    const response = await fetch(`https://crm-data-service-dk1543100966.replit.app/feishu/user_info?state=${encodeURIComponent(state)}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });

    console.log('后端API响应状态:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('后端API错误响应:', errorText);
        throw new Error(`获取用户信息失败: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('后端API完整响应:', data);

    // 检查响应是否成功
    if (!data.success) {
        throw new Error(`后端返回错误: ${data.error || '未知错误'}`);
    }

    // 检查数据结构
    if (!data.data || !data.data.user_info || !data.data.token_info) {
        throw new Error('后端返回数据格式不正确，缺少必要字段');
    }

    // 转换为我们期望的格式
    const userInfo: FeishuUserInfo = {
        name: data.data.user_info.name,
        en_name: data.data.user_info.en_name,
        avatar_url: data.data.user_info.avatar_url,
        avatar_thumb: data.data.user_info.avatar_thumb,
        avatar_middle: data.data.user_info.avatar_middle,
        avatar_big: data.data.user_info.avatar_big,
        open_id: data.data.user_info.open_id,
        union_id: data.data.user_info.union_id,
        user_id: data.data.user_info.user_id,
        tenant_key: data.data.user_info.tenant_key,
        email: data.data.user_info.email || '',
        mobile: data.data.user_info.mobile || ''
    };

    const tokenData: FeishuTokenResponse = {
        access_token: data.data.token_info.access_token,
        token_type: data.data.token_info.token_type,
        expires_in: data.data.token_info.expires_in,
        scope: data.data.token_info.scope,
        refresh_token: '', // 后端没有返回refresh_token，设为空字符串
    };

    console.log('✅ 解析后的用户信息:', userInfo);
    console.log('✅ 解析后的token信息:', {
        ...tokenData,
        access_token: tokenData.access_token.substring(0, 20) + '...' // 只显示前20位
    });

    return {
        userInfo,
        tokenData
    };
}

// 从您的后端接口获取用户信息（保留原函数以备兼容）
export async function getUserInfoFromBackend(code: string): Promise<{ userInfo: FeishuUserInfo, tokenData: FeishuTokenResponse }> {
    console.log('=== 从后端获取用户信息 ===');
    console.log('授权码:', code);

    const response = await fetch(`https://crm-data-service-dk1543100966.replit.app/feishu/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(window.location.origin + '/#/auth/callback')}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });

    console.log('后端API响应状态:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('后端API错误响应:', errorText);
        throw new Error(`获取用户信息失败: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('后端API完整响应:', data);

    // 检查响应是否成功
    if (!data.success) {
        throw new Error(`后端返回错误: ${data.message || '未知错误'}`);
    }

    // 检查数据结构
    if (!data.data || !data.data.user_info || !data.data.token_info) {
        throw new Error('后端返回数据格式不正确，缺少必要字段');
    }

    // 转换为我们期望的格式
    const userInfo: FeishuUserInfo = {
        name: data.data.user_info.name,
        en_name: data.data.user_info.en_name,
        avatar_url: data.data.user_info.avatar_url,
        avatar_thumb: data.data.user_info.avatar_thumb,
        avatar_middle: data.data.user_info.avatar_middle,
        avatar_big: data.data.user_info.avatar_big,
        open_id: data.data.user_info.open_id,
        union_id: data.data.user_info.union_id,
        user_id: data.data.user_info.user_id,
        tenant_key: data.data.user_info.tenant_key
    };

    const tokenData: FeishuTokenResponse = {
        access_token: data.data.token_info.access_token,
        token_type: data.data.token_info.token_type,
        expires_in: data.data.token_info.expires_in,
        scope: data.data.token_info.scope,
        refresh_token: '', // 后端没有返回refresh_token，设为空字符串
        refresh_expires_in: 0
    };

    console.log('✅ 解析后的用户信息:', userInfo);
    console.log('✅ 解析后的token信息:', {
        ...tokenData,
        access_token: tokenData.access_token.substring(0, 20) + '...' // 只显示前20位
    });

    return {
        userInfo,
        tokenData
    };
}

// 获取用户信息
export async function getUserInfo(accessToken: string): Promise<FeishuUserInfo> {
    console.log('正在请求用户信息...');

    const response = await fetch('https://passport.feishu.cn/suite/passport/oauth/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    if (!response.ok) {
        console.error(`用户信息API请求失败: HTTP ${response.status}`);
        throw new Error(`获取用户信息失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('用户信息API响应:', data);

    if (data.code !== 0) {
        console.error(`用户信息API返回错误: code=${data.code}, msg=${data.msg}`);
        throw new Error(`获取用户信息失败: ${data.msg}`);
    }

    const userInfo = data.data;
    console.log('成功获取用户信息，字段可用性检查:');
    console.log('- name (用户名):', userInfo.name ? '✓ 可用' : '✗ 不可用');
    console.log('- en_name (英文名):', userInfo.en_name ? '✓ 可用' : '✗ 不可用');
    console.log('- email (邮箱):', userInfo.email ? '✓ 可用' : '✗ 不可用或权限不足');
    console.log('- mobile (手机):', userInfo.mobile ? '✓ 可用' : '✗ 不可用或权限不足');
    console.log('- avatar_url (头像):', userInfo.avatar_url ? '✓ 可用' : '✗ 不可用');

    return userInfo;
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
