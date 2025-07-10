import { Field, FieldType } from "@/types/common";

// 飞书应用配置
const FEISHU_APP_ID = 'cli_a8823c9bb8f4900b';
const FEISHU_APP_SECRET = 'v4HA5OV8oGjzewbdAmHWu3cj65vQBoMq';
const APP_TOKEN = 'Tzgpbndy9a6aZfsKuKhcaFT8nag';
const TABLE_ID = 'tblbxDXCWmq9kaCT';

// 默认字段配置（用作fallback）
const DEFAULT_FIELDS: Field[] = [
    // NC字段
    { id: 'orderNo', name: '订单ID', mapping_field: 'orderNo', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'custShortName', name: '客户简称', mapping_field: 'custShortName', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'materialIndex', name: '产品索引号', mapping_field: 'materialIndex', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'debitamount', name: '已收款金额', mapping_field: 'debitamount', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'incomeName', name: '收款协议（NC）', mapping_field: 'incomeName', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'quantityOnHand', name: '现存量', mapping_field: 'quantityOnHand', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'salesperson', name: '销售负责人', mapping_field: 'salesperson', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'deliveryFactory', name: '发货工厂', mapping_field: 'deliveryFactory', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'custRequestDate', name: '客户要求日期', mapping_field: 'custRequestDate', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'deliveryDate', name: '签署PI交期', mapping_field: 'deliveryDate', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'boxOrNot', name: '箱盒是否下单', mapping_field: 'boxOrNot', type: 'NC', isChecked: false, isDisabled: false },

    // SMOM字段
    { id: 'plannedStartTime', name: '计划开始时间', mapping_field: 'plannedStartTime', type: 'SMOM', isChecked: false, isDisabled: false },
    { id: 'planEndTime', name: '计划结束时间', mapping_field: 'planEndTime', type: 'SMOM', isChecked: false, isDisabled: false },

    // TMS字段
    { id: 'bookingStatus', name: '订舱状态', mapping_field: 'bookingStatus', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'etd', name: 'ETD', mapping_field: 'etd', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'eta', name: 'ETA', mapping_field: 'eta', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'loadDate', name: '装柜时间', mapping_field: 'loadDate', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'needShipment', name: '是否需要出货', mapping_field: 'needShipment', type: 'TMS', isChecked: false, isDisabled: false },

    // CRM字段
    { id: 'customerCode', name: '客户编码', mapping_field: 'customerCode', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'custName', name: '客户全称', mapping_field: 'custName', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'country', name: '客户国家', mapping_field: 'country', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'publicSea', name: '所属区域公海', mapping_field: 'publicSea', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'publicSeaPoolStatus', name: '公海池状态', mapping_field: 'publicSeaPoolStatus', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'paymentPeriod', name: '账期', mapping_field: 'paymentPeriod', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'collectionAgreement', name: '收款协议（CRM）', mapping_field: 'collectionAgreement', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'estimatedRecoveryTime', name: '预计回收时间', mapping_field: 'estimatedRecoveryTime', type: 'CRM', isChecked: false, isDisabled: false },

    // MRP字段
    { id: 'isDraft', name: '图稿状态', mapping_field: 'isDraft', type: 'MRP', isChecked: false, isDisabled: false },
];

// 从多维表格记录转换为前端Field类型
interface BitableRecord {
    fields: {
        id: number;
        name: string;
        mapping_field: string;
        source: string;
    };
}

/**
 * 验证并转换字段类型
 */
function validateFieldType(type: string): FieldType {
    const validTypes: FieldType[] = ['NC', 'SMOM', 'TMS', 'CRM', 'MRP', '赛意'];
    if (validTypes.includes(type as FieldType)) {
        return type as FieldType;
    }
    console.warn(`[FieldsConfigService] 未知的字段类型: ${type}, 使用默认类型 'NC'`);
    return 'NC';
}

/**
 * 获取飞书访问令牌
 */
async function getFeishuToken(): Promise<string> {
    try {
        const response = await fetch('/api/feishu/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app_id: FEISHU_APP_ID,
                app_secret: FEISHU_APP_SECRET
            })
        });

        if (!response.ok) {
            throw new Error(`获取Token失败: ${response.status}`);
        }

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`获取Token失败: ${data.msg}`);
        }

        return data.tenant_access_token;
    } catch (error) {
        console.error('获取飞书Token失败:', error);
        throw error;
    }
}

/**
 * 从多维表格获取字段配置
 */
async function fetchFieldsFromBitable(): Promise<Field[]> {
    try {
        const token = await getFeishuToken();

        // 获取所有记录（支持分页）
        let has_more = true;
        let page_token = '';
        let allRecords: BitableRecord[] = [];

        while (has_more) {
            const url = `/api/feishu/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100${page_token ? `&page_token=${page_token}` : ''}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`获取记录失败: ${response.status}`);
            }

            const data = await response.json();
            if (data.code !== 0) {
                throw new Error(`获取记录失败: ${data.msg}`);
            }

            allRecords = allRecords.concat(data.data.items);
            has_more = data.data.has_more;
            page_token = data.data.page_token;
        }

        console.log(`[FieldsConfigService] 从多维表格获取到 ${allRecords.length} 条字段配置`);

        // 转换为前端需要的格式
        const fields: Field[] = allRecords
            .map((record) => {
                const { fields } = record;
                return {
                    id: fields.mapping_field, // 使用mapping_field作为id
                    name: fields.name,
                    mapping_field: fields.mapping_field,
                    type: validateFieldType(fields.source), // 验证并转换字段类型
                    isChecked: false,
                    isDisabled: false
                };
            })
            .filter(field => field.name && field.mapping_field); // 过滤掉无效记录

        return fields;
    } catch (error) {
        console.error('从多维表格获取字段配置失败:', error);
        throw error;
    }
}

/**
 * 获取字段配置（带fallback）
 */
export async function getFieldsConfig(): Promise<Field[]> {
    try {
        console.log('[FieldsConfigService] 正在从多维表格获取字段配置...');
        const fields = await fetchFieldsFromBitable();

        if (fields.length === 0) {
            console.warn('[FieldsConfigService] 多维表格中没有字段配置，使用默认配置');
            return DEFAULT_FIELDS;
        }

        console.log(`[FieldsConfigService] 成功获取 ${fields.length} 个字段配置`);
        return fields;
    } catch (error) {
        console.error('[FieldsConfigService] 获取字段配置失败，使用默认配置:', error);
        return DEFAULT_FIELDS;
    }
}

/**
 * 刷新字段配置缓存
 */
export async function refreshFieldsConfig(): Promise<Field[]> {
    // 清除可能的缓存
    console.log('[FieldsConfigService] 刷新字段配置...');
    return await getFieldsConfig();
} 