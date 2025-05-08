import React from 'react';
import { useFeishuBase } from '@/hooks/use-feishu-base';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UserInfo() {
  const { currentUser, loading } = useFeishuBase();

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">无法获取用户信息</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">用户信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">用户 ID:</span>
            <span className="text-xs font-medium">{currentUser.userId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Base 用户 ID:</span>
            <span className="text-xs font-medium">{currentUser.baseUserId}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}