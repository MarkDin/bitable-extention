import { FieldType, IAddFieldConfig } from "@lark-base-open/js-sdk";
import { QueryClient } from "@tanstack/react-query";
import { feishuBase } from "./feishuBase";

// 简化的QueryClient配置，不再使用自定义queryFn进行拦截
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});


