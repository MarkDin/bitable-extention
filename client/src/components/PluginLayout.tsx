import React from "react";
import { useLocation } from "wouter";
import InfoMessage from "./addLarkGroup";

interface PluginLayoutProps {
  children: React.ReactNode;
}

const PluginLayout: React.FC<PluginLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <InfoMessage />


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