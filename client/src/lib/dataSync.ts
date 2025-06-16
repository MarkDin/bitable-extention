import { bitable } from "@lark-base-open/js-sdk";

// FIXME: 这里的client_id、client_secret、username、password等敏感信息建议通过环境变量或安全方式管理
const BASE_URL = "https://crm-data-service-dk1543100966.replit.app/customer_info?id=";


export async function getCustomerInfoById(id: number | string): Promise<Record<string, any>> {
  // FIXME: 实现从API获取客户信息的逻辑
  return {};

  // const url = `${BASE_URL}${id}`;
  // const res = await fetch(url);
  // if (!res.ok) {
  //   throw new Error(`获取客户信息失败: ${res.statusText}`);
  // }
  // const json = await res.json();
  // if (json?.data?.errorInfo) {
  //   throw new Error(`获取客户信息失败: ${json.data.errorInfo.msg}`);
  // }
  // if (json.success) {
  //   return json.data;
  // }
  // throw new Error(`获取客户信息失败`);
}

// 示例调用
// getCustomerInfoById(3801058324038026).then(console.log).catch(console.error);
// FIXME: 建议将敏感信息移到安全的配置文件或环境变量中

// ========== 多维表格插件配置存储 ========== 
// 依赖 bitable.bridge 的 setData/getData 能力
// 文档参考：https://lark-base-team.github.io/js-sdk-docs/zh/api/bridge

const CONFIG_KEY = 'plugin_config_json';
const MAPPING_CONFIG_KEY = 'mapping_config';

/**
 * 存储配置（json对象）到多维表格
 * @param config 配置对象
 */
export async function setConfig(config: Config): Promise<boolean> {
  if (!config || typeof config !== 'object') {
    throw new Error('配置必须是一个对象');
  }

  if (!Array.isArray(config.field_list)) {
    throw new Error('配置必须包含 field_list 数组');
  }

  for (const field of config.field_list) {
    if (!field.name || !field.mapping_field) {
      throw new Error('field_list 中的每个字段必须包含 name 和 mapping_field 属性');
    }
  }
  return await bitable.bridge.setData(CONFIG_KEY, config);
}

/**
 * 设置字段映射配置
 * @param mappingConfig 字段映射配置数组
 */
export async function setMappingConfig(mappingConfig: Field[]): Promise<boolean> {
  if (!Array.isArray(mappingConfig)) {
    throw new Error('字段映射配置必须是一个数组');
  }

  for (const field of mappingConfig) {
    if (!field.name || !field.mapping_field) {
      throw new Error('字段映射配置中的每个字段必须包含 name 和 mapping_field 属性');
    }
  }

  return await bitable.bridge.setData(MAPPING_CONFIG_KEY, mappingConfig);
}

/**
 * 获取字段映射配置
 */
export async function getMappingConfig(): Promise<Field[] | null> {
  return await bitable.bridge.getData<Field[]>(MAPPING_CONFIG_KEY);
}

/**
 * 获取多维表格中存储的配置（json对象）
 */
export interface Field {
  name: string;
  mapping_field: string;
  query_type?: 'customer' | 'order' | 'both'; // 字段适用的查询类型（已废弃，保留用于兼容性）
}

export interface Config {
  field_list: Field[];
}

// 查询类型枚举
export enum QueryType {
  CUSTOMER = 'customer', // 客户简称
  ORDER = 'order'        // 订单ID
}

export interface MockGetDataByIdsResult {
  success: boolean;
  data: {
    result_map: Record<string, Record<string, string>>;
  };
  error_msg?: string;
}

/**
 * mock 获取数据接口，模拟 api.md 中定义的接口
 * @param id_list 需要获取的 id 列表
 * @returns 模拟的接口返回数据
 */
export async function mockGetDataByIds(id_list: string[]): Promise<MockGetDataByIdsResult> {
  // 生成 mock 数据
  const result_map: Record<string, Record<string, string>> = {};
  id_list.forEach((id, idx) => {
    result_map[id] = {
      accountName: `value1_${id}`,
      accountId: `value2_${id}`,
      accountType: `value3_${id}`,
      // industry: `value4_${id}`,
      // region: `value5_${id}`,
      // contactPerson: `value6_${id}`,
      // contactPhone: `value7_${id}`,
      // contactEmail: `value8_${id}`,
      // salesPerson: `value9_${id}`,
      // customerLevel: `value10_${id}`,
      // lastContactDate: `value11_${id}`,
      // nextFollowUpDate: `value12_${id}`,
      // remarks: `value13_${id}`,
    };
  });
  return {
    success: true,
    data: {
      result_map,
    },
    error_msg: '',
  };
}

export async function getConfig<T = Config>(): Promise<T | null> {
  return await bitable.bridge.getData<T>(CONFIG_KEY);
}
