import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FieldAutoComplete from "@/pages/FieldAutoComplete";
import DataSync from "@/pages/DataSync";
import NotFound from "@/pages/not-found";
import PluginLayout from "@/components/PluginLayout";

function Router() {
  const [location] = useLocation();
  
  return (
    <PluginLayout>
      <Switch>
        <Route path="/" component={FieldAutoComplete} />
        <Route path="/auto-complete" component={FieldAutoComplete} />
        <Route path="/data-sync" component={DataSync} />
        <Route component={NotFound} />
      </Switch>
    </PluginLayout>
  );
}

function App() {
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
