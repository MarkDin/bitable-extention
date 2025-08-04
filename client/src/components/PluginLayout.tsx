import React from "react";
import { useLocation } from "wouter";

interface PluginLayoutProps {
  children: React.ReactNode;
}

const PluginLayout: React.FC<PluginLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-screen">
      {/* Login Status Indicator */}
      {/* <div className="border-b bg-gray-50 px-4 py-2">
        <LoginStatusIndicator />
      </div> */}

      {/* Tab Navigation */}
      {/* <TabNavigation /> */}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PluginLayout;