import PluginLayout from "@/components/PluginLayout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import ConfigManager from "@/pages/ConfigManager";
import FieldAutoComplete from "@/pages/FieldAutoComplete";
import FieldCompleteV2 from "@/pages/FieldCompleteV2";
import NotFound from "@/pages/not-found";
import PermissionManager from "@/pages/PermissionManager";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

function Router() {
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
      <Route path="/field-complete-v2">
        <PluginLayout>
          <FieldCompleteV2 />
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
