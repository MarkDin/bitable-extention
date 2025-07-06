const { OpenAI } = require('openai');
const axios = require('axios');
const ImageMerger = require('./imageMerger');
let prompt = `
=# 角色定位：专业销售线索信息提取代理助手

## 角色说明：
你是一位专注于图片信息结构化提取的智能助手，擅长从图片中准确识别销售线索，客户公司及其联系人信息，具备根据地址判断国家、区分电话与传真、提取多语言姓名、识别职位等高级能力。最终输出标准化 JSON 数据，适用于销售线索系统。

---

## 核心任务目标：

从结合聊天记录，从图片中分析提取以下信息，结构化输出。严格遵守字段格式，确保结果真实可靠。
聊天记录：{{chatText}}

---

## 提取字段与说明：

### 公司级字段（单个）：

| 字段名       | 说明                                         |
| ------------ | -------------------------------------------- |
| company_name | 客户公司名称                                |
| website      | 公司官网网址                                 |
| address      | 公司地址（将双引号替换为空）                     |
| country_code | 公司所在国家的 Alpha-2 编码（例如：CN、US）    |
| product      | 产品类别或主营业务                           |
| intent       | 采购或合作意向           |
| importData   | 海关进口数据                     |
| notes        | 备注说明，记录识别异常、字段缺失、验证结果等 |

> - 若识别地址中包含国家名，请据此判断其 Alpha-2 编码（标准 ISO 3166-1 alpha-2）
> - 若识别公司名为"intco"或"英科"，请识别为"我方公司"，**不作为客户公司输出**
> - 所有字段若识别不出输出空字符串**
---

### 联系人字段（支持多个）：

| 字段名         | 说明                                                        |
| -------------- | --------------------------------------------------|
| contact_person | 联系人姓名（如有多语言姓名，请合并为一个字段，用 \`/\` 分隔） |
| position          | 职位（如 Manager、采购主管、工程总监等）             |
| phone          | 电话号码（保留有效号码，去除传真号码）                   |
| email          | 邮箱地址（须符合邮箱格式）                             |
| whatsapp       | WhatsApp 联系方式（如识别出）                         |
| wechat         | 微信号（如识别出）                                    |

> - 多语言姓名示例：\`王伟 / Wei Wang\`
> - 传真号码通常包含"fax"字样或出现在"Tel / Fax"之后，请识别并排除，仅保留电话号码
> - 所有邮箱字段必须满足正则：\`^[^\@\\s]+\@[^\@\\s]+\\.[^\@\\s]+$\`
> - 电话字段仅保留数字、\`+\` 和 \`-\`，格式合法；如字段内容为传真，留空
> - 所有字段若识别不出输出空字符串，不允许任何字段删减

---

## 工具调用策略：

- 如果字段内容无法直接识别，允许调用工具不超过 **3 次** 补全
- 工具结果如与图片识别结果不一致，请保留图片识别值，工具值写入 notes 字段说明

---

## 输出要求（必须为以下 JSON 格式，不允许有字段增删，去除内容中例如引号、换行等破坏json结构的字符）：

\`\`\`json
{
  "company_name": "",
  "website": "",
  "address": "",
  "country_code": "",
  "product": "",
  "intent": "",
  "importData": "",
  "notes": "",
  "contacts": [
    {
      "contact_person": "",
      "position": "",
      "phone": "",
      "email": "",
      "whatsapp": "",
      "wechat": ""
    }
  ]
}
\`\`\`
`;

const FEISHU_APP_ID = 'cli_a8823c9bb8f4900b';
const FEISHU_APP_SECRET = 'v4HA5OV8oGjzewbdAmHWu3cj65vQBoMq';
// TODO: 请填写您的 OpenRouter API Key (格式: sk-or-v1-xxxxxx)
const OPENROUTER_API_KEY = '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';

// 设置全局代理配置
const { HttpsProxyAgent } = require('https-proxy-agent');
// 设置全局代理配置
const proxyUrl = 'http://127.0.0.1:7890';
const httpsAgent = new HttpsProxyAgent(proxyUrl);

// 创建不带代理的axios实例（用于飞书API）
const axiosWithoutProxy = axios.create();

// 创建带代理的axios实例（用于OpenRouter相关请求）
const axiosWithProxy = axios.create({
    proxy: {
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890
    }
});

const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    httpAgent: httpsAgent
});

const APP_TOKEN = 'Tzgpbndy9a6aZfsKuKhcaFT8nag';
const TABLE_ID = 'tblbxDXCWmq9kaCT';

async function main() {
    try {
        // 1. 获取飞书Token
        const tokenResp = await axiosWithoutProxy.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: FEISHU_APP_ID,
            app_secret: FEISHU_APP_SECRET
        });
        const tenant_access_token = tokenResp.data.tenant_access_token;
        console.log(tenant_access_token);

        // 1.5 获取表格字段信息（可选）
        // try {
        //   const fieldsResp = await axiosWithoutProxy.get(
        //     `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/fields`,
        //     { headers: { Authorization: `Bearer ${tenant_access_token}` } }
        //   );
        //   console.log('表格字段信息:', JSON.stringify(fieldsResp.data.data.items, null, 2));
        // } catch (error) {
        //   console.error('获取字段信息失败:', error.response?.data || error.message);
        // }

        // 2. 获取所有多维表格记录（分页）
        let has_more = true;
        let page_token = '';
        let allRecords = [];
        while (has_more) {
            const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100${page_token ? `&page_token=${page_token}` : ''}`;
            const resp = await axiosWithoutProxy.get(url, {
                headers: { Authorization: `Bearer ${tenant_access_token}` }
            });
            const data = resp.data.data;
            allRecords = allRecords.concat(data.items);
            has_more = data.has_more;
            page_token = data.page_token;
        }
        console.log(`共获取到 ${allRecords.length} 条记录`);

        // 3. 遍历每条记录，处理图片（测试模式：只处理前5条）
        let processedCount = 0;
        for (const record of allRecords) {
            if (processedCount >= 5) {
                console.log('🔄 测试模式：已处理5条记录，停止处理');
                break;
            }
            const recordId = record.record_id;
            const chatText = record.fields?.聊天记录?.[0]?.text || '';
            const attachments = record.fields?.图片 || [];
            console.log(attachments)
            const imageUrls = attachments.map(item => item.url);

            console.log(`正在处理记录: ${recordId}, 图片数量: ${imageUrls.length}`);

            let mergedImageUrl = '';
            let base64Image = '';
            let isSingleImage = true;

            // 使用新的ImageMerger模块处理多图合并
            let mergeResult;
            try {
                // 创建ImageMerger实例
                const imageMerger = new ImageMerger({
                    proxy: {
                        protocol: 'http',
                        host: '127.0.0.1',
                        port: 7890
                    }
                });

                // 备选方案处理函数
                const fallbackHandler = async (imageUrl) => {
                    const response = await axiosWithoutProxy.get(imageUrl, {
                        headers: { Authorization: `Bearer ${tenant_access_token}` },
                        responseType: 'arraybuffer'
                    });
                    return Buffer.from(response.data).toString('base64');
                };

                // 执行图片合并
                mergeResult = await imageMerger.mergeImages({
                    imageUrls: imageUrls,
                    appId: FEISHU_APP_ID,
                    appSecret: FEISHU_APP_SECRET,
                    direction: 'vertical',
                    fallbackHandler: fallbackHandler
                });

                if (mergeResult.success) {
                    mergedImageUrl = mergeResult.url;
                    isSingleImage = mergeResult.isSingleImage;

                    // 如果使用了备选方案且有fallbackResult，直接使用base64
                    if (mergeResult.fallbackUsed && mergeResult.fallbackResult) {
                        base64Image = mergeResult.fallbackResult;
                        console.log('使用备选方案，图片下载完成，base64长度:', base64Image.length);
                    } else if (mergeResult.isSingleImage) {
                        // 单张图片，需要下载转换为base64
                        try {
                            const response = await axiosWithoutProxy.get(mergedImageUrl, {
                                headers: { Authorization: `Bearer ${tenant_access_token}` },
                                responseType: 'arraybuffer'
                            });
                            base64Image = Buffer.from(response.data).toString('base64');
                            console.log('图片下载成功，base64长度:', base64Image.length);
                        } catch (error) {
                            console.error('图片下载失败:', error);
                            continue;
                        }
                    } else {
                        // 多图合并成功，使用URL
                        console.log('多图合并成功，将使用URL:', mergedImageUrl);
                    }
                } else {
                    console.error('图片处理失败:', mergeResult.message);
                    continue;
                }
            } catch (error) {
                console.error('图片合并模块执行失败:', error.message);
                continue;
            }

            if (imageUrls.length === 0) {
                console.log('无图片，跳过处理');
                continue;
            }

            // 4. AI识别与结构化提取
            let output = {};
            let messages = [];

            if (isSingleImage) {
                // 单张图片使用base64
                messages = [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: (prompt.replace('{{chatText}}', chatText) || "").trim() || "Please analyze this image and provide details."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ];
            } else {
                // 多张图片合并后使用URL
                messages = [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: (prompt.replace('{{chatText}}', chatText) || "").trim() || "Please analyze this image and provide details."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: mergedImageUrl
                                }
                            }
                        ]
                    }
                ];
            }

            try {
                console.log('正在调用 AI 服务进行识别...');
                const response = await openrouter.chat.completions.create({
                    model: "google/gemini-2.5-flash-preview",
                    messages: messages,
                    response_format: { type: "json_object" },
                    max_tokens: 4000
                });

                if (response.choices && response.choices[0] && response.choices[0].message.content) {
                    output = JSON.parse(response.choices[0].message.content);
                    console.log('AI 识别结果:', output);
                }
            } catch (e) {
                console.error('调用 AI 服务失败', e);
            }

            // 5. 写回多维表格（暂时禁用用于测试）
            if (output && Object.keys(output).length > 0) {
                console.log('✅ AI识别成功，提取的数据:', {
                    "客户名称": output.company_name,
                    "国家代码": output.country_code,
                    "联系人": output.contacts?.[0]?.contact_person || '',
                    "职位": output.contacts?.[0]?.position || '',
                    "电话": output.contacts?.[0]?.phone || '',
                    "WhatsApp": output.contacts?.[0]?.whatsapp || '',
                    "微信": output.contacts?.[0]?.wechat || '',
                    "邮箱": output.contacts?.[0]?.email || ''
                });

                // TODO: 解决权限问题后启用写回功能
                console.log('💾 数据写回功能暂时禁用');
            } else {
                console.log(`❌ 记录 ${recordId} 的AI识别结果为空`);
            }

            // 处理完当前记录，继续下一条记录
            processedCount++;
        }
        console.log('全部处理完成');
    } catch (err) {
        console.error(err);
    }
}

main();