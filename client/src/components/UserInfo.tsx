import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeishuBase } from '@/hooks/use-feishu-base';
import { useFeishuAuth } from '@/hooks/useFeishuAuth';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserInfoProps {
  showLogout?: boolean;
}

export function UserInfo({ showLogout = false }: UserInfoProps) {
  const { currentUser, loading, error } = useFeishuBase();
  const [userName, setUserName] = useState<string>('');

  // 飞书认证配置 - 需要与Login页面保持一致
  const FEISHU_CONFIG = {
    clientId: import.meta.env.VITE_FEISHU_CLIENT_ID || 'cli_a8848b72377ad00e',
    redirectUri: import.meta.env.VITE_FEISHU_REDIRECT_URI || `${window.location.origin}/auth/callback`
  };

  const {
    isAuthenticated: isFeishuAuthenticated,
    user: feishuUser,
    logout: feishuLogout
  } = useFeishuAuth(FEISHU_CONFIG);

  useEffect(() => {
    async function fetchUserName() {
      // 优先使用飞书登录的用户信息
      if (feishuUser?.name) {
        setUserName(feishuUser.name);
      } else if (currentUser?.baseUserId) {
        try {
          // 在实际环境中，这里可能会通过飞书API获取用户名
          // 当前使用ID的一部分作为用户名示例
          const userIdPart = currentUser.baseUserId.substring(0, 8);
          setUserName(`飞书用户 ${userIdPart}`);
        } catch (err) {
          console.error('获取用户名失败:', err);
        }
      }
    }

    fetchUserName();
  }, [currentUser, feishuUser]);

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">当前用户</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-3 w-[180px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-500">获取用户信息失败</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
          <p className="text-xs mt-2">请刷新页面重试</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">当前用户</CardTitle>
          {showLogout && isFeishuAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={feishuLogout}
              className="h-8 px-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border border-gray-200">
          <AvatarImage
            src={feishuUser?.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${currentUser?.baseUserId || 'user'}`}
          />
          <AvatarFallback className="text-sm">
            {userName ? userName.substring(0, 2).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="text-sm font-medium">{userName || '飞书用户'}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {feishuUser?.email && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                {feishuUser.email}
              </Badge>
            )}
            {currentUser?.baseUserId && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                ID: {currentUser.baseUserId.substring(0, 6)}...
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
              {isFeishuAuthenticated ? '飞书登录' : '多维表格插件'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}