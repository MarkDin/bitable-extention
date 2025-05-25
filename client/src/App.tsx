import PluginLayout from "@/components/PluginLayout";
import URLTest from "@/components/URLTest";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import ConfigManager from "@/pages/ConfigManager";
import FieldAutoComplete from "@/pages/FieldAutoComplete";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={Login} />
      <Route path="/url-test" component={URLTest} />
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
