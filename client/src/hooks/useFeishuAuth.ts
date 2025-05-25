import {
    clearAuthInfo,
    type FeishuAuthConfig,
    type FeishuTokenResponse,
    type FeishuUserInfo,
    getStoredAccessToken,
    getStoredUserInfo,
    getUserAccessToken,
    getUserInfo,
    isLoggedIn,
    isTokenExpired,
    refreshAccessToken,
    storeAuthInfo
} from '@/lib/feishuAuth';
import { useCallback, useEffect, useState } from 'react';

interface UseFeishuAuthReturn {
    isAuthenticated: boolean;
    user: FeishuUserInfo | null;
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;
    login: (code: string) => Promise<void>;
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
    }, []);

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

    // 登录函数
    const login = useCallback(async (code: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // 获取访问令牌
            const tokenResponse: FeishuTokenResponse = await getUserAccessToken(code, config);

            // 获取用户信息
            const userInfo: FeishuUserInfo = await getUserInfo(tokenResponse.access_token);

            // 存储认证信息
            storeAuthInfo(tokenResponse, userInfo);

            // 更新状态
            setUser(userInfo);
            setAccessToken(tokenResponse.access_token);
            setIsAuthenticated(true);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '登录失败';
            setError(errorMessage);
            console.error('登录失败:', err);
        } finally {
            setIsLoading(false);
        }
    }, [config]);

    // 登出函数
    const logout = useCallback(() => {
        clearAuthInfo();
        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
        setError(null);
    }, []);

    // 刷新令牌函数
    const refreshToken = useCallback(async () => {
        try {
            setError(null);

            const tokenResponse: FeishuTokenResponse = await refreshAccessToken(config);

            // 获取最新用户信息
            const userInfo: FeishuUserInfo = await getUserInfo(tokenResponse.access_token);

            // 存储新的认证信息
            storeAuthInfo(tokenResponse, userInfo);

            // 更新状态
            setUser(userInfo);
            setAccessToken(tokenResponse.access_token);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '刷新令牌失败';
            setError(errorMessage);
            console.error('刷新令牌失败:', err);
            throw err;
        }
    }, [config]);

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
        logout,
        refreshToken,
        clearError
    };
} 