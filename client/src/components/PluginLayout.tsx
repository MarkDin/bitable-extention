import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";
import TabNavigation from "./TabNavigation";

interface PluginLayoutProps {
  children: React.ReactNode;
}

const PluginLayout: React.FC<PluginLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#E5E6EB]">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd"></path>
          </svg>
          <h1 className="ml-2 text-base font-semibold">数据助手</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setLocation('/config-manager')}>
          <Settings className="w-5 h-5 text-[#86909C] hover:text-[#1F2329]" />
        </Button>
      </header>

      {/* Tab Navigation */}
      <TabNavigation />



      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>

      </main>
    </div>
  );
};

export default PluginLayout;