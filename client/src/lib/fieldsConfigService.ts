import { Field } from "@/types/common";

// 飞书应用配置
const FEISHU_APP_ID = 'cli_a8823c9bb8f4900b';
const FEISHU_APP_SECRET = 'v4HA5OV8oGjzewbdAmHWu3cj65vQBoMq';
const APP_TOKEN = 'Tzgpbndy9a6aZfsKuKhcaFT8nag';
const TABLE_ID = 'tblbxDXCWmq9kaCT';

// 后端服务配置
const BACKEND_SERVICE_URL = 'https://crm-data-service-dk1543100966.replit.app';

// 默认字段配置（用作fallback）
const DEFAULT_FIELDS: Field[] = [
    // NC字段
    { id: '1', name: '订单ID', mapping_field: 'orderNo', type: 'NC', isChecked: false, isDisabled: false },
    { id: '2', name: '客户简称', mapping_field: 'custShortName', type: 'NC', isChecked: false, isDisabled: false },
    { id: '3', name: '产品索引号', mapping_field: 'materialIndex', type: 'NC', isChecked: false, isDisabled: false },
    { id: '4', name: '已收款金额', mapping_field: 'debitamount', type: 'NC', isChecked: false, isDisabled: false },
    { id: '5', name: '收款协议（NC）', mapping_field: 'incomeName', type: 'NC', isChecked: false, isDisabled: false },
    { id: '6', name: '现存量', mapping_field: 'quantityOnHand', type: 'NC', isChecked: false, isDisabled: false },
    { id: '7', name: '销售负责人', mapping_field: 'salesperson', type: 'NC', isChecked: false, isDisabled: false },
    { id: '8', name: '发货工厂', mapping_field: 'deliveryFactory', type: 'NC', isChecked: false, isDisabled: false },
    { id: '9', name: '客户要求日期', mapping_field: 'custRequestDate', type: 'NC', isChecked: false, isDisabled: false },
    { id: '10', name: '签署PI交期', mapping_field: 'deliveryDate', type: 'NC', isChecked: false, isDisabled: false },
    { id: '11', name: '箱盒是否下单', mapping_field: 'boxOrNot', type: 'NC', isChecked: false, isDisabled: false },

    // SMOM字段
    { id: '12', name: '计划开始时间', mapping_field: 'plannedStartTime', type: 'SMOM', isChecked: false, isDisabled: false },
    { id: '13', name: '计划结束时间', mapping_field: 'planEndTime', type: 'SMOM', isChecked: false, isDisabled: false },

    // TMS字段
    { id: '14', name: '订舱状态', mapping_field: 'bookingStatus', type: 'TMS', isChecked: false, isDisabled: false },
    { id: '15', name: 'ETD', mapping_field: 'etd', type: 'TMS', isChecked: false, isDisabled: false },
    { id: '16', name: 'ETA', mapping_field: 'eta', type: 'TMS', isChecked: false, isDisabled: false },
    { id: '17', name: '装柜时间', mapping_field: 'loadDate', type: 'TMS', isChecked: false, isDisabled: false },
    { id: '18', name: '是否需要出货', mapping_field: 'needShipment', type: 'TMS', isChecked: false, isDisabled: false },

    // CRM字段
    { id: '19', name: '客户编码', mapping_field: 'customerCode', type: 'CRM', isChecked: false, isDisabled: false },
    { id: '20', name: '客户全称', mapping_field: 'custName', type: 'CRM', isChecked: false, isDisabled: false },
    { id: '21', name: '客户国家', mapping_field: 'country', type: 'CRM', isChecked: false, isDisabled: false },
    { id: '22', name: '所属区域公海', mapping_field: 'publicSea', type: 'CRM', isChecked: false, isDisabled: false },
    { id: '23', name: '公海池状态', mapping_field: 'publicSeaPoolStatus', type: 'CRM', isChecked: false, isDisabled: false },
    { id: '24', name: '账期', mapping_field: 'paymentPeriod', type: 'CRM', isChecked: false, isDisabled: false },
    { id: '25', name: '收款协议（CRM）', mapping_field: 'collectionAgreement', type: 'CRM', isChecked: false, isDisabled: false },
    { id: '26', name: '预计回收时间', mapping_field: 'estimatedRecoveryTime', type: 'CRM', isChecked: false, isDisabled: false },

    // MRP字段
    { id: '27', name: '图稿状态', mapping_field: 'isDraft', type: 'MRP', isChecked: false, isDisabled: false },
];

// 从多维表格记录转换为前端Field类型
interface BitableRecord {
    fields: {
        id: number;
        name: string;
        mapping_field: string;
        source: string;
        enable: number;
    };
}

/**
 * 从多维表格获取字段配置（通过后端服务）
 */
async function fetchFieldsFromBitable(): Promise<Field[]> {
    try {
        // 构建请求URL，使用查询参数
        const params = new URLSearchParams({
            app_id: FEISHU_APP_ID,
            app_secret: FEISHU_APP_SECRET,
            app_token: APP_TOKEN,
            table_id: TABLE_ID
        });

        const url = `${BACKEND_SERVICE_URL}/get_config_from_bitable?${params.toString()}`;

        console.log(`[FieldsConfigService] 正在请求后端服务: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`请求后端服务失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 检查后端服务返回的数据格式
        if (!data.success) {
            throw new Error(`后端服务返回错误: ${data.message || '未知错误'}`);
        }

        // 根据实际的后端服务返回数据结构进行适配
        // 实际格式为 { success: true, data: { fields: [...], total_count: 28 } }
        const records = data.data?.fields || [];

        console.log(`[FieldsConfigService] 从后端服务获取到 ${records.length} 条字段配置`);

        // 转换为前端需要的格式
        // 后端已经返回了符合前端期望的数据格式，只需要简单处理
        const fields: Field[] = records
            .map((record: any) => ({
                id: record.id || record.mapping_field, // 使用id或mapping_field作为id
                name: record.name,
                mapping_field: record.mapping_field,
                type: record.type,
                isChecked: record.isChecked || false, // 保持后端设置或默认false
                isDisabled: record.isDisabled || false, // 保持后端设置或默认false
                originalId: record.id // 保留原始的多维表格id用于排序
            }))
            .filter((field: Field) => field.name && field.mapping_field) // 过滤掉无效记录
        // .sort((a, b) => {
        //     // 按照多维表格中的id字段进行排序
        //     const idA = parseInt(a.originalId) || 0;
        //     const idB = parseInt(b.originalId) || 0;
        //     return idA - idB;
        // });

        console.log(`[FieldsConfigService] 字段已按多维表格顺序排序，原始ID顺序:`,
            fields.map(f => `${f.name}(${f.originalId})`));

        return fields;
    } catch (error) {
        console.error('从后端服务获取字段配置失败:', error);
        throw error;
    }
}

/**
 * 获取字段配置（带fallback）
 */
export async function getFieldsConfig(): Promise<Field[]> {
    try {
        console.log('[FieldsConfigService] 正在从后端服务获取字段配置...');
        const fields = await fetchFieldsFromBitable();

        if (fields.length === 0) {
            console.warn('[FieldsConfigService] 后端服务返回空数据，使用默认配置');
            return DEFAULT_FIELDS;
        }

        console.log(`[FieldsConfigService] 成功获取 ${fields.length} 个字段配置, 字段配置为: ${JSON.stringify(fields)}`);
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