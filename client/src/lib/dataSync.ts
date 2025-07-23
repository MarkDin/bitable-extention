import { Field } from "@/types/common";
import { bitable, FieldType } from "@lark-base-open/js-sdk";

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


export interface Config {
  field_list: Field[];
}

// 查询类型枚举
export enum QueryType {
  CUSTOMER = 'customer', // 客户简称
  ORDER = 'order'        // 订单ID
}

export interface GetDataByIdsResult {
  success: boolean;
  data: {
    result_map: Record<string, Record<string, { value: string, source: string, systemName: string }>>;
  };
  error_msg?: string;
}

/**
 * 通过真实接口获取数据，替换mock
 * @param id_list 需要获取的 id 列表
 * @returns 接口返回数据
 */
export async function getDataByIds(id_list: string[]): Promise<GetDataByIdsResult> {
  console.log('getDataByIds', id_list);

  // 构建查询参数，每个ID作为一个单独的 id_list 参数
  const id_set = new Set(id_list);
  const queryParams = Array.from(id_set).map(id => `id_list=${encodeURIComponent(id)}`).join('&');
  const url = `https://api.intcomedical.com:8011/prod-api/external/order/orderDataCompletion?${queryParams}`;

  try {
    const res = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('getDataByIds res', res);
    if (!res.ok) {
      console.error('接口请求失败', res);
      throw new Error(`接口请求失败: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    // 兼容接口返回格式
    if (json.success || json.data) {
      return json;
    } else {
      console.error(json);
      throw new Error(json.error_msg || '接口返回失败');
    }
  } catch (error: any) {
    return {
      success: false,
      data: { result_map: {} },
      error_msg: error.message || '接口请求异常',
    };
  }
}

export async function getConfig<T = Config>(): Promise<T | null> {
  return await bitable.bridge.getData<T>(CONFIG_KEY);
}


export function getFieldTypeMapping(fieldName: string): FieldType {
  if (fieldName.includes('现存量')) {
    return FieldType.Number;
  }
  if (fieldName.includes('已收款金额')) {
    return FieldType.Number;
  }
  if (fieldName.includes('计划开始时间')) {
    return FieldType.DateTime;
  }
  if (fieldName.includes('计划结束时间')) {
    return FieldType.DateTime;
  }

  return FieldType.Text;
}