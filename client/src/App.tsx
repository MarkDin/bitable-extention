import AuthGuard from "@/components/AuthGuard";
import HashRedirect from "@/components/HashRedirect";
import PluginLayout from "@/components/PluginLayout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import URLTest from "@/components/URLTest";
import UserInfoDebug from "@/components/UserInfoDebug";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import ConfigManager from "@/pages/ConfigManager";
import FieldAutoComplete from "@/pages/FieldAutoComplete";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import PermissionManager from "@/pages/PermissionManager";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Route, Router, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { toast } from "./hooks/use-toast";
import { getDataByIds } from "./lib/dataSync";
import { queryClient } from "./lib/queryClient";

function AppRouter() {
  const [location] = useLocation();

  return (
    <Switch>
      {/* 公开路由 - 不需要认证 */}
      <Route path="/login">
        <AuthGuard requireAuth={false}>
          <Login />
        </AuthGuard>
      </Route>
      <Route path="/auth/callback">
        <AuthGuard requireAuth={false}>
          <Login />
        </AuthGuard>
      </Route>

      {/* 受保护的路由 - 需要认证，自动实现免登录 */}
      <Route path="/url-test">
        <AuthGuard>
          <URLTest />
        </AuthGuard>
      </Route>
      <Route path="/user-info">
        <AuthGuard>
          <UserInfoDebug />
        </AuthGuard>
      </Route>
      <Route path="/auto-complete">
        <AuthGuard>
          <PluginLayout>
            <FieldAutoComplete />
          </PluginLayout>
        </AuthGuard>
      </Route>
      <Route path="/config-manager">
        <AuthGuard>
          <PluginLayout>
            <ConfigManager />
          </PluginLayout>
        </AuthGuard>
      </Route>
      <Route path="/permission-manager">
        <AuthGuard>
          <PluginLayout>
            <PermissionManager />
          </PluginLayout>
        </AuthGuard>
      </Route>
      <Route path="/">
        <AuthGuard>
          <PluginLayout>
            <FieldAutoComplete />
          </PluginLayout>
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useFeishuBase();
  useEffect(() => {
    getDataByIds(['IN25000734']).then(res => {
      console.log('预检接口返回', res);
    }).catch(err => {
      console.log('预检接口错误', err);
      toast({
        title: "接口连接失败",
        description: "无法连接到数据接口，请检查网络连接或联系管理员",
        variant: "default",
      });
    });
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRedirect />
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
