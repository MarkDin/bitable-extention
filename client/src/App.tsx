import PluginLayout from "@/components/PluginLayout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import ConfigManager from "@/pages/ConfigManager";
import FieldAutoComplete from "@/pages/FieldAutoComplete";
import NotFound from "@/pages/not-found";
import PermissionManager from "@/pages/PermissionManager";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Router, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { useEffect } from "react";
import { getDataByIds } from "./lib/dataSync";
import { toast } from "./hooks/use-toast";

function AppRouter() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/">
        <PluginLayout>
          <FieldAutoComplete />
        </PluginLayout>
      </Route>
      <Route path="/auto-complete">
        <PluginLayout>
          <FieldAutoComplete />
        </PluginLayout>
      </Route>
      <Route path="/config-manager">
        <PluginLayout>
          <ConfigManager />
        </PluginLayout>
      </Route>
      <Route path="/permission-manager">
        <PluginLayout>
          <PermissionManager />
        </PluginLayout>
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
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
