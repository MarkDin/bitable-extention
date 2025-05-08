import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiService } from './apiService';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // 解析路径以确定要调用的API服务方法
    const pathParts = url.split('/').filter(p => p);
    
    // 模拟Response对象，实际上是从apiService获取数据
    if (pathParts[0] === 'api') {
      // 根据路径模式调用不同的apiService方法
      switch (pathParts[1]) {
        case 'configurations':
          if (method === 'GET') {
            if (pathParts.length === 2) {
              // GET /api/configurations
              const configs = await apiService.getApiConfigurations();
              return createSuccessResponse({ configurations: configs });
            } else if (pathParts.length === 3) {
              // GET /api/configurations/:id
              const config = await apiService.getApiConfiguration(Number(pathParts[2]));
              return createSuccessResponse(config || { error: 'Configuration not found' });
            } else if (pathParts.length === 4 && pathParts[3] === 'mappings') {
              // GET /api/configurations/:id/mappings
              const mappings = await apiService.getFieldMappings(Number(pathParts[2]));
              return createSuccessResponse({ mappings });
            }
          } else if (method === 'POST') {
            // POST /api/configurations
            const newConfig = await apiService.createApiConfiguration(data as any);
            return createSuccessResponse(newConfig);
          } else if (method === 'PATCH') {
            // PATCH /api/configurations/:id
            const updatedConfig = await apiService.updateApiConfiguration(Number(pathParts[2]), data as any);
            return createSuccessResponse(updatedConfig || { error: 'Configuration not found' });
          } else if (method === 'DELETE') {
            // DELETE /api/configurations/:id
            const deleted = await apiService.deleteApiConfiguration(Number(pathParts[2]));
            return createSuccessResponse({ success: deleted });
          }
          break;
          
        case 'search':
          // POST /api/search
          if (method === 'POST') {
            const result = await apiService.search(data as any);
            return createSuccessResponse(result);
          }
          break;
          
        case 'update':
          // POST /api/update
          if (method === 'POST') {
            const result = await apiService.update(data as any);
            return createSuccessResponse(result);
          }
          break;
      }
    }
    
    return createErrorResponse('Unsupported API endpoint: ' + url);
  } catch (error: any) {
    console.error(`API请求失败 (${method} ${url}):`, error);
    return createErrorResponse(error.message || 'Unknown error');
  }
}

// 创建成功的Response对象
function createSuccessResponse(data: any): Response {
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
}

// 创建错误的Response对象
function createErrorResponse(message: string): Response {
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

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async <T>({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      const pathParts = url.split('/').filter(p => p);
      
      // 根据路径调用相应的API服务方法
      if (pathParts[0] === 'api') {
        switch (pathParts[1]) {
          case 'configurations':
            if (pathParts.length === 2) {
              // GET /api/configurations
              const configs = await apiService.getApiConfigurations();
              return { configurations: configs } as unknown as T;
            } else if (pathParts.length === 3) {
              // GET /api/configurations/:id
              const config = await apiService.getApiConfiguration(Number(pathParts[2]));
              return config as unknown as T;
            } else if (pathParts.length === 4 && pathParts[3] === 'mappings') {
              // GET /api/configurations/:id/mappings
              const mappings = await apiService.getFieldMappings(Number(pathParts[2]));
              return { mappings } as unknown as T;
            }
            break;
        }
      }
      
      throw new Error(`Unsupported query path: ${url}`);
    } catch (error: any) {
      console.error(`Query失败:`, error);
      if (unauthorizedBehavior === "throw") {
        throw error;
      } else {
        return null as any;
      }
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
