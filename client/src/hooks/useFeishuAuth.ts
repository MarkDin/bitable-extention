import {
    clearAuthInfo,
    type FeishuAuthConfig,
    type FeishuTokenResponse,
    type FeishuUserInfo,
    getStoredAccessToken,
    getStoredUserInfo,
    getUserInfo,
    getUserInfoFromBackend,
    isLoggedIn,
    isTokenExpired,
    refreshAccessToken,
    storeAuthInfo
} from '@/lib/feishuAuth';
import { useCallback, useEffect, useState } from 'react';
import { useFeishuBaseStore } from './useFeishuBaseStore';

interface UseFeishuAuthReturn {
    isAuthenticated: boolean;
    user: FeishuUserInfo | null;
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;
    login: (code: string) => Promise<void>;
    loginWithUserInfo: (userInfo: FeishuUserInfo, tokenResponse: FeishuTokenResponse) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    clearError: () => void;
}

export function useFeishuAuth(config: FeishuAuthConfig): UseFeishuAuthReturn {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<FeishuUserInfo | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 获取全局store的setter
    const setFeishuUserInfo = useFeishuBaseStore(state => state.setFeishuUserInfo);

    // 初始化认证状态
    useEffect(() => {
        const initAuth = () => {
            try {
                setIsLoading(true);

                if (isLoggedIn()) {
                    const storedUser = getStoredUserInfo();
                    const storedToken = getStoredAccessToken();

                    if (storedUser && storedToken) {
                        setUser(storedUser);
                        setAccessToken(storedToken);
                        setIsAuthenticated(true);
                        // 将用户信息保存到全局store
                        setFeishuUserInfo(storedUser);

                        console.log('=== 从本地存储恢复用户登录状态 ===');
                        console.log('用户名:', storedUser.name || '未提供');
                        console.log('邮箱:', storedUser.email || '未提供或权限不足');
                        console.log('恢复的用户信息:', storedUser);
                        console.log('===================================');
                    }
                }
            } catch (err) {
                console.error('初始化认证状态失败:', err);
                setError('初始化认证状态失败');
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [setFeishuUserInfo]);

    // 检查token是否过期并自动刷新
    useEffect(() => {
        if (!isAuthenticated || !accessToken) return;

        const checkTokenExpiry = async () => {
            if (isTokenExpired()) {
                try {
                    await refreshToken();
                } catch (err) {
                    console.error('自动刷新token失败:', err);
                    logout();
                }
            }
        };

        // 立即检查一次
        checkTokenExpiry();

        // 设置定时检查（每5分钟检查一次）
        const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isAuthenticated, accessToken]);

    // 使用后端返回的用户信息进行登录
    const loginWithUserInfo = useCallback(async (userInfo: FeishuUserInfo, tokenResponse: FeishuTokenResponse) => {
        try {
            setIsLoading(true);
            setError(null);

            // 存储认证信息
            storeAuthInfo(tokenResponse, userInfo);

            // 更新本地状态
            setUser(userInfo);
            setAccessToken(tokenResponse.access_token);
            setIsAuthenticated(true);

            // 将用户信息保存到全局store
            setFeishuUserInfo(userInfo);

            // 详细打印用户信息
            console.log('=== 飞书用户登录成功 ===');
            console.log('用户名:', userInfo.name || '未提供');
            console.log('英文名:', userInfo.en_name || '未提供');
            console.log('邮箱:', userInfo.email || '未提供或权限不足');
            console.log('手机号:', userInfo.mobile || '未提供或权限不足');
            console.log('用户ID:', userInfo.user_id);
            console.log('Open ID:', userInfo.open_id);
            console.log('Union ID:', userInfo.union_id);
            console.log('租户键:', userInfo.tenant_key);
            console.log('头像URL:', userInfo.avatar_url || '未提供');
            console.log('完整用户信息对象:', userInfo);
            console.log('========================');

            // 检查邮箱权限
            if (!userInfo.email) {
                console.warn('⚠️ 无法获取用户邮箱，可能的原因：');
                console.warn('1. 应用未申请邮箱权限');
                console.warn('2. 用户未在飞书中绑定邮箱');
                console.warn('3. 用户拒绝提供邮箱信息');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '登录失败';
            setError(errorMessage);
            console.error('登录失败:', err);
        } finally {
            setIsLoading(false);
        }
    }, [setFeishuUserInfo]);

    // 使用code从后端获取用户信息并登录
    const login = useCallback(async (code: string) => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('=== 开始从后端获取用户信息 ===');

            // 调用您的后端接口获取用户信息
            const { userInfo, tokenData } = await getUserInfoFromBackend(code);

            // 存储认证信息
            storeAuthInfo(tokenData, userInfo);

            // 更新本地状态
            setUser(userInfo);
            setAccessToken(tokenData.access_token);
            setIsAuthenticated(true);

            // 将用户信息保存到全局store
            setFeishuUserInfo(userInfo);

            // 详细打印用户信息
            console.log('=== 飞书用户登录成功 ===');
            console.log('用户名:', userInfo.name || '未提供');
            console.log('英文名:', userInfo.en_name || '未提供');
            console.log('邮箱:', userInfo.email || '未提供或权限不足');
            console.log('手机号:', userInfo.mobile || '未提供或权限不足');
            console.log('用户ID:', userInfo.user_id);
            console.log('Open ID:', userInfo.open_id);
            console.log('Union ID:', userInfo.union_id);
            console.log('租户键:', userInfo.tenant_key);
            console.log('头像URL:', userInfo.avatar_url || '未提供');
            console.log('完整用户信息对象:', userInfo);
            console.log('========================');

            // 检查邮箱权限
            if (!userInfo.email) {
                console.warn('⚠️ 无法获取用户邮箱，可能的原因：');
                console.warn('1. 应用未申请邮箱权限');
                console.warn('2. 用户未在飞书中绑定邮箱');
                console.warn('3. 用户拒绝提供邮箱信息');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '登录失败';
            setError(errorMessage);
            console.error('登录失败:', err);
        } finally {
            setIsLoading(false);
        }
    }, [setFeishuUserInfo]);

    // 登出函数
    const logout = useCallback(() => {
        clearAuthInfo();
        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
        setError(null);
        // 清除全局store中的用户信息
        setFeishuUserInfo(null);
        console.log('用户已登出，store中的用户信息已清除');
    }, [setFeishuUserInfo]);

    // 刷新令牌函数
    const refreshToken = useCallback(async () => {
        try {
            setError(null);

            const tokenResponse: FeishuTokenResponse = await refreshAccessToken(config);

            // 获取最新用户信息
            const userInfo: FeishuUserInfo = await getUserInfo(tokenResponse.access_token);

            // 存储新的认证信息
            storeAuthInfo(tokenResponse, userInfo);

            // 更新本地状态
            setUser(userInfo);
            setAccessToken(tokenResponse.access_token);

            // 更新全局store中的用户信息
            setFeishuUserInfo(userInfo);

            console.log('=== Token刷新成功，用户信息已更新 ===');
            console.log('用户名:', userInfo.name || '未提供');
            console.log('邮箱:', userInfo.email || '未提供或权限不足');
            console.log('更新后的完整用户信息:', userInfo);
            console.log('====================================');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '刷新令牌失败';
            setError(errorMessage);
            console.error('刷新令牌失败:', err);
            throw err;
        }
    }, [config, setFeishuUserInfo]);

    // 清除错误
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isAuthenticated,
        user,
        accessToken,
        isLoading,
        error,
        login,
        loginWithUserInfo,
        logout,
        refreshToken,
        clearError
    };
} 