import { bitable } from '@lark-base-open/js-sdk';

// API配置类型
export interface ApiConfiguration {
  id: number;
  name: string;
  endpoint: string;
  auth_type: string;
  api_key?: string;
}

// 字段映射类型
export interface FieldMapping {
  id: number;
  api_configuration_id: number;
  source_field: string;
  target_field: string;
  is_active: boolean;
}

// 存储的配置数据在插件存储中的键名
const STORAGE_KEYS = {
  API_CONFIGURATIONS: 'api_configurations',
  FIELD_MAPPINGS: 'field_mappings'
};

// 模拟配置数据
const DEFAULT_CONFIG: ApiConfiguration = {
  id: 1,
  name: '企业工商数据API',
  endpoint: 'https://api.example.com/company',
  auth_type: 'api_key'
};

// 模拟的默认字段映射
const DEFAULT_MAPPINGS: FieldMapping[] = [
  { id: 1, api_configuration_id: 1, source_field: '公司名称', target_field: 'fld1', is_active: true },
  { id: 2, api_configuration_id: 1, source_field: '注册资本', target_field: 'fld5', is_active: true },
  { id: 3, api_configuration_id: 1, source_field: '注册地址', target_field: 'fld6', is_active: true },
  { id: 4, api_configuration_id: 1, source_field: '成立时间', target_field: 'fld7', is_active: true },
  { id: 5, api_configuration_id: 1, source_field: '经营范围', target_field: 'fld8', is_active: false }
];

/**
 * 初始化存储空间，检查是否有存储的配置，如果没有则使用默认值
 */
async function initializeStorage() {
  try {
    // 初始化API配置
    const apiConfigsData = await bitable.bridge.getData(STORAGE_KEYS.API_CONFIGURATIONS);
    if (!apiConfigsData) {
      await bitable.bridge.setData(STORAGE_KEYS.API_CONFIGURATIONS, JSON.stringify([DEFAULT_CONFIG]));
    }

    // 初始化字段映射
    const fieldMappingsData = await bitable.bridge.getData(STORAGE_KEYS.FIELD_MAPPINGS);
    if (!fieldMappingsData) {
      await bitable.bridge.setData(STORAGE_KEYS.FIELD_MAPPINGS, JSON.stringify(DEFAULT_MAPPINGS));
    }
  } catch (error) {
    console.error('初始化存储失败:', error);
  }
}

// 在模块加载时初始化存储
initializeStorage();

/**
 * API服务类，封装所有API相关操作
 */
export const apiService = {
  // 获取所有API配置
  getApiConfigurations: async (): Promise<ApiConfiguration[]> => {
    try {
      const data = await bitable.bridge.getData(STORAGE_KEYS.API_CONFIGURATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取API配置失败:', error);
      return [];
    }
  },

  // 获取单个API配置
  getApiConfiguration: async (id: number): Promise<ApiConfiguration | undefined> => {
    try {
      const configs = await apiService.getApiConfigurations();
      return configs.find(config => config.id === id);
    } catch (error) {
      console.error(`获取API配置失败(ID:${id}):`, error);
      return undefined;
    }
  },

  // 创建API配置
  createApiConfiguration: async (config: Omit<ApiConfiguration, 'id'>): Promise<ApiConfiguration> => {
    try {
      const configs = await apiService.getApiConfigurations();
      const newId = configs.length > 0 ? Math.max(...configs.map(c => c.id)) + 1 : 1;
      const newConfig = { ...config, id: newId };
      
      configs.push(newConfig);
      await bitable.bridge.setData(STORAGE_KEYS.API_CONFIGURATIONS, JSON.stringify(configs));
      
      return newConfig;
    } catch (error) {
      console.error('创建API配置失败:', error);
      throw error;
    }
  },

  // 更新API配置
  updateApiConfiguration: async (id: number, config: Partial<ApiConfiguration>): Promise<ApiConfiguration | undefined> => {
    try {
      const configs = await apiService.getApiConfigurations();
      const configIndex = configs.findIndex(c => c.id === id);
      
      if (configIndex === -1) {
        return undefined;
      }
      
      configs[configIndex] = { ...configs[configIndex], ...config };
      await bitable.bridge.setData(STORAGE_KEYS.API_CONFIGURATIONS, JSON.stringify(configs));
      
      return configs[configIndex];
    } catch (error) {
      console.error(`更新API配置失败(ID:${id}):`, error);
      throw error;
    }
  },

  // 删除API配置
  deleteApiConfiguration: async (id: number): Promise<boolean> => {
    try {
      const configs = await apiService.getApiConfigurations();
      const newConfigs = configs.filter(c => c.id !== id);
      
      if (configs.length === newConfigs.length) {
        return false; // 没有找到要删除的配置
      }
      
      await bitable.bridge.setData(STORAGE_KEYS.API_CONFIGURATIONS, JSON.stringify(newConfigs));
      
      // 同时删除相关的字段映射
      const mappings = await apiService.getFieldMappings(id);
      if (mappings.length > 0) {
        const allMappings = await apiService.getAllFieldMappings();
        const filteredMappings = allMappings.filter(m => m.api_configuration_id !== id);
        await bitable.bridge.setData(STORAGE_KEYS.FIELD_MAPPINGS, JSON.stringify(filteredMappings));
      }
      
      return true;
    } catch (error) {
      console.error(`删除API配置失败(ID:${id}):`, error);
      throw error;
    }
  },

  // 获取所有字段映射
  getAllFieldMappings: async (): Promise<FieldMapping[]> => {
    try {
      const data = await bitable.bridge.getData(STORAGE_KEYS.FIELD_MAPPINGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取所有字段映射失败:', error);
      return [];
    }
  },

  // 获取特定API配置的字段映射
  getFieldMappings: async (apiConfigId: number): Promise<FieldMapping[]> => {
    try {
      const mappings = await apiService.getAllFieldMappings();
      return mappings.filter(mapping => mapping.api_configuration_id === apiConfigId);
    } catch (error) {
      console.error(`获取字段映射失败(API配置ID:${apiConfigId}):`, error);
      return [];
    }
  },

  // 创建字段映射
  createFieldMapping: async (mapping: Omit<FieldMapping, 'id'>): Promise<FieldMapping> => {
    try {
      const mappings = await apiService.getAllFieldMappings();
      const newId = mappings.length > 0 ? Math.max(...mappings.map(m => m.id)) + 1 : 1;
      const newMapping = { ...mapping, id: newId };
      
      mappings.push(newMapping);
      await bitable.bridge.setData(STORAGE_KEYS.FIELD_MAPPINGS, JSON.stringify(mappings));
      
      return newMapping;
    } catch (error) {
      console.error('创建字段映射失败:', error);
      throw error;
    }
  },

  // 更新字段映射
  updateFieldMapping: async (id: number, mapping: Partial<FieldMapping>): Promise<FieldMapping | undefined> => {
    try {
      const mappings = await apiService.getAllFieldMappings();
      const mappingIndex = mappings.findIndex(m => m.id === id);
      
      if (mappingIndex === -1) {
        return undefined;
      }
      
      mappings[mappingIndex] = { ...mappings[mappingIndex], ...mapping };
      await bitable.bridge.setData(STORAGE_KEYS.FIELD_MAPPINGS, JSON.stringify(mappings));
      
      return mappings[mappingIndex];
    } catch (error) {
      console.error(`更新字段映射失败(ID:${id}):`, error);
      throw error;
    }
  },

  // 删除字段映射
  deleteFieldMapping: async (id: number): Promise<boolean> => {
    try {
      const mappings = await apiService.getAllFieldMappings();
      const newMappings = mappings.filter(m => m.id !== id);
      
      if (mappings.length === newMappings.length) {
        return false; // 没有找到要删除的映射
      }
      
      await bitable.bridge.setData(STORAGE_KEYS.FIELD_MAPPINGS, JSON.stringify(newMappings));
      return true;
    } catch (error) {
      console.error(`删除字段映射失败(ID:${id}):`, error);
      throw error;
    }
  },

  // 搜索数据
  search: async (params: { 
    query: string, 
    field: string, 
    apiConfigId: number,
    selection?: any
  }): Promise<any> => {
    try {
      // 实际项目中，这里应该调用外部API
      // 但由于我们正在移除后端，暂时返回模拟数据
      console.log('搜索参数:', params);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: "Search completed",
        data: {
          name: "字节跳动有限公司",
          industry: "互联网/科技服务",
          fields: {
            "法定代表人": "张一鸣",
            "注册资本": "3亿美元",
            "注册地址": "北京市海淀区知春路甲48号",
            "成立时间": "2012-03-09",
            "经营范围": "开发、设计、经营计算机软件；设计、制作、代理、发布广告；技术开发、技术转让、..."
          }
        }
      };
    } catch (error) {
      console.error('搜索失败:', error);
      throw error;
    }
  },

  // 更新记录
  update: async (params: {
    recordId: string,
    primaryKey: string,
    primaryKeyValue: string,
    apiConfigId: number,
    mappings: Array<{ id: number, sourceField: string, targetField: string, isActive: boolean }>,
    selection?: any
  }): Promise<any> => {
    try {
      console.log('更新参数:', params);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: "Update completed",
        updatedFields: params.mappings.filter(m => m.isActive).map(m => m.targetField)
      };
    } catch (error) {
      console.error('更新失败:', error);
      throw error;
    }
  }
};