import React from "react";
import { useLocation } from "wouter";

interface PluginLayoutProps {
  children: React.ReactNode;
}

const PluginLayout: React.FC<PluginLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg w-full">
        <div className="flex items-center text-blue-700">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
          <span className="text-sm">
            如需帮助，请
            <a
              href="https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=a73l2453-703e-4d75-929d-b468794c1f6e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#155EEF] hover:text-[#155EEF]/80 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=a73l2453-703e-4d75-929d-b468794c1f6e', '_blank');
              }}
            >
              点击加入反馈群
            </a>
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      {/* <TabNavigation /> */}



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