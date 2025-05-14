import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { bitable } from "@lark-base-open/js-sdk";

// 错误边界组件，用于处理Feishu SDK初始化问题
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // 检查是否在飞书多维表格环境中
    const checkEnvironment = async () => {
      try {
        // 尝试访问bitable对象，如果不在飞书环境中会失败
        if (typeof bitable === 'undefined') {
          throw new Error("飞书多维表格SDK未找到");
        }

        // 可以在这里执行其他SDK初始化检查
        console.log("飞书多维表格SDK初始化成功");
      } catch (error: any) {
        console.error("飞书多维表格SDK初始化失败:", error);
        setHasError(true);
        setErrorMessage(error.message || "未知错误");
      }
    };

    checkEnvironment();
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <div className="text-red-500 text-xl font-bold mb-4">初始化失败</div>
        <div className="mb-6 text-lg">
          {errorMessage || "无法初始化飞书多维表格SDK"}
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-gray-700">
          <p>本应用需要在飞书多维表格环境中运行。</p>
          <p className="mt-2">请确保您是从飞书多维表格插件中访问此应用。</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class">
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ThemeProvider>
);
