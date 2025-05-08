import { useState, useEffect } from 'react';
import { useFeishuBase } from '@/hooks/use-feishu-base';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";

export function UserInfo() {
  const { currentUser, loading, error } = useFeishuBase();
  const [userName, setUserName] = useState<string>('');
  
  useEffect(() => {
    async function fetchUserName() {
      if (currentUser?.baseUserId) {
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
  }, [currentUser]);
  
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
        <CardTitle className="text-sm font-medium">当前用户</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border border-gray-200">
          <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${currentUser?.baseUserId || 'user'}`} />
          <AvatarFallback className="text-sm">
            {userName ? userName.substring(0, 2).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <p className="text-sm font-medium">{userName || '飞书用户'}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs px-2 py-0 h-5">
              ID: {currentUser?.baseUserId ? `${currentUser.baseUserId.substring(0, 6)}...` : '未知'}
            </Badge>
            <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
              多维表格插件
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}