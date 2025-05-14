import PluginLayout from "@/components/PluginLayout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import ConfigManager from "@/pages/ConfigManager";
import FieldAutoComplete from "@/pages/FieldAutoComplete";
import NotFound from "@/pages/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

function Router() {
  const [location] = useLocation();

  return (
    <PluginLayout>
      <Switch>
        <Route path="/" component={FieldAutoComplete} />
        <Route path="/auto-complete" component={FieldAutoComplete} />
        <Route path="/config-manager" component={ConfigManager} />
        <Route component={NotFound} />
      </Switch>
    </PluginLayout>
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
