import { bitable } from "@lark-base-open/js-sdk";

// FIXME: 这里的client_id、client_secret、username、password等敏感信息建议通过环境变量或安全方式管理
const BASE_URL = "https://crm-data-service-dk1543100966.replit.app/customer_info?id=";
const TOKEN_URL = "https://login.xiaoshouyi.com/auc/oauth2/token";

interface TokenResponse {
  access_token: string;
  [key: string]: any;
}

let token: string | null = null;

async function getAccessToken(): Promise<string> {
  if (token) return token;
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const data = new URLSearchParams({
    grant_type: "password",
    client_id: "2b2e284b2cc93453a654454f9f4c909b",
    client_secret: "1c39d769d68c8a9c582cb257552ee90d",
    username: "18310796971",
    password: "shigongdui2OQiiZqD",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers,
    body: data.toString(),
  });
  if (!res.ok) {
    throw new Error(`获取access_token失败: ${res.statusText}`);
  }
  const json: TokenResponse = await res.json();
  token = json.access_token;
  return token;
}

export async function getCustomerInfoById(id: number | string): Promise<any> {
    
  const url = `${BASE_URL}${id}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`获取客户信息失败: ${res.statusText}`);
  }
  const json = await res.json();
  if (json.success) {
    return json.data;
  }
  throw new Error(`获取客户信息失败`);
}

// 示例调用
// getCustomerInfoById(3801058324038026).then(console.log).catch(console.error);
// FIXME: 建议将敏感信息移到安全的配置文件或环境变量中

// ========== 多维表格插件配置存储 ========== 
// 依赖 bitable.bridge 的 setData/getData 能力
// 文档参考：https://lark-base-team.github.io/js-sdk-docs/zh/api/bridge

const CONFIG_KEY = 'plugin_config_json';

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
 * 获取多维表格中存储的配置（json对象）
 */
export interface Config {
  field_list: {
    name: string;
    mapping_field: string;
  }[];
}
export async function getConfig<T = Config>(): Promise<T | null> {
  return await bitable.bridge.getData<T>(CONFIG_KEY);
}

// 使用示例：
// await setConfig({a: 1, b: 2});
// const config = await getConfig();
// console.log(config);
