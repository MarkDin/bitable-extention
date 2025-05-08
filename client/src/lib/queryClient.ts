import { QueryClient } from "@tanstack/react-query";

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

// 导出一个简单的辅助函数，用于创建标准的Response对象
// 这样组件可以直接使用apiService，但仍然能获得标准的Response对象
export function createResponse(data: any, success = true): Response {
  if (success) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      headers: new Headers(),
      bodyUsed: false,
      body: null,
      redirected: false,
      type: 'basic',
      url: '',
      clone: function () { return this; },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
    } as Response;
  } else {
    const message = typeof data === 'string' ? data : 'Error occurred';
    return {
      ok: false,
      status: 400,
      statusText: message,
      json: () => Promise.resolve({ error: message }),
      text: () => Promise.resolve(message),
      headers: new Headers(),
      bodyUsed: false,
      body: null,
      redirected: false,
      type: 'basic',
      url: '',
      clone: function () { return this; },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
    } as Response;
  }
}
