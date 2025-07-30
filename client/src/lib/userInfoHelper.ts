import { useFeishuBaseStore } from '@/hooks/useFeishuBaseStore';

/**
 * 获取当前用户信息（同步方法，适用于非React组件）
 */
export function getCurrentUserInfo() {
    return useFeishuBaseStore.getState().getUserInfo();
}

/**
 * 获取用户显示名称（同步方法）
 */
export function getUserDisplayName() {
    return useFeishuBaseStore.getState().getUserDisplayName();
}

/**
 * 获取用于操作日志的用户信息（同步方法）
 */
export function getUserInfoForLog() {
    return useFeishuBaseStore.getState().getUserInfoForLog();
}

/**
 * 检查用户是否已登录
 */
export function isUserLoggedIn() {
    const userInfo = getCurrentUserInfo();
    return !!userInfo;
}

/**
 * 获取用户的简要信息摘要
 */
export function getUserSummary() {
    const userInfo = getCurrentUserInfo();

    if (!userInfo) {
        return {
            isLoggedIn: false,
            displayName: '未登录用户'
        };
    }

    return {
        isLoggedIn: true,
        displayName: userInfo.name || userInfo.en_name || '未知用户',
        userId: userInfo.user_id,
        email: userInfo.email || '未提供'
    };
}